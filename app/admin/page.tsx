import {
  BarChart3,
  Banknote,
  ChevronRight,
  CreditCard,
  FileText,
  LogOut,
  Receipt,
  Settings,
  ShoppingBag,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type DashboardData = {
  totalSales: number;
  cash: number;
  mpesa: number;
  credit: number;
  expenses: number;

  profitWithCredit: number;
  profitWithoutCredit: number;

  reconciliation: {
    submitted: boolean;
    currentCash: number;
    previousCash: number;
    currentMpesa: number;
  };
};

/* =========================================================
   GET LIVE DASHBOARD DATA
========================================================= */

async function getDashboardData(): Promise<DashboardData> {
  /*
   * ========================================================
   * TODAY
   * ========================================================
   */

  const startOfToday = new Date();

  startOfToday.setHours(
    0,
    0,
    0,
    0
  );

  const endOfToday = new Date();

  endOfToday.setHours(
    23,
    59,
    59,
    999
  );

  /*
   * ========================================================
   * YESTERDAY
   * ========================================================
   */

  const startOfYesterday =
    new Date(startOfToday);

  startOfYesterday.setDate(
    startOfYesterday.getDate() - 1
  );

  const endOfYesterday =
    new Date(startOfToday);

  endOfYesterday.setMilliseconds(-1);

  /*
   * ========================================================
   * TODAY'S SALES
   * ========================================================
   */

  const sales =
    await prisma.sale.findMany({
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

  /*
   * ========================================================
   * TOTAL SALES
   * ========================================================
   */

  const totalSales =
    sales.reduce(
      (total, sale) =>
        total + sale.amount,
      0
    );

  /*
   * ========================================================
   * CREDIT SALES
   * ========================================================
   */

  const credit =
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

  /*
   * ========================================================
   * EXPENSES
   * ========================================================
   */

  const expenses =
    await prisma.expense.findMany({
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

  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );

  /*
   * ========================================================
   * TODAY'S RECONCILIATION
   * ========================================================
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

  /*
   * ========================================================
   * PREVIOUS DAY CASH
   * ========================================================
   */

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

  /*
   * ========================================================
   * CLOSING CASH
   * ========================================================
   */

  const currentCash =
    todayReconciliation?.actualCash ??
    0;

  const previousCash =
    yesterdayReconciliation?.actualCash ??
    0;

  /*
   * ========================================================
   * TODAY'S CASH
   *
   * Closing cash minus previous
   * closing cash.
   * ========================================================
   */

  const cash =
    Math.max(
      0,
      currentCash -
        previousCash
    );

  /*
   * ========================================================
   * M-PESA
   *
   * M-Pesa starts fresh every day.
   * ========================================================
   */

  const mpesa =
    todayReconciliation?.actualMpesa ??
    0;

  /*
   * ========================================================
   * PROFITS
   *
   * PROFIT WITH CREDIT:
   *
   * (Cash + M-Pesa + Credit) - Expenses
   *
   * PROFIT WITHOUT CREDIT:
   *
   * (Cash + M-Pesa) - Expenses
   * ========================================================
   */

  const profitWithCredit =
    cash +
    mpesa +
    credit -
    totalExpenses;

  const profitWithoutCredit =
    cash +
    mpesa -
    totalExpenses;

  /*
   * ========================================================
   * RETURN DASHBOARD DATA
   * ========================================================
   */

  return {
    totalSales,

    cash,

    mpesa,

    credit,

    expenses:
      totalExpenses,

    profitWithCredit,

    profitWithoutCredit,

    reconciliation: {
      submitted:
        !!todayReconciliation,

      currentCash,

      previousCash,

      currentMpesa:
        mpesa,
    },
  };
}

/* =========================================================
   ADMIN PAGE
========================================================= */

export default async function AdminPage() {
  /*
   * ========================================================
   * CHECK LOGIN
   * ========================================================
   */

  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user) {
    redirect("/login");
  }

  /*
   * ========================================================
   * ADMIN ONLY
   * ========================================================
   */

  if (
    session.user.role !==
    "ADMIN"
  ) {
    redirect("/");
  }

  /*
   * ========================================================
   * LOAD DASHBOARD DATA
   * ========================================================
   */

  const dashboard =
    await getDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ===================================================
          HEADER
      ==================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              H
            </div>

            <div>

              <h1 className="text-sm font-bold sm:text-base">
                Hotel Management System
              </h1>

              <p className="text-[11px] text-slate-500 sm:text-xs">
                Administrator Dashboard
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold">
                {session.user.name}
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>

            </div>

            <Link
              href="/api/auth/signout"
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={17} />
            </Link>

          </div>

        </div>

      </header>

      {/* ===================================================
          MAIN CONTENT
      ==================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">

        {/* =================================================
            WELCOME
        ================================================== */}

        <div className="mb-7">

          <h2 className="text-xl font-bold sm:text-2xl">
            Welcome, {session.user.name}
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage the hotel&apos;s daily operations from one place.
          </p>

        </div>

        {/* =================================================
            TODAY'S OVERVIEW
        ================================================== */}

        <section>

          <div className="mb-4">

            <h3 className="text-base font-bold sm:text-lg">
              Today&apos;s Overview
            </h3>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Live financial summary for today.
            </p>

          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-7">

            <FinancialCard
              title="Profit + Credit"
              value={
                dashboard.profitWithCredit
              }
              icon={
                <BarChart3 size={15} />
              }
              href="/admin/reports"
              highlight
            />

            <FinancialCard
              title="Profit - Credit"
              value={
                dashboard.profitWithoutCredit
              }
              icon={
                <BarChart3 size={15} />
              }
              href="/admin/reports"
              highlight
            />

            <FinancialCard
              title="Sales"
              value={
                dashboard.totalSales
              }
              icon={
                <ShoppingBag size={15} />
              }
              href="/admin/sales"
            />

            <FinancialCard
              title="Cash"
              value={
                dashboard.cash
              }
              icon={
                <Banknote size={15} />
              }
              href="/admin/reconciliation"
            />

            <FinancialCard
              title="M-Pesa"
              value={
                dashboard.mpesa
              }
              icon={
                <CreditCard size={15} />
              }
              href="/admin/reconciliation"
            />

            <FinancialCard
              title="Credit"
              value={
                dashboard.credit
              }
              icon={
                <Users size={15} />
              }
              href="/admin/credit-customers"
            />

            <FinancialCard
              title="Expenses"
              value={
                dashboard.expenses
              }
              icon={
                <Receipt size={15} />
              }
              href="/admin/expenses"
            />

          </div>

        </section>

        {/* =================================================
            CASHIER RECONCILIATION
        ================================================== */}

        <section className="mt-10">

          <SectionHeader
            title="Cashier Reconciliation"
            description="Enter the final Cash and M-Pesa balances at the end of the day."
          />

          <div className="border-t border-slate-200">

            <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-4">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500">
                  <Wallet size={18} />
                </div>

                <div className="min-w-0">

                  <p className="text-sm font-semibold">
                    Today&apos;s Closing
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    {dashboard.reconciliation
                      .submitted
                      ? "Today's Cash and M-Pesa balances have been submitted."
                      : "Cash and M-Pesa balances have not been submitted yet."}
                  </p>

                </div>

              </div>

              <span
                className={`shrink-0 text-[10px] font-bold uppercase ${
                  dashboard.reconciliation
                    .submitted
                    ? "text-green-600"
                    : "text-orange-500"
                }`}
              >
                {dashboard.reconciliation
                  .submitted
                  ? "Submitted"
                  : "Pending"}
              </span>

            </div>

            <div className="border-b border-slate-200 py-5">

              <form
                action={
                  saveReconciliation
                }
                className="grid gap-4 sm:grid-cols-3"
              >

                <div>

                  <label
                    htmlFor="reconciliationDate"
                    className="mb-1.5 block text-xs font-semibold text-slate-600"
                  >
                    Date
                  </label>

                  <input
                    id="reconciliationDate"
                    name="date"
                    type="date"
                    defaultValue={
                      getTodayDate()
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400"
                  />

                </div>

                <div>

                  <label
                    htmlFor="reconciliationCash"
                    className="mb-1.5 block text-xs font-semibold text-slate-600"
                  >
                    Closing Cash
                  </label>

                  <input
                    id="reconciliationCash"
                    name="cash"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={
                      dashboard.reconciliation
                        .currentCash ||
                      ""
                    }
                    placeholder="Enter cash"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400"
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    Previous closing cash:{" "}
                    {formatMoney(
                      dashboard.reconciliation
                        .previousCash
                    )}
                  </p>

                </div>

                <div>

                  <label
                    htmlFor="reconciliationMpesa"
                    className="mb-1.5 block text-xs font-semibold text-slate-600"
                  >
                    M-Pesa
                  </label>

                  <input
                    id="reconciliationMpesa"
                    name="mpesa"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={
                      dashboard.reconciliation
                        .currentMpesa ||
                      ""
                    }
                    placeholder="Enter M-Pesa"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400"
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    M-Pesa starts fresh every day.
                  </p>

                </div>

                <div className="sm:col-span-3">

                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {dashboard.reconciliation
                      .submitted
                      ? "Update Reconciliation"
                      : "Submit Reconciliation"}
                  </button>

                </div>

              </form>

            </div>

            <div className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-3">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Today&apos;s Cash
                </p>

                <p className="mt-1 text-sm font-bold">
                  {formatMoney(
                    dashboard.cash
                  )}
                </p>

              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Today&apos;s M-Pesa
                </p>

                <p className="mt-1 text-sm font-bold">
                  {formatMoney(
                    dashboard.mpesa
                  )}
                </p>

              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Previous Cash
                </p>

                <p className="mt-1 text-sm font-bold">
                  {formatMoney(
                    dashboard.reconciliation
                      .previousCash
                  )}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            HOTEL OPERATIONS
        ================================================== */}

        <section className="mt-10">

          <SectionHeader
            title="Hotel Operations"
            description="Manage the hotel's daily transactions."
          />

          <div className="border-t border-slate-200">

            <ManagementRow
              href="/admin/sales"
              icon={
                <ShoppingBag size={18} />
              }
              title="Food Sales"
              description="View and manage food sales posted by users."
            />

            <ManagementRow
              href="/admin/credit-customers"
              icon={
                <Users size={18} />
              }
              title="Credit Customers"
              description="Register customers and manage their credit."
            />

            <ManagementRow
              href="/admin/expenses"
              icon={
                <Receipt size={18} />
              }
              title="Expenses & Payments"
              description="Record and manage hotel expenses."
            />

            <ManagementRow
              href="/admin/reports"
              icon={
                <BarChart3 size={18} />
              }
              title="Reports"
              description="View business and user sales reports."
            />

            <ManagementRow
              href="/admin/documents"
              icon={
                <FileText size={18} />
              }
              title="Records"
              description="View and manage hotel records."
            />

          </div>

        </section>

        {/* =================================================
            USER MANAGEMENT
        ================================================== */}

        <section className="mt-10">

          <SectionHeader
            title="User Management"
            description="Appoint and manage the people who use the system."
          />

          <div className="border-t border-slate-200">

            <ManagementRow
              href="/admin/users"
              icon={
                <Users size={18} />
              }
              title="Manage Users"
              description="View, edit and deactivate system users."
            />

            <ManagementRow
              href="/admin/users/add"
              icon={
                <UserPlus size={18} />
              }
              title="Add User"
              description="Appoint a new Cashier or Waiter."
            />

            <ManagementRow
              href="/admin/settings"
              icon={
                <Settings size={18} />
              }
              title="System Settings"
              description="Configure the hotel management system."
            />

          </div>

        </section>

      </div>

      {/* ===================================================
          FOOTER
      ==================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-5 text-center sm:px-6 lg:px-8">

          <p className="text-xs text-slate-500 sm:text-sm">

            Developed by{" "}

            <span className="font-semibold text-slate-700">
              Abdi Adan
            </span>{" "}

            <span className="text-slate-400">
              +254722353802
            </span>

          </p>

          <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
            © 2026 All Rights Reserved
          </p>

        </div>

      </footer>

    </main>
  );
}

/* =========================================================
   SAVE CASHIER RECONCILIATION
========================================================= */

async function saveReconciliation(
  formData: FormData
) {
  "use server";

  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.role !==
    "ADMIN"
  ) {
    redirect("/");
  }

  const dateValue =
    String(
      formData.get("date") || ""
    );

  const cash =
    Number(
      formData.get("cash")
    );

  const mpesa =
    Number(
      formData.get("mpesa")
    );

  if (!dateValue) {
    throw new Error(
      "Reconciliation date is required."
    );
  }

  if (
    !Number.isFinite(cash) ||
    cash < 0
  ) {
    throw new Error(
      "Please enter a valid cash amount."
    );
  }

  if (
    !Number.isFinite(mpesa) ||
    mpesa < 0
  ) {
    throw new Error(
      "Please enter a valid M-Pesa amount."
    );
  }

  const startOfDay =
    new Date(
      `${dateValue}T00:00:00`
    );

  const endOfDay =
    new Date(
      `${dateValue}T23:59:59.999`
    );

  /* =======================================================
     SALES
  ======================================================== */

  const sales =
    await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },

      select: {
        amount: true,
        paymentMethod: true,
      },
    });

  let totalSales = 0;
  let cashSales = 0;
  let mpesaSales = 0;
  let creditSales = 0;

  for (const sale of sales) {

    totalSales +=
      sale.amount;

    if (
      sale.paymentMethod ===
      "CASH"
    ) {
      cashSales +=
        sale.amount;
    }

    if (
      sale.paymentMethod ===
      "MPESA"
    ) {
      mpesaSales +=
        sale.amount;
    }

    if (
      sale.paymentMethod ===
      "CREDIT"
    ) {
      creditSales +=
        sale.amount;
    }

  }

  /* =======================================================
     EXPENSES
  ======================================================== */

  const expenses =
    await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },

      select: {
        amount: true,
      },
    });

  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );

  /* =======================================================
     PREVIOUS DAY CASH
  ======================================================== */

  const previousDay =
    new Date(startOfDay);

  previousDay.setDate(
    previousDay.getDate() - 1
  );

  const previousDayEnd =
    new Date(startOfDay);

  previousDayEnd.setMilliseconds(
    -1
  );

  const previousReconciliation =
    await prisma.reconciliation.findFirst({
      where: {
        id: {
          gte: previousDay,
          lte: previousDayEnd,
        },
      },

      orderBy: {
        id: "desc",
      },

      select: {
        actualCash: true,
      },
    });

  const previousCash =
    previousReconciliation
      ?.actualCash ?? 0;

  /* =======================================================
     DIFFERENCES
  ======================================================== */

  const cashForDay =
    Math.max(
      0,
      cash -
        previousCash
    );

  const cashDifference =
    cashForDay -
    cashSales;

  const mpesaDifference =
    mpesa -
    mpesaSales;

  /* =======================================================
     SAVE / UPDATE
  ======================================================== */

  await prisma.reconciliation.upsert({
    where: {
      id: startOfDay,
    },

    update: {

      totalSales,

      cashSales,

      mpesaSales,

      creditSales,

      totalExpenses,

      actualCash:
        cash,

      actualMpesa:
        mpesa,

      cashDifference,

      mpesaDifference,

      reconciledById:
        session.user.id,
    },

    create: {

      id: startOfDay,

      totalSales,

      cashSales,

      mpesaSales,

      creditSales,

      totalExpenses,

      actualCash:
        cash,

      actualMpesa:
        mpesa,

      cashDifference,

      mpesaDifference,

      reconciledById:
        session.user.id,
    },
  });

  redirect("/admin");
}

