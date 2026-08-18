import {
  ChevronRight,
  LogOut,
  ShoppingBag,
  Users,
} from "lucide-react";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function WaiterPage() {
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
   * CASHIER
   */

  if (role === "CASHIER") {
    redirect("/cashier");
  }

  /*
   * WAITER ROLE
   *
   * The database role remains WAITER.
   * Only the visible name is Sales Person.
   */

  if (role !== "WAITER") {
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
                Sales Person Dashboard
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold">
                {session.user.name}
              </p>

              <p className="text-xs text-slate-500">
                Sales Person
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
            Manage food sales and existing credit customers.
          </p>

        </div>

        {/* =================================================
            SALES PERSON OPERATIONS
        ================================================== */}

        <section>

          <div className="mb-4">

            <h3 className="text-base font-bold sm:text-lg">
              Sales Person Operations
            </h3>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Choose an operation.
            </p>

          </div>

          <div className="border-t border-slate-200">

            {/* FOOD SALES */}

            <ActionRow
              href="/waiter/sales"
              icon={
                <ShoppingBag size={18} />
              }
              title="Food Sales"
              description="Post food sales."
            />

            {/* CREDIT CUSTOMERS */}

            <ActionRow
              href="/waiter/credit-customers"
              icon={
                <Users size={18} />
              }
              title="Credit Customers"
              description="View existing customers, post credit and receive payments."
            />

          </div>

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