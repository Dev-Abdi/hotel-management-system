import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const expenses =
      await prisma.expense.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          recordedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

    const totalExpenses =
      expenses.reduce(
        (total, expense) =>
          total + expense.amount,
        0
      );

    return NextResponse.json({
      success: true,
      expenses,
      totalExpenses,
    });

  } catch (error) {
    console.error(
      "GET EXPENSES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load expenses.",
      },
      { status: 500 }
    );
  }
}


export async function POST(
  request: Request
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const userId = (
      session.user as {
        id?: string;
      }
    ).id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to identify the logged-in user.",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const amount =
      Number(body.amount);

    const category =
      typeof body.category === "string"
        ? body.category
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const paymentMethod =
      typeof body.paymentMethod === "string"
        ? body.paymentMethod
        : "";


    // ==========================================
    // VALIDATION
    // ==========================================

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid expense amount.",
        },
        { status: 400 }
      );
    }

    const validCategories = [
      "FOOD_SUPPLIES",
      "DRINKS",
      "SALARIES",
      "TRANSPORT",
      "UTILITIES",
      "MAINTENANCE",
      "RENT",
      "OTHER",
    ];

    if (
      !validCategories.includes(
        category
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid expense category.",
        },
        { status: 400 }
      );
    }

    /*
     * Expenses should be paid through
     * cash or M-Pesa.
     *
     * CREDIT is intentionally rejected.
     */

    if (
      paymentMethod !== "CASH" &&
      paymentMethod !== "MPESA"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Expense payment method must be CASH or MPESA.",
        },
        { status: 400 }
      );
    }


    // ==========================================
    // CREATE EXPENSE
    // ==========================================

    const expense =
      await prisma.expense.create({
        data: {
          amount: Math.round(amount),
          category,
          description:
            description || null,
          paymentMethod,
          recordedById: userId,
        },

        include: {
          recordedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });


    return NextResponse.json({
      success: true,
      message:
        "Expense recorded successfully.",
      expense,
    });

  } catch (error) {
    console.error(
      "POST EXPENSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to record expense.",
      },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const userRole =
      (
        session.user as {
          role?: string;
        }
      ).role;

    /*
     * Only ADMIN can delete expenses.
     */

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only an administrator can delete expenses.",
        },
        { status: 403 }
      );
    }

    const body =
      await request.json();

    const id =
      typeof body.id === "string"
        ? body.id
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Expense ID is required.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.expense.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Expense not found.",
        },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Expense deleted successfully.",
    });

  } catch (error) {
    console.error(
      "DELETE EXPENSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete expense.",
      },
      { status: 500 }
    );
  }
}