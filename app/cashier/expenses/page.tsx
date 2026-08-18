"use client";

import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type ExpenseCategory =
  | "FOOD_SUPPLIES"
  | "DRINKS"
  | "SALARIES"
  | "TRANSPORT"
  | "UTILITIES"
  | "MAINTENANCE"
  | "RENT"
  | "OTHER";

type PaymentMethod =
  | "CASH"
  | "MPESA";

type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  paymentMethod: string;
  createdAt: string;
  recordedBy: {
    id: string;
    name: string;
    username: string;
  };
};

const categories: {
  value: ExpenseCategory;
  label: string;
}[] = [
  {
    value: "FOOD_SUPPLIES",
    label: "Food Supplies",
  },
  {
    value: "DRINKS",
    label: "Drinks",
  },
  {
    value: "SALARIES",
    label: "Salaries",
  },
  {
    value: "TRANSPORT",
    label: "Transport",
  },
  {
    value: "UTILITIES",
    label: "Utilities",
  },
  {
    value: "MAINTENANCE",
    label: "Maintenance",
  },
  {
    value: "RENT",
    label: "Rent",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

export default function CashierExpensesPage() {
  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState<ExpenseCategory>(
      "FOOD_SUPPLIES"
    );

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");

  const [description, setDescription] =
    useState("");

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [posting, setPosting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =====================================================
     LOAD EXPENSES
  ===================================================== */

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/cashier/expenses",
          {
            method: "GET",
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
            "Unable to load expenses."
        );
      }

      setExpenses(
        Array.isArray(data.expenses)
          ? data.expenses
          : []
      );
    } catch (error) {
      console.error(
        "LOAD CASHIER EXPENSES ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load expenses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  let cancelled = false;

  async function loadInitialExpenses() {
    try {
      const response = await fetch(
        "/api/cashier/expenses",
        {
          method: "GET",
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
            "Unable to load expenses."
        );
      }

      if (!cancelled) {
        setExpenses(
          Array.isArray(data.expenses)
            ? data.expenses
            : []
        );
      }
    } catch (error) {
      console.error(
        "LOAD CASHIER EXPENSES ERROR:",
        error
      );

      if (!cancelled) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load expenses."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadInitialExpenses();

  return () => {
    cancelled = true;
  };
}, []);
  /* =====================================================
     POST EXPENSE
  ===================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const expenseAmount =
      Number(amount);

    if (
      !Number.isFinite(
        expenseAmount
      ) ||
      expenseAmount <= 0
    ) {
      setError(
        "Please enter a valid expense amount."
      );

      return;
    }

    try {
      setPosting(true);

      const response =
        await fetch(
          "/api/cashier/expenses",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              amount:
                expenseAmount,

              category,

              paymentMethod,

              description,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "Unable to record expense."
        );

        return;
      }

      setAmount("");

      setCategory(
        "FOOD_SUPPLIES"
      );

      setPaymentMethod(
        "CASH"
      );

      setDescription("");

      setSuccess(
        "Expense recorded successfully."
      );

      await loadExpenses();
    } catch (error) {
      console.error(
        "POST CASHIER EXPENSE ERROR:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setPosting(false);
    }
  }

  /* =====================================================
     TOTAL
  ===================================================== */

  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">

          <Link
            href="/cashier"
            aria-label="Back to Cashier Dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          >
            <ArrowLeft size={19} />
          </Link>

          <div className="min-w-0">

            <h1 className="truncate text-base font-bold sm:text-lg">
              Expenses
            </h1>

            <p className="text-[11px] text-slate-500 sm:text-xs">
              Cashier Dashboard
            </p>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-9">

        {/* =================================================
            TITLE
        ================================================== */}

        <div className="mb-6">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <Receipt size={25} />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            Record Expense
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Record business expenses whenever they
            occur. Expenses do not depend on the
            Daily Report submission window.
          </p>

        </div>

        {/* =================================================
            MESSAGES
        ================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>
              {success}
            </span>

          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          <div className="p-5 sm:p-7">

            {/* AMOUNT */}

            <div>

              <label
                htmlFor="amount"
                className="block text-sm font-semibold text-slate-700"
              >
                Expense Amount
              </label>

              <div className="relative mt-2">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  KSh
                </span>

                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="Enter amount"
                  disabled={posting}
                  required
                  className="w-full rounded-xl border border-slate-300 py-3.5 pl-14 pr-4 text-base font-semibold outline-none transition placeholder:text-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* CATEGORY */}

            <div className="mt-6">

              <label
                htmlFor="category"
                className="block text-sm font-semibold text-slate-700"
              >
                Expense Category
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target
                      .value as ExpenseCategory
                  )
                }
                disabled={posting}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>

            </div>

            {/* PAYMENT METHOD */}

            <div className="mt-6">

              <label className="block text-sm font-semibold text-slate-700">
                Payment Method
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "CASH"
                    )
                  }
                  disabled={posting}
                  className={
                    paymentMethod ===
                    "CASH"
                      ? "flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white"
                      : "flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  }
                >
                  <Banknote
                    size={18}
                  />

                  Cash
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "MPESA"
                    )
                  }
                  disabled={posting}
                  className={
                    paymentMethod ===
                    "MPESA"
                      ? "flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white"
                      : "flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  }
                >
                  <CreditCard
                    size={18}
                  />

                  M-Pesa
                </button>

              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="mt-6">

              <label
                htmlFor="description"
                className="block text-sm font-semibold text-slate-700"
              >
                Description
                <span className="ml-1 font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="What was this expense for?"
                disabled={posting}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
              />

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={posting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Plus size={19} />

              {posting
                ? "Recording Expense..."
                : "Record Expense"}

            </button>

          </div>

        </form>

        {/* =================================================
            TODAY'S TOTAL
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Wallet size={19} />
              </div>

              <div>

                <p className="text-sm font-semibold">
                  Today&apos;s Expenses
                </p>

                <p className="text-xs text-slate-400">
                  {expenses.length}{" "}
                  {expenses.length ===
                  1
                    ? "expense"
                    : "expenses"}
                </p>

              </div>

            </div>

            <p className="text-lg font-bold sm:text-xl">
              KSh{" "}
              {totalExpenses.toLocaleString(
                "en-KE"
              )}
            </p>

          </div>

        </section>

        {/* =================================================
            EXPENSE LIST
        ================================================== */}

        <section className="mt-6">

          <div className="mb-4">

            <h3 className="text-base font-bold">
              Today&apos;s Expense Records
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Expenses already recorded today.
            </p>

          </div>

          {loading ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

              <p className="mt-3 text-sm text-slate-500">
                Loading expenses...
              </p>

            </div>

          ) : expenses.length ===
            0 ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <Receipt
                size={38}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold">
                No expenses recorded today
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Recorded expenses will appear
                here.
              </p>

            </div>

          ) : (

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="divide-y divide-slate-100">

                {expenses.map(
                  (expense) => (
                    <div
                      key={
                        expense.id
                      }
                      className="p-4 sm:p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <p className="text-sm font-semibold">
                            {formatCategory(
                              expense.category
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {expense.description ||
                              "No description"}
                          </p>

                        </div>

                        <p className="shrink-0 text-sm font-bold">
                          KSh{" "}
                          {expense.amount.toLocaleString(
                            "en-KE"
                          )}
                        </p>

                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">

                        <span>
                          {expense.paymentMethod ===
                          "MPESA"
                            ? "M-Pesa"
                            : "Cash"}
                        </span>

                        <span>
                          {formatTime(
                            expense.createdAt
                          )}
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

          )}

        </section>

        {/* =================================================
            NOTICE
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">

          <strong className="text-slate-700">
            Note:
          </strong>{" "}
          Expenses can be recorded at any time.
          The expenses recorded during the day
          will be included in the Daily Report
          when the cashier closes the day.

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   CATEGORY LABEL
========================================================= */

function formatCategory(
  category: ExpenseCategory
) {
  const item =
    categories.find(
      (entry) =>
        entry.value === category
    );

  return (
    item?.label ||
    category
  );
}

/* =========================================================
   TIME
========================================================= */

function formatTime(
  value: string
) {
  return new Date(
    value
  ).toLocaleTimeString(
    "en-KE",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}