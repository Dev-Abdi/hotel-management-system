import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const role = (
      session.user as {
        role?: string;
      }
    ).role;

    if (role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only an administrator can access reports.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userId = searchParams.get("userId");

    /*
     * ==========================================
     * USERS LIST
     * ==========================================
     */

    if (type === "users-list") {
      const users = await prisma.user.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      });

      return NextResponse.json({
        success: true,
        users,
      });
    }

    /*
     * ==========================================
     * VALIDATE REPORT REQUEST
     * ==========================================
     */

    if (
      type !== "users" &&
      type !== "business"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report type.",
        },
        { status: 400 }
      );
    }

    if (!from || !to) {
      return NextResponse.json(
        {
          success: false,
          message: "From date and To date are required.",
        },
        { status: 400 }
      );
    }

    if (from > to) {
      return NextResponse.json(
        {
          success: false,
          message: "From date cannot be after To date.",
        },
        { status: 400 }
      );
    }

    /*
     * Use the selected dates as a complete local-day range.
     */

    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T23:59:59.999`);

    /*
     * ==========================================
     * USERS REPORT
     * ==========================================
     *
     * ONLY the selected user's posted sales.
     */

    if (type === "users") {
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            message: "Please select a user.",
          },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found.",
          },
          { status: 404 }
        );
      }

      const sales = await prisma.sale.findMany({
        where: {
          postedById: userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
        },
      });

      const totalSales = sales.reduce(
        (total, sale) => total + sale.amount,
        0
      );

      return NextResponse.json({
        success: true,
        type: "users",

        period: {
          from,
          to,
        },

        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },

        totalSales,
      });
    }

    /*
     * ==========================================
     * BUSINESS REPORT
     * ==========================================
     *
     * Total Sales
     * = Cash + M-Pesa + Credit
     *
     * Profit With Credit
     * = Cash + M-Pesa + Credit - Expenses
     *
     * Profit Without Credit
     * = Cash + M-Pesa - Expenses
     */

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        paymentMethod: true,
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    });

    let cash = 0;
    let mpesa = 0;
    let credit = 0;

    for (const sale of sales) {
      if (sale.paymentMethod === "CASH") {
        cash += sale.amount;
      }

      if (sale.paymentMethod === "MPESA") {
        mpesa += sale.amount;
      }

      if (sale.paymentMethod === "CREDIT") {
        credit += sale.amount;
      }
    }

    const totalSales =
      cash + mpesa + credit;

    const totalExpenses = expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );

    const profitWithCredit =
      cash +
      mpesa +
      credit -
      totalExpenses;

    const profitWithoutCredit =
      cash +
      mpesa -
      totalExpenses;

    return NextResponse.json({
      success: true,
      type: "business",

      period: {
        from,
        to,
      },

      business: {
        totalSales,
        cash,
        mpesa,
        credit,
        expenses: totalExpenses,

        profitWithCredit,
        profitWithoutCredit,
      },
    });

  } catch (error) {
    console.error(
      "REPORT API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate report.",
      },
      { status: 500 }
    );
  }
}