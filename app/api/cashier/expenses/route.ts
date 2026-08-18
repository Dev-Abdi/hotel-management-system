import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET TODAY'S EXPENSES
========================================================= */

export async function GET() {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const role =
      String(
        session.user.role || ""
      )
        .trim()
        .toUpperCase();

    /*
     * CASHIER ONLY
     */

    if (role !== "CASHIER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Cashiers can access expenses.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       TODAY
    ===================================================== */

    const now = new Date();

    const startOfToday =
      new Date(now);

    startOfToday.setHours(
      0,
      0,
      0,
      0
    );

    const endOfToday =
      new Date(now);

    endOfToday.setHours(
      23,
      59,
      59,
      999
    );

    /* =====================================================
       LOAD EXPENSES
    ===================================================== */

    const expenses =
      await prisma.expense.findMany({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },

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

    /* =====================================================
       TOTAL
    ===================================================== */

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
      "GET CASHIER EXPENSES ERROR:",
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
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST EXPENSE
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const role =
      String(
        session.user.role || ""
      )
        .trim()
        .toUpperCase();

    /*
     * CASHIER ONLY
     */

    if (role !== "CASHIER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Cashiers can record expenses.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       USER ID
    ===================================================== */

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
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       REQUEST BODY
    ===================================================== */

    const body =
      await request.json();

    const amount =
      Number(body.amount);

    const category =
      String(
        body.category || ""
      )
        .trim()
        .toUpperCase();

    const paymentMethod =
      String(
        body.paymentMethod || ""
      )
        .trim()
        .toUpperCase();

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    /* =====================================================
       VALIDATE AMOUNT
    ===================================================== */

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
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE CATEGORY
    ===================================================== */

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
            "Please select a valid expense category.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE PAYMENT METHOD
       
       Expenses can be paid by Cash or M-Pesa.
       Credit is not allowed for expenses.
    ===================================================== */

    if (
      paymentMethod !== "CASH" &&
      paymentMethod !== "MPESA"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Expenses can only be paid by Cash or M-Pesa.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       CREATE EXPENSE
       
       IMPORTANT:
       There is NO TIME RESTRICTION.
       
       Cashier can record expenses at any time.
    ===================================================== */

    const expense =
      await prisma.expense.create({
        data: {
          amount,

          category:
            category as
              | "FOOD_SUPPLIES"
              | "DRINKS"
              | "SALARIES"
              | "TRANSPORT"
              | "UTILITIES"
              | "MAINTENANCE"
              | "RENT"
              | "OTHER",

          description:
            description ||
            null,

          paymentMethod:
            paymentMethod as
              | "CASH"
              | "MPESA",

          recordedById:
            userId,
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

    return NextResponse.json(
      {
        success: true,

        message:
          "Expense recorded successfully.",

        expense,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST CASHIER EXPENSE ERROR:",
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
      {
        status: 500,
      }
    );
  }
}