"use client";

import {
  Search,
  Users,
  ChevronRight,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";

type CreditCustomer = {
  id: string;
  name: string;
  phone: string | null;
  description: string | null;
  totalCredit: number;
  totalPaid: number;
};

export default function CashierCreditCustomersPage() {
  const [customers, setCustomers] = useState<
    CreditCustomer[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  /*
   * ======================================================
   * LOAD CREDIT CUSTOMERS
   * ======================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      try {
        const response =
          await fetch(
            "/api/credit-customers",
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load credit customers."
          );
        }

        if (!cancelled) {
          setCustomers(
            Array.isArray(data.customers)
              ? data.customers
              : []
          );
        }
      } catch (error) {
        console.error(
          "LOAD CREDIT CUSTOMERS ERROR:",
          error
        );

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load credit customers."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ======================================================
   * FILTER CUSTOMERS
   * ======================================================
   */

  const filteredCustomers =
    customers.filter((customer) => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        customer.name
          .toLowerCase()
          .includes(query) ||
        (customer.phone || "")
          .toLowerCase()
          .includes(query)
      );
    });

  /*
   * ======================================================
   * PAGE
   * ======================================================
   */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">

          <div>
            <h1 className="text-xl font-bold">
              Credit Customers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View customer accounts and manage
              credit transactions.
            </p>
          </div>

          <Link
            href="/cashier"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Dashboard
          </Link>

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-4 py-7">

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="relative">

            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search customer by name or phone..."
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />

          </div>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="mt-5">

          {loading ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

              <p className="mt-4 text-sm text-slate-500">
                Loading credit customers...
              </p>

            </div>

          ) : filteredCustomers.length === 0 ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <Users
                size={40}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 font-semibold text-slate-900">
                {search
                  ? "No customers found"
                  : "No credit customers"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try another customer name or phone number."
                  : "Credit customers created by the administrator will appear here."}
              </p>

            </div>

          ) : (

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-5 py-4">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="font-bold text-slate-900">
                      Customer Accounts
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {filteredCustomers.length}{" "}
                      customer
                      {filteredCustomers.length ===
                      1
                        ? ""
                        : "s"}
                    </p>

                  </div>

                </div>

              </div>

              <div className="divide-y divide-slate-200">

                {filteredCustomers.map(
                  (customer) => {
                    const outstanding =
                      customer.totalCredit -
                      customer.totalPaid;

                    return (
                      <Link
                        key={customer.id}
                        href={`/cashier/credit-customers/${customer.id}`}
                        className="block px-5 py-5 transition hover:bg-slate-50"
                      >

                        <div className="flex items-center justify-between gap-4">

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                              <Users size={19} />
                            </div>

                            <div className="min-w-0">

                              <h3 className="truncate font-semibold text-slate-900">
                                {customer.name}
                              </h3>

                              {customer.phone && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {customer.phone}
                                </p>
                              )}

                            </div>

                          </div>

                          <div className="flex shrink-0 items-center gap-4">

                            <div className="hidden text-right sm:block">

                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Outstanding
                              </p>

                              <p
                                className={
                                  outstanding >
                                  0
                                    ? "mt-1 text-sm font-bold text-red-600"
                                    : "mt-1 text-sm font-bold text-emerald-600"
                                }
                              >
                                KSh{" "}
                                {outstanding.toLocaleString(
                                  "en-KE"
                                )}
                              </p>

                            </div>

                            <ChevronRight
                              size={19}
                              className="text-slate-400"
                            />

                          </div>

                        </div>

                        <div className="mt-3 flex gap-5 text-xs sm:hidden">

                          <span className="text-slate-500">
                            Credit:{" "}
                            <strong className="text-slate-700">
                              KSh{" "}
                              {customer.totalCredit.toLocaleString(
                                "en-KE"
                              )}
                            </strong>
                          </span>

                          <span className="text-slate-500">
                            Paid:{" "}
                            <strong className="text-slate-700">
                              KSh{" "}
                              {customer.totalPaid.toLocaleString(
                                "en-KE"
                              )}
                            </strong>
                          </span>

                        </div>

                      </Link>
                    );
                  }
                )}

              </div>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}