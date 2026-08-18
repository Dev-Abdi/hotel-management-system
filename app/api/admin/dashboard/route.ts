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
          message: "Only administrators can access the dashboard.",
        },
        { status: 403 }
      );
    }

    /*
     * TODAY
     */
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    /*
     * YESTERDAY
     */
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfYesterday = new Date(startOfToday);
    endOfYesterday.setMilliseconds(-1);

    /*
     * -----------------------------------------
     * SALES
     * -----------------------------------------
     *
     * Every user's sale contributes to Total Sales.
     */
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        amount: true,
        paymentMethod: true,
      },
    });

    const totalSales = sales.reduce(
      (total, sale) => total + sale.amount,
      0
    );

    /*
     * Credit is still a sale.
     * It is NOT an expense.
     */
    const credit = sales
      .filter((sale) => sale.paymentMethod === "CREDIT")
      .reduce((total, sale) => total + sale.amount, 0);

    /*
     * -----------------------------------------
     * EXPENSES
     * -----------------------------------------
     */
    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        amount: true,
      },
    });

    const totalExpenses = expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    /*
     * -----------------------------------------
     * PROFIT
     * -----------------------------------------
     *
     * Credit is NOT deducted.
     */
    const profit = totalSales - totalExpenses;

    /*
     * -----------------------------------------
     * CASHIER RECONCILIATION
     * -----------------------------------------
     *
     * Cash:
     * Today's closing cash - yesterday's closing cash.
     *
     * M-Pesa:
     * Today's entered balance because M-Pesa is
     * transferred out every day and starts fresh.
     */

    const todayReconciliation =
      await prisma.reconciliation.findFirst({
        where: {
          id: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        orderBy: {
          id: "desc",
        },
        select: {
          actualCash: true,
          actualMpesa: true,
        },
      });

    const yesterdayReconciliation =
      await prisma.reconciliation.findFirst({
        where: {
          id: {
            gte: startOfYesterday,
            lte: endOfYesterday,
          },
        },
        orderBy: {
          id: "desc",
        },
        select: {
          actualCash: true,
        },
      });

    const currentCash =
      todayReconciliation?.actualCash ?? 0;

    const previousCash =
      yesterdayReconciliation?.actualCash ?? 0;

    const cash = Math.max(
      0,
      currentCash - previousCash
    );

    const mpesa =
      todayReconciliation?.actualMpesa ?? 0;

    return NextResponse.json({
      success: true,

      data: {
        totalSales,
        cash,
        mpesa,
        credit,
        expenses: totalExpenses,
        profit,

        reconciliation: {
          submitted: !!todayReconciliation,
          currentCash,
          previousCash,
          currentMpesa: mpesa,
        },
      },
    });
  } catch (error) {
    console.error(
      "ADMIN DASHBOARD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load dashboard information.",
      },
      { status: 500 }
    );
  }
}