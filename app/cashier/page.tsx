import {
  BarChart3,
  ChevronRight,
  LogOut,
  Receipt,
  ShoppingBag,
  Users,
} from "lucide-react";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CashierPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = String(
    session.user.role || ""
  )
    .trim()
    .toUpperCase();

  /*
   * ADMIN
   */

  if (role === "ADMIN") {
    redirect("/admin");
  }

  /*
   * WAITER
   */

  if (role === "WAITER") {
    redirect("/waiter");
  }

  /*
   * CASHIER ONLY
   */

  if (role !== "CASHIER") {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              H
            </div>

            <div>

              <h1 className="text-sm font-bold sm:text-base">
                Hotel Management System
              </h1>

              <p className="text-[11px] text-slate-500 sm:text-xs">
                Cashier Dashboard
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold">
                {session.user.name}
              </p>

              <p className="text-xs text-slate-500">
                Cashier
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

      {/* =================================================
          CONTENT
      ================================================== */}

      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">

        <div className="mb-8">

          <h2 className="text-xl font-bold sm:text-2xl">
            Welcome, {session.user.name}
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage sales, credit customers, expenses and
            your daily closing report.
          </p>

        </div>

        {/* =================================================
            TRANSACTIONS
        ================================================== */}

        <section>

          <div className="mb-4">

            <h3 className="text-base font-bold sm:text-lg">
              Cashier Operations
            </h3>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
  Manage today&apos;s transactions.
</p>

          </div>

          <div className="border-t border-slate-200">

            {/* FOOD SALES */}

            <ActionRow
              href="/cashier/sales"
              icon={
                <ShoppingBag size={18} />
              }
              title="Food Sales"
              description="Post food sales."
            />

            {/* CREDIT CUSTOMERS */}

            <ActionRow
              href="/cashier/credit-customers"
              icon={
                <Users size={18} />
              }
              title="Credit Customers"
              description="View existing customers, post credit and receive payments."
            />

            {/* EXPENSES */}

            <ActionRow
              href="/cashier/expenses"
              icon={
                <Receipt size={18} />
              }
              title="Expenses"
              description="Record business expenses."
            />

          </div>

        </section>

        {/* =================================================
            DAILY REPORT
        ================================================== */}

        <section className="mt-10">

          <div className="mb-4">

            <h3 className="text-base font-bold sm:text-lg">
              Daily Closing Report
            </h3>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Enter, confirm and submit your closing Cash
              and M-Pesa amounts between 10:30 PM and midnight.
            </p>

          </div>

          <div className="border-t border-slate-200">

            <ActionRow
              href="/cashier/daily-report"
              icon={
                <BarChart3 size={18} />
              }
              title="Submit Daily Report"
              description="Enter Cash and M-Pesa, confirm the figures and submit."
            />

          </div>

        </section>

        {/* =================================================
            IMPORTANT NOTICE
        ================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">

          <h3 className="font-semibold">
            Cashier Access
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
  The Cashier does not see the business&apos;s daily
  financial summary. Closing Cash and M-Pesa
  figures are entered through the Daily Report
  and submitted for administrative review.
</p>

        </section>

      </div>

      {/* =================================================
          FOOTER
      ================================================== */}

      <footer className="mt-10 border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-5xl px-4 py-5 text-center sm:px-6">

          <p className="text-xs text-slate-500">
            Developed by{" "}
            <span className="font-semibold text-slate-700">
              Abdi Adan
            </span>{" "}
            +254722353802
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            © 2026 All Rights Reserved
          </p>

        </div>

      </footer>

    </main>
  );
}

/* =========================================================
   ACTION ROW
========================================================= */

function ActionRow({
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
      className="group flex items-center justify-between gap-4 border-b border-slate-200 py-5 transition hover:bg-white"
    >

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-sm font-semibold">
            {title}
          </p>

          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
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