/* =========================================================
   SMALL FINANCIAL CARD
========================================================= */

function FinancialCard({
  title,
  value,
  icon,
  href,
  highlight = false,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group min-w-0 rounded-xl border bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-3 ${
        highlight
          ? "border-slate-300"
          : "border-slate-200"
      }`}
    >

      <div className="flex items-center justify-center text-slate-500 sm:justify-start">
        {icon}
      </div>

      <p className="mt-1 truncate text-[10px] font-semibold text-slate-500 sm:text-xs">
        {title}
      </p>

      <p
        className={`mt-0.5 truncate text-[11px] font-bold sm:text-sm ${
          highlight
            ? "text-slate-900"
            : "text-slate-800"
        }`}
      >
        {formatCompactMoney(
          value
        )}
      </p>

    </Link>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-3">

      <h3 className="text-base font-bold sm:text-lg">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   MANAGEMENT ROW
========================================================= */

function ManagementRow({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 border-b border-slate-200 py-4 transition hover:bg-white"
    >

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-sm font-semibold">
            {title}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
            {description}
          </p>

        </div>

      </div>

      <ChevronRight
        size={17}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700"
      />

    </Link>
  );
}

/* =========================================================
   TODAY DATE
========================================================= */

function getTodayDate() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

/* =========================================================
   MONEY FORMAT
========================================================= */

function formatMoney(
  amount: number
) {
  return `KSh ${amount.toLocaleString(
    "en-KE"
  )}`;
}

/* =========================================================
   COMPACT MONEY FORMAT
========================================================= */

function formatCompactMoney(
  amount: number
) {
  return `KSh ${amount.toLocaleString(
    "en-KE"
  )}`;
}