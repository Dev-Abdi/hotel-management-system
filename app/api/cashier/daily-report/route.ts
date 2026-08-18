import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* =========================================================
   KENYA DATE / TIME
========================================================= */

function getKenyaNow() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Africa/Nairobi",
    })
  );
}

/* =========================================================
   BUSINESS DATE
========================================================= */

function getBusinessDate() {
  const now = getKenyaNow();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
}

/* =========================================================
   SUBMISSION WINDOW

   Daily reports can be submitted between:

   22:30 - 00:00

   M-Pesa always starts from ZERO.
========================================================= */

function isWithinSubmissionWindow() {
  const now = getKenyaNow();

  const minutes =
    now.getHours() * 60 +
    now.getMinutes();

  return (
    minutes >= 22 * 60 + 30 ||
    minutes === 0
  );
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatReportDate(date: Date) {
  return date.toLocaleDateString("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* =========================================================
   GET DAILY DATA
========================================================= */

async function getDailyReportData() {
  const businessDate =
    getBusinessDate();

  const start =
    new Date(businessDate);

  const end =
    new Date(businessDate);

  end.setDate(
    end.getDate() + 1
  );

  /* =======================================================
     SALES
  ======================================================= */

  const sales =
    await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },

      select: {
        amount: true,
        paymentMethod: true,
      },
    });

  /* =======================================================
     EXPENSES
  ======================================================= */

  const expenses =
    await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },

      select: {
        amount: true,
      },
    });

  /* =======================================================
     TOTAL SALES
  ======================================================= */

  const totalSales =
    sales.reduce(
      (total, sale) =>
        total + sale.amount,
      0
    );

  /* =======================================================
     CREDIT SALES
  ======================================================= */

  const creditSales =
    sales
      .filter(
        (sale) =>
          sale.paymentMethod ===
          "CREDIT"
      )
      .reduce(
        (total, sale) =>
          total + sale.amount,
        0
      );

  /* =======================================================
     TOTAL EXPENSES
  ======================================================= */

  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );

  /* =======================================================
     EXISTING REPORT
  ======================================================= */

  const existing =
    await prisma.reconciliation.findUnique(
      {
        where: {
          id: businessDate,
        },
      }
    );

  /* =======================================================
     RETURN REPORT
     
     IMPORTANT:
     There is NO openingMpesa.
     
     M-Pesa starts from ZERO every day.
  ======================================================= */

  return {
    reportDate:
      formatReportDate(
        businessDate
      ),

    totalSales,

    totalExpenses,

    creditSales,

    actualCash:
      existing
        ? existing.actualCash
        : null,

    actualMpesa:
      existing
        ? existing.actualMpesa
        : null,

    submitted:
      Boolean(existing),

    submittedAt:
      existing
        ? existing.createdAt.toISOString()
        : null,

    withinSubmissionWindow:
      isWithinSubmissionWindow(),
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       SESSION
    ===================================================== */

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

    /* =====================================================
       ROLE
    ===================================================== */

    const role =
      String(
        session.user.role || ""
      )
        .trim()
        .toUpperCase();

    if (role !== "CASHIER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Cashiers can access the daily report.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       REPORT
    ===================================================== */

    const report =
      await getDailyReportData();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error(
      "GET DAILY REPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load daily report.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       SESSION
    ===================================================== */

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

    /* =====================================================
       ROLE
    ===================================================== */

    const role =
      String(
        session.user.role || ""
      )
        .trim()
        .toUpperCase();

    if (role !== "CASHIER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Cashiers can submit daily reports.",
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
       TIME WINDOW
    ===================================================== */

    if (
      !isWithinSubmissionWindow()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Daily reports can only be submitted between 22:30 and 00:00.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       REQUEST
    ===================================================== */

    const body =
      await request.json();

    const actualMpesa =
      Number(
        body.actualMpesa
      );

    const actualCash =
      Number(
        body.actualCash
      );

    const notes =
      typeof body.notes ===
      "string"
        ? body.notes.trim()
        : "";

    const confirmed =
      body.confirmed === true;

    /* =====================================================
       CONFIRMATION
    ===================================================== */

    if (!confirmed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must confirm that the report figures are correct before submitting.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE CLOSING M-PESA
       
       M-Pesa starts from ZERO every day.
    ===================================================== */

    if (
      !Number.isFinite(
        actualMpesa
      ) ||
      actualMpesa < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid closing M-Pesa balance.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE CLOSING CASH
    ===================================================== */

    if (
      !Number.isFinite(
        actualCash
      ) ||
      actualCash < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid closing Cash balance.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       BUSINESS DATE
    ===================================================== */

    const businessDate =
      getBusinessDate();

    /* =====================================================
       PREVENT DUPLICATE REPORT
    ===================================================== */

    const existing =
      await prisma.reconciliation.findUnique(
        {
          where: {
            id: businessDate,
          },
        }
      );

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Today's daily report has already been submitted.",
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       LOAD TODAY'S SALES
    ===================================================== */

    const start =
      new Date(businessDate);

    const end =
      new Date(businessDate);

    end.setDate(
      end.getDate() + 1
    );

    const sales =
      await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },

        select: {
          amount: true,
          paymentMethod: true,
        },
      });

    /* =====================================================
       LOAD TODAY'S EXPENSES
    ===================================================== */

    const expenses =
      await prisma.expense.findMany({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },

        select: {
          amount: true,
        },
      });

    /* =====================================================
       CALCULATE TOTAL SALES
    ===================================================== */

    const totalSales =
      sales.reduce(
        (total, sale) =>
          total + sale.amount,
        0
      );

    /* =====================================================
       CREDIT SALES
    ===================================================== */

    const creditSales =
      sales
        .filter(
          (sale) =>
            sale.paymentMethod ===
            "CREDIT"
        )
        .reduce(
          (total, sale) =>
            total + sale.amount,
          0
        );

    /* =====================================================
       TOTAL EXPENSES
    ===================================================== */

    const totalExpenses =
      expenses.reduce(
        (total, expense) =>
          total + expense.amount,
        0
      );

    /* =====================================================
       CASH / M-PESA SALES
       
       IMPORTANT:
       
       Cashier and Sales Person food sales
       no longer select Cash or M-Pesa.
       
       Therefore paymentMethod is NULL for
       normal food sales.
       
       We MUST NOT pretend those sales were
       Cash or M-Pesa.
       
       Credit sales are handled separately.
    ===================================================== */

    const cashSales = 0;

    const mpesaSales = 0;

    /* =====================================================
       DIFFERENCES
       
       M-Pesa starts from ZERO.
       
       Therefore:
       
       M-Pesa difference =
       closing M-Pesa - 0
    ===================================================== */

    const cashDifference =
      actualCash -
      cashSales;

    const mpesaDifference =
      actualMpesa -
      mpesaSales;

    /* =====================================================
       CREATE RECONCILIATION
    ===================================================== */

    const reconciliation =
      await prisma.reconciliation.create(
        {
          data: {
            id: businessDate,

            totalSales,

            cashSales,

            mpesaSales,

            creditSales,

            totalExpenses,

            actualCash,

            actualMpesa,

            cashDifference,

            mpesaDifference,

            notes:
              notes || null,

            reconciledById:
              userId,
          },
        }
      );

    /* =====================================================
       RETURN UPDATED REPORT
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          "Daily report submitted successfully.",

        report: {
          reportDate:
            formatReportDate(
              businessDate
            ),

          totalSales,

          totalExpenses,

          creditSales,

          actualCash,

          actualMpesa,

          submitted: true,

          submittedAt:
            reconciliation.createdAt.toISOString(),

          withinSubmissionWindow:
            true,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "SUBMIT DAILY REPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit daily report.",
      },
      {
        status: 500,
      }
    );
  }
}