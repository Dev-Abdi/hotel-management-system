"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  User,
} from "lucide-react";

type Sale = {
  id: string;
  amount: number;
  description: string | null;
  createdAt: string;
  postedBy: {
    id: string;
    name: string;
    username: string;
  };
};

type Payment = {
  id: string;
  amount: number;
  createdAt: string;
  receivedBy: {
    id: string;
    name: string;
    username: string;
  };
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  description: string | null;
  totalCredit: number;
  totalPaid: number;
  createdAt: string;
  creditSales: Sale[];
  payments: Payment[];
};

type Transaction = {
  id: string;
  type: "CREDIT" | "PAYMENT";
  amount: number;
  description: string;
  createdAt: string;
  user: string;
};

export default function CreditCustomerStatement({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [customerId, setCustomerId] =
    useState("");

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setCustomerId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!customerId) return;

    async function loadStatement() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/credit-customers/${customerId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load statement."
          );
        }

        setCustomer(data.customer);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load statement."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStatement();
  }, [customerId]);

  const transactions =
    useMemo<Transaction[]>(() => {
      if (!customer) return [];

      const credits: Transaction[] =
        customer.creditSales.map(
          (sale) => ({
            id: sale.id,
            type: "CREDIT",
            amount: sale.amount,
            description:
              sale.description ||
              "Credit sale",
            createdAt: sale.createdAt,
            user: sale.postedBy.name,
          })
        );

      const payments: Transaction[] =
        customer.payments.map(
          (payment) => ({
            id: payment.id,
            type: "PAYMENT",
            amount: payment.amount,
            description: "Credit payment",
            createdAt: payment.createdAt,
            user: payment.receivedBy.name,
          })
        );

      return [
        ...credits,
        ...payments,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
    }, [customer]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl py-20 text-center text-sm text-slate-500">
          Loading customer statement...
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">

          <Link
            href="/admin/credit-customers"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to Credit Customers
          </Link>

          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error ||
              "Customer not found."}
          </div>

        </div>
      </main>
    );
  }

  const outstanding =
    customer.totalCredit -
    customer.totalPaid;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">

          <div className="flex items-center gap-3">

            <Link
              href="/admin/credit-customers"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>

              <h1 className="text-base font-bold">
                Customer Statement
              </h1>

              <p className="text-xs text-slate-500">
                Complete credit account history
              </p>

            </div>

          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
          >
            <Download size={15} />

            <span className="hidden sm:inline">
              Print Statement
            </span>

          </button>

        </div>

      </header>


      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

        {/* CUSTOMER */}

        <section className="border-b border-slate-200 pb-6">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <User size={18} />
            </div>

            <div>

              <h2 className="text-lg font-bold">
                {customer.name}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {customer.phone ||
                  "No phone number"}
              </p>

              {customer.description && (
                <p className="mt-1 text-xs text-slate-500">
                  {customer.description}
                </p>
              )}

            </div>

          </div>

        </section>


        {/* SUMMARY */}

        <section className="grid grid-cols-3 gap-3 border-b border-slate-200 py-6">

          <Summary
            title="Total Credit"
            amount={customer.totalCredit}
          />

          <Summary
            title="Total Paid"
            amount={customer.totalPaid}
          />

          <Summary
            title="Outstanding"
            amount={outstanding}
            highlight
          />

        </section>


        {/* STATEMENT */}

        <section className="mt-8">

          <div className="mb-4">

            <h3 className="text-base font-bold">
              Detailed Statement
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Every credit and payment with its date, time and user.
            </p>

          </div>


          {/* DESKTOP */}

          <div className="hidden overflow-hidden border-t border-slate-200 md:block">

            <div className="grid grid-cols-[150px_100px_1fr_130px_150px] border-b border-slate-200 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">

              <span>Date & Time</span>

              <span>Type</span>

              <span>Description</span>

              <span className="text-right">
                Amount
              </span>

              <span className="text-right">
                User
              </span>

            </div>


            {transactions.length === 0 ? (

              <div className="py-12 text-center text-sm text-slate-500">
                No transactions recorded yet.
              </div>

            ) : (

              transactions.map(
                (transaction) => (
                  <StatementRow
                    key={`${transaction.type}-${transaction.id}`}
                    transaction={transaction}
                  />
                )
              )

            )}

          </div>


          {/* MOBILE */}

          <div className="border-t border-slate-200 md:hidden">

            {transactions.length === 0 ? (

              <div className="py-12 text-center text-sm text-slate-500">
                No transactions recorded yet.
              </div>

            ) : (

              transactions.map(
                (transaction) => (

                  <div
                    key={`${transaction.type}-${transaction.id}`}
                    className="border-b border-slate-200 py-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            transaction.type ===
                            "CREDIT"
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {transaction.type ===
                          "CREDIT"
                            ? "CREDIT"
                            : "PAYMENT"}
                        </span>

                        <p className="mt-2 text-sm font-semibold">
                          {transaction.description}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(
                            transaction.createdAt
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          By {transaction.user}
                        </p>

                      </div>

                      <p
                        className={`shrink-0 text-sm font-bold ${
                          transaction.type ===
                          "CREDIT"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {transaction.type ===
                        "CREDIT"
                          ? "+"
                          : "-"}
                        {formatMoney(
                          transaction.amount
                        )}
                      </p>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </section>

      </div>

    </main>
  );
}


/* =========================================================
   DESKTOP ROW
========================================================= */

function StatementRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  return (
    <div className="grid grid-cols-[150px_100px_1fr_130px_150px] items-center border-b border-slate-100 py-4 text-sm">

      <span className="text-xs text-slate-500">
        {formatDateTime(
          transaction.createdAt
        )}
      </span>

      <span>

        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
            transaction.type ===
            "CREDIT"
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {transaction.type ===
          "CREDIT"
            ? "CREDIT"
            : "PAYMENT"}
        </span>

      </span>

      <span className="text-slate-700">
        {transaction.description}
      </span>

      <span
        className={`text-right font-semibold ${
          transaction.type ===
          "CREDIT"
            ? "text-red-600"
            : "text-green-600"
        }`}
      >
        {transaction.type ===
        "CREDIT"
          ? "+"
          : "-"}
        {formatMoney(
          transaction.amount
        )}
      </span>

      <span className="text-right text-xs text-slate-500">
        {transaction.user}
      </span>

    </div>
  );
}


/* =========================================================
   SUMMARY
========================================================= */

function Summary({
  title,
  amount,
  highlight = false,
}: {
  title: string;
  amount: number;
  highlight?: boolean;
}) {
  return (
    <div>

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p
        className={`mt-1 text-sm font-bold sm:text-base ${
          highlight
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {formatMoney(amount)}
      </p>

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function formatMoney(amount: number) {
  return `KSh ${amount.toLocaleString(
    "en-KE"
  )}`;
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}