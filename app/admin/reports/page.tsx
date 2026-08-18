"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  UserRound,
  CalendarDays,
  Search,
} from "lucide-react";

type ReportType =
  | "users"
  | "business";

type User = {
  id: string;
  name: string;
  username: string;
  role: string;
};

type UserReport = {
  success: boolean;
  type: "users";
  period: {
    from: string;
    to: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  totalSales: number;
};

type BusinessReport = {
  success: boolean;
  type: "business";
  period: {
    from: string;
    to: string;
  };
  business: {
    totalSales: number;
    cash: number;
    mpesa: number;
    credit: number;
    expenses: number;
    profitWithCredit: number;
    profitWithoutCredit: number;
  };
};

export default function ReportsPage() {
  const [reportType, setReportType] =
    useState<ReportType>("users");

  const [users, setUsers] =
    useState<User[]>([]);

  const [selectedUser, setSelectedUser] =
    useState("");

  const [from, setFrom] =
    useState("");

  const [to, setTo] =
    useState("");

  const [report, setReport] =
    useState<
      UserReport | BusinessReport | null
    >(null);

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ==========================================
   * LOAD USERS
   * ==========================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const response = await fetch(
          "/api/admin/reports?type=users-list",
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load users."
          );
        }

        if (!cancelled) {
          setUsers(data.users || []);

          if (
            data.users?.length > 0
          ) {
            setSelectedUser(
              data.users[0].id
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load users."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ==========================================
   * RUN REPORT
   * ==========================================
   */

  async function runReport(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setReport(null);

    if (!from || !to) {
      setError(
        "Please select both dates."
      );
      return;
    }

    if (from > to) {
      setError(
        "From date cannot be after To date."
      );
      return;
    }

    if (
      reportType === "users" &&
      !selectedUser
    ) {
      setError(
        "Please select a user."
      );
      return;
    }

    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      params.set(
        "type",
        reportType
      );

      params.set(
        "from",
        from
      );

      params.set(
        "to",
        to
      );

      if (reportType === "users") {
        params.set(
          "userId",
          selectedUser
        );
      }

      const response =
        await fetch(
          `/api/admin/reports?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to generate report."
        );
      }

      setReport(data);

    } catch (err) {
      console.error(
        "RUN REPORT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate report."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ==========================================
   * CHANGE REPORT TYPE
   * ==========================================
   */

  function changeReportType(
    type: ReportType
  ) {
    setReportType(type);
    setReport(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">

          <Link
            href="/admin"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-base font-bold">
              Reports
            </h1>

            <p className="text-xs text-slate-500">
              Business and user reports
            </p>
          </div>

        </div>

      </header>


      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

        {/* REPORT TYPE */}

        <section>

          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Report Type
          </p>

          <div className="grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() =>
                changeReportType(
                  "users"
                )
              }
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                reportType === "users"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >

              <UserRound size={19} />

              <div>
                <p className="text-sm font-bold">
                  Users Report
                </p>

                <p
                  className={`mt-0.5 text-[10px] ${
                    reportType ===
                    "users"
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  Sales by one user
                </p>
              </div>

            </button>


            <button
              type="button"
              onClick={() =>
                changeReportType(
                  "business"
                )
              }
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                reportType === "business"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >

              <Building2 size={19} />

              <div>
                <p className="text-sm font-bold">
                  Business Report
                </p>

                <p
                  className={`mt-0.5 text-[10px] ${
                    reportType ===
                    "business"
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  Overall business
                </p>
              </div>

            </button>

          </div>

        </section>


        {/* FILTERS */}

        <form
          onSubmit={runReport}
          className="mt-6 border-b border-slate-200 pb-7"
        >

          <div className="mb-4 flex items-center gap-2">

            <CalendarDays
              size={17}
              className="text-slate-500"
            />

            <h2 className="text-sm font-bold">
              Select Period
            </h2>

          </div>


          <div
            className={`grid gap-4 ${
              reportType === "users"
                ? "sm:grid-cols-3"
                : "sm:grid-cols-2"
            }`}
          >

            {/* FROM */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                From Date
              </label>

              <input
                type="date"
                value={from}
                onChange={(event) =>
                  setFrom(
                    event.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400"
              />

            </div>


            {/* TO */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                To Date
              </label>

              <input
                type="date"
                value={to}
                onChange={(event) =>
                  setTo(
                    event.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400"
              />

            </div>


            {/* USER */}

            {reportType ===
              "users" && (

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  User
                </label>

                <select
                  value={selectedUser}
                  onChange={(event) =>
                    setSelectedUser(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingUsers
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400"
                >

                  {loadingUsers ? (
                    <option>
                      Loading users...
                    </option>
                  ) : (
                    users.map(
                      (user) => (
                        <option
                          key={user.id}
                          value={
                            user.id
                          }
                        >
                          {user.name}
                        </option>
                      )
                    )
                  )}

                </select>

              </div>

            )}

          </div>


          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >

            <Search size={16} />

            {loading
              ? "Running..."
              : "Run My Report"}

          </button>

        </form>


        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* USER REPORT */}

        {report?.type ===
          "users" && (

          <section className="mt-8">

            <div className="mb-5 flex items-center gap-2">

              <BarChart3
                size={18}
                className="text-slate-500"
              />

              <h2 className="text-sm font-bold">
                Users Sales Report
              </h2>

            </div>


            <div className="border-t border-slate-200">

              <div className="border-b border-slate-200 py-5">

                <p className="text-xs text-slate-400">
                  User
                </p>

                <p className="mt-1 text-base font-bold">
                  {report.user.name}
                </p>

                <p className="text-xs text-slate-500">
                  @{report.user.username}
                </p>

              </div>


              <div className="border-b border-slate-200 py-6">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total Sales
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {formatMoney(
                    report.totalSales
                  )}
                </p>

              </div>


              <div className="py-4 text-xs text-slate-500">

                {formatDate(
                  report.period.from
                )}

                {" — "}

                {formatDate(
                  report.period.to
                )}

              </div>

            </div>

          </section>

        )}


        {/* BUSINESS REPORT */}

        {report?.type ===
          "business" && (

          <section className="mt-8">

            <div className="mb-5 flex items-center gap-2">

              <BarChart3
                size={18}
                className="text-slate-500"
              />

              <h2 className="text-sm font-bold">
                Business Report
              </h2>

            </div>


            <p className="mb-6 text-xs text-slate-500">

              {formatDate(
                report.period.from
              )}

              {" — "}

              {formatDate(
                report.period.to
              )}

            </p>


            {/* MAIN READINGS */}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

              <Reading
                label="Total Sales"
                value={
                  report.business
                    .totalSales
                }
              />

              <Reading
                label="Cash"
                value={
                  report.business
                    .cash
                }
              />

              <Reading
                label="M-Pesa"
                value={
                  report.business
                    .mpesa
                }
              />

              <Reading
                label="Credit"
                value={
                  report.business
                    .credit
                }
              />

              <Reading
                label="Expenses"
                value={
                  report.business
                    .expenses
                }

                negative
              />

            </div>


            {/* PROFITS */}

            <div className="mt-8 border-t border-slate-200">

              <div className="py-5">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Profit With Credit
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Cash + M-Pesa + Credit −
                  Expenses
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${
                    report.business
                      .profitWithCredit >=
                    0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatMoney(
                    report.business
                      .profitWithCredit
                  )}
                </p>

              </div>


              <div className="border-t border-slate-200 py-5">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Profit Without Credit
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Cash + M-Pesa − Expenses
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${
                    report.business
                      .profitWithoutCredit >=
                    0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatMoney(
                    report.business
                      .profitWithoutCredit
                  )}
                </p>

              </div>

            </div>


            {/* FORMULAS */}

            <div className="mt-5 border-t border-slate-200 pt-5">

              <p className="text-[11px] font-semibold text-slate-500">
                Profit calculations
              </p>

              <p className="mt-2 text-[11px] text-slate-400">
                With Credit = Cash + M-Pesa
                + Credit − Expenses
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Without Credit = Cash +
                M-Pesa − Expenses
              </p>

            </div>

          </section>

        )}

      </div>

    </main>
  );
}


/* ============================================================
   READING
============================================================ */

function Reading({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-base font-bold ${
          negative
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {formatMoney(value)}
      </p>

    </div>
  );
}


/* ============================================================
   MONEY
============================================================ */

function formatMoney(
  amount: number
) {
  return `KSh ${amount.toLocaleString(
    "en-KE"
  )}`;
}


/* ============================================================
   DATE
============================================================ */

function formatDate(
  date: string
) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}