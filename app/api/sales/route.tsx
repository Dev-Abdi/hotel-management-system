import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators can access all sales.",
        },
        { status: 403 }
      );
    }

    // Today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's sales
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate today's total sales
    const totalSales = sales.reduce(
      (total, sale) => total + sale.amount,
      0
    );

    // Calculate sales total for each user
    const salesByUser = Object.values(
      sales.reduce(
        (groups, sale) => {
          const userId = sale.postedBy.id;

          if (!groups[userId]) {
            groups[userId] = {
              userId,
              name: sale.postedBy.name,
              username: sale.postedBy.username,
              role: sale.postedBy.role,
              total: 0,
              count: 0,
            };
          }

          groups[userId].total += sale.amount;
          groups[userId].count += 1;

          return groups;
        },
        {} as Record<
          string,
          {
            userId: string;
            name: string;
            username: string;
            role: string;
            total: number;
            count: number;
          }
        >
      )
    );

    return NextResponse.json({
      success: true,
      totalSales,
      salesByUser,
      sales,
    });
  } catch (error) {
    console.error("ADMIN SALES GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load sales.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators can post sales.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const amount = Number(body.amount);
    const description = String(body.description || "").trim();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid sale amount.",
        },
        { status: 400 }
      );
    }

    /*
     * Payment method is intentionally not shown to the Admin.
     *
     * The database Sale model still requires a paymentMethod,
     * so Admin-posted food sales are stored as CASH internally.
     */
    const sale = await prisma.sale.create({
      data: {
        amount,
        paymentMethod: "CASH",
        description: description || null,
        postedById: session.user.id,
      },
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Food sale posted successfully.",
      sale,
    });
  } catch (error) {
    console.error("ADMIN SALES POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to post sale.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators can delete sales.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = String(body.id || "");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Sale ID is required.",
        },
        { status: 400 }
      );
    }

    // Check that the sale exists
    const existingSale = await prisma.sale.findUnique({
      where: {
        id,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        {
          success: false,
          message: "Sale not found.",
        },
        { status: 404 }
      );
    }

    await prisma.sale.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sale deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN SALES DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete sale.",
      },
      { status: 500 }
    );
  }
}