"use client";

import {
  ArrowLeft,
  CreditCard,
  Plus,
  Wallet,
} from "lucide-react";

import Link from "next/link";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

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

  creditSales: Sale[];

  payments: Payment[];
};

type Props = {
  customer: Customer;
};

type StatementEntry = {
  id: string;

  type: "CREDIT" | "PAYMENT";

  amount: number;

  description: string | null;

  createdAt: string;

  userName: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function CreditCustomerClient({
  customer,
}: Props) {
  const router = useRouter();

  const [creditAmount, setCreditAmount] =
    useState("");

  const [
    creditDescription,
    setCreditDescription,
  ] = useState("");

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [postingCredit, setPostingCredit] =
    useState(false);

  const [
    receivingPayment,
    setReceivingPayment,
  ] = useState(false);

  const [error, setError] =
    useState("");

  /*
   * ======================================================
   * OUTSTANDING
   * ======================================================
   */

  const outstanding =
    customer.totalCredit -
    customer.totalPaid;

  /*
   * ======================================================
   * COMPLETE STATEMENT
   * ======================================================
   *
   * Credits and payments are combined together.
   */

  const statement =
    useMemo<StatementEntry[]>(() => {
      const credits =
        customer.creditSales.map(
          (sale) => ({
            id: sale.id,

            type: "CREDIT" as const,

            amount: sale.amount,

            description:
              sale.description,

            createdAt:
              sale.createdAt,

            userName:
              sale.postedBy.name,
          })
        );

      const payments =
        customer.payments.map(
          (payment) => ({
            id: payment.id,

            type: "PAYMENT" as const,

            amount: payment.amount,

            description:
              "Credit payment",

            createdAt:
              payment.createdAt,

            userName:
              payment.receivedBy.name,
          })
        );

      return [
        ...credits,
        ...payments,
      ].sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );
    }, [customer]);

  /*
   * ======================================================
   * POST CREDIT
   * ======================================================
   */

  async function handlePostCredit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const amount =
      Number(creditAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid credit amount."
      );

      return;
    }

    try {
      setPostingCredit(true);

      const response =
        await fetch(
          "/api/credit-customers/credit",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              customerId:
                customer.id,

              amount,

              description:
                creditDescription.trim(),
            }),
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
            "Unable to post credit."
        );
      }

      setCreditAmount("");

      setCreditDescription("");

      router.refresh();

    } catch (error) {
      console.error(
        "POST CREDIT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to post credit."
      );

    } finally {
      setPostingCredit(false);
    }
  }

  /*
   * ======================================================
   * RECEIVE PAYMENT
   * ======================================================
   */

  async function handleReceivePayment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const amount =
      Number(paymentAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid payment amount."
      );

      return;
    }

    if (amount > outstanding) {
      setError(
        "Payment cannot be greater than the outstanding balance."
      );

      return;
    }

    try {
      setReceivingPayment(true);

      const response =
        await fetch(
          "/api/credit-customers/payments",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              customerId:
                customer.id,

              amount,
            }),
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
            "Unable to receive payment."
        );
      }

      setPaymentAmount("");

      router.refresh();

    } catch (error) {
      console.error(
        "RECEIVE PAYMENT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to receive payment."
      );

    } finally {
      setReceivingPayment(false);
    }
  }

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

          <Link
            href="/cashier/credit-customers"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={18} />

            Credit Customers
          </Link>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            CASHIER
          </span>

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-4 py-7">

        {/* ==================================================
            CUSTOMER
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h1 className="text-2xl font-bold">
            {customer.name}
          </h1>

          {customer.phone && (
            <p className="mt-1 text-sm text-slate-500">
              {customer.phone}
            </p>
          )}

          {customer.description && (
            <p className="mt-2 text-sm text-slate-500">
              {customer.description}
            </p>
          )}

        </section>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

          <SummaryCard
            title="Total Credit"
            amount={
              customer.totalCredit
            }
            icon={
              <CreditCard size={19} />
            }
          />

          <SummaryCard
            title="Total Paid"
            amount={
              customer.totalPaid
            }
            icon={
              <Wallet size={19} />
            }
          />

          <SummaryCard
            title="Outstanding"
            amount={outstanding}
            icon={
              <CreditCard size={19} />
            }
            danger={
              outstanding > 0
            }
          />

        </section>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* =================================================
              POST CREDIT
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Plus size={19} />
              </div>

              <div>

                <h2 className="font-bold">
                  Post Credit
                </h2>

                <p className="text-xs text-slate-500">
                  Add a new credit sale.
                </p>

              </div>

            </div>

            <form
              onSubmit={
                handlePostCredit
              }
              className="mt-5 space-y-4"
            >

              <input
                type="number"
                min="1"
                step="1"
                value={creditAmount}
                onChange={(event) =>
                  setCreditAmount(
                    event.target.value
                  )
                }
                placeholder="Credit amount"
                disabled={postingCredit}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100"
              />

              <input
                type="text"
                value={
                  creditDescription
                }
                onChange={(event) =>
                  setCreditDescription(
                    event.target.value
                  )
                }
                placeholder="Description (optional)"
                disabled={postingCredit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100"
              />

              <button
                type="submit"
                disabled={
                  postingCredit
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={17} />

                {postingCredit
                  ? "Posting..."
                  : "Post Credit"}
              </button>

            </form>

          </div>

          {/* =================================================
              RECEIVE PAYMENT
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Wallet size={19} />
              </div>

              <div>

                <h2 className="font-bold">
                  Receive Payment
                </h2>

                <p className="text-xs text-slate-500">
                  Record payment from this customer.
                </p>

              </div>

            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">

              <p className="text-xs text-slate-500">
                Outstanding balance
              </p>

              <p className="mt-1 text-lg font-bold text-red-600">
                KSh{" "}
                {outstanding.toLocaleString(
                  "en-KE"
                )}
              </p>

            </div>

            <form
              onSubmit={
                handleReceivePayment
              }
              className="mt-4 space-y-4"
            >

              <input
                type="number"
                min="1"
                max={
                  outstanding > 0
                    ? outstanding
                    : undefined
                }
                step="1"
                value={paymentAmount}
                onChange={(event) =>
                  setPaymentAmount(
                    event.target.value
                  )
                }
                placeholder="Payment amount"
                disabled={
                  receivingPayment ||
                  outstanding <= 0
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100"
              />

              <button
                type="submit"
                disabled={
                  receivingPayment ||
                  outstanding <= 0
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Wallet size={17} />

                {receivingPayment
                  ? "Processing..."
                  : outstanding <= 0
                    ? "Fully Paid"
                    : "Receive Payment"}
              </button>

            </form>

          </div>

        </section>

        {/* ==================================================
            DETAILED STATEMENT
        ================================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="font-bold">
              Detailed Statement
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete history of credits and payments.
            </p>

          </div>

          {statement.length === 0 ? (

            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No credit transactions recorded yet.
            </div>

          ) : (

            <div className="divide-y divide-slate-200">

              {statement.map(
                (entry) => (
                  <div
                    key={`${entry.type}-${entry.id}`}
                    className="px-6 py-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <span
                          className={
                            entry.type ===
                            "CREDIT"
                              ? "inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700"
                              : "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"
                          }
                        >
                          {entry.type ===
                          "CREDIT"
                            ? "CREDIT"
                            : "PAYMENT"}
                        </span>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {entry.description ||
                            (entry.type ===
                            "CREDIT"
                              ? "Credit sale"
                              : "Credit payment")}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(
                            entry.createdAt
                          ).toLocaleString(
                            "en-KE",
                            {
                              dateStyle:
                                "medium",

                              timeStyle:
                                "short",
                            }
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {entry.type ===
                          "CREDIT"
                            ? `Posted by ${entry.userName}`
                            : `Received by ${entry.userName}`}
                        </p>

                      </div>

                      <p
                        className={
                          entry.type ===
                          "CREDIT"
                            ? "shrink-0 text-sm font-bold text-red-600"
                            : "shrink-0 text-sm font-bold text-emerald-600"
                        }
                      >
                        {entry.type ===
                        "CREDIT"
                          ? "+"
                          : "-"}{" "}
                        KSh{" "}
                        {entry.amount.toLocaleString(
                          "en-KE"
                        )}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  amount,
  icon,
  danger = false,
}: {
  title: string;
  amount: number;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-2 text-slate-500">

        {icon}

        <span className="text-xs font-semibold uppercase tracking-wide">
          {title}
        </span>

      </div>

      <p
        className={
          danger
            ? "mt-3 text-xl font-bold text-red-600"
            : "mt-3 text-xl font-bold text-slate-900"
        }
      >
        KSh{" "}
        {amount.toLocaleString(
          "en-KE"
        )}
      </p>

    </div>
  );
}