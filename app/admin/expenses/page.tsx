"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Receipt,
  Search,
} from "lucide-react";


type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  paymentMethod: "CASH" | "MPESA";
  createdAt: string;

  recordedBy: {
    id: string;
    name: string;
    username: string;
  };
};


const categories = [
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


export default function ExpensesPage() {

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [totalExpenses, setTotalExpenses] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState("FOOD_SUPPLIES");

  const [description, setDescription] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<"CASH" | "MPESA">(
      "CASH"
    );

  const [saving, setSaving] =
    useState(false);


  // ==========================================
  // LOAD EXPENSES
  // ==========================================

  async function loadExpenses() {
    try {
      setError("");

      const response =
        await fetch(
          "/api/admin/expenses",
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
            "Unable to load expenses."
        );
      }

      setExpenses(
        data.expenses || []
      );

      setTotalExpenses(
        data.totalExpenses || 0
      );

    } catch (err) {
      console.error(
        "LOAD EXPENSES ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load expenses."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response =
          await fetch(
            "/api/admin/expenses",
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
              "Unable to load expenses."
          );
        }

        if (!cancelled) {
          setExpenses(
            data.expenses || []
          );

          setTotalExpenses(
            data.totalExpenses || 0
          );

          setLoading(false);
        }

      } catch (err) {

        console.error(
          "INITIAL EXPENSE LOAD ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load expenses."
          );

          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);


  // ==========================================
  // POST EXPENSE
  // ==========================================

  async function postExpense(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid amount."
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/admin/expenses",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              amount:
                numericAmount,
              category,
              description:
                description.trim(),
              paymentMethod,
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
            "Unable to record expense."
        );
      }

      setAmount("");
      setDescription("");
      setCategory(
        "FOOD_SUPPLIES"
      );
      setPaymentMethod("CASH");

      setShowForm(false);

      setMessage(
        "Expense recorded successfully."
      );

      await loadExpenses();

    } catch (err) {

      console.error(
        "POST EXPENSE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to record expense."
      );

    } finally {
      setSaving(false);
    }
  }


  // ==========================================
  // DELETE EXPENSE
  // ==========================================

  async function deleteExpense(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this expense?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/admin/expenses",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id,
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
            "Unable to delete expense."
        );
      }

      setMessage(
        "Expense deleted successfully."
      );

      await loadExpenses();

    } catch (err) {

      console.error(
        "DELETE EXPENSE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete expense."
      );
    }
  }


  // ==========================================
  // SEARCH
  // ==========================================

  const filteredExpenses =
    expenses.filter(
      (expense) => {

        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        return (
          getCategoryLabel(
            expense.category
          )
            .toLowerCase()
            .includes(query) ||

          (
            expense.description ||
            ""
          )
            .toLowerCase()
            .includes(query) ||

          expense.recordedBy.name
            .toLowerCase()
            .includes(query)
        );
      }
    );


  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex min-w-0 items-center gap-3">

            <Link
              href="/admin"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>

              <h1 className="text-base font-bold">
                Expenses
              </h1>

              <p className="text-xs text-slate-500">
                Record and manage hotel expenses
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 sm:px-4 sm:text-sm"
          >
            <Plus size={16} />

            <span className="hidden sm:inline">
              Record Expense
            </span>

            <span className="sm:hidden">
              Add
            </span>
          </button>

        </div>

      </header>


      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">


        {/* SUMMARY */}

        <div className="mb-6 flex flex-wrap gap-10">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Total Expenses
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatMoney(
                totalExpenses
              )}
            </p>

          </div>


          <div>

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Records
            </p>

            <p className="mt-1 text-2xl font-bold">
              {expenses.length}
            </p>

          </div>

        </div>


        {/* MESSAGES */}

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}


        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* SEARCH */}

        <div className="relative mb-5 max-w-md">

          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search expenses..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

        </div>


        {/* CONTENT */}

        {loading ? (

          <div className="border-t border-slate-200 py-14 text-center">

            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

            <p className="mt-3 text-sm text-slate-500">
              Loading expenses...
            </p>

          </div>

        ) : filteredExpenses.length === 0 ? (

          <div className="border-t border-slate-200 py-14 text-center">

            <Receipt
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold">
              No expenses found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Record your first expense.
            </p>

          </div>

        ) : (

          <div className="border-t border-slate-200">

            {filteredExpenses.map(
              (expense) => (

                <div
                  key={expense.id}
                  className="border-b border-slate-200 py-5"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">


                    {/* LEFT */}

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="font-semibold">
                          {getCategoryLabel(
                            expense.category
                          )}
                        </p>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {expense.paymentMethod}
                        </span>

                      </div>

                      <p className="mt-1 text-xs text-slate-500">

                        {expense.description ||
                          "No description"}

                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">

                        {formatDate(
                          expense.createdAt
                        )}

                        {" • "}

                        {expense.recordedBy.name}

                      </p>

                    </div>


                    {/* RIGHT */}

                    <div className="flex items-center justify-between gap-5 sm:justify-end">

                      <p className="text-sm font-bold">
                        {formatMoney(
                          expense.amount
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          deleteExpense(
                            expense.id
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                        title="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* RECORD EXPENSE MODAL */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <h2 className="text-sm font-bold">
                Record Expense
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

            </div>


            <form
              onSubmit={postExpense}
              className="space-y-4 p-5"
            >

              {/* AMOUNT */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Amount
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="Enter amount"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

              </div>


              {/* CATEGORY */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                >

                  {categories.map(
                    (item) => (

                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* PAYMENT METHOD */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target
                        .value as
                        | "CASH"
                        | "MPESA"
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                >

                  <option value="CASH">
                    Cash
                  </option>

                  <option value="MPESA">
                    M-Pesa
                  </option>

                </select>

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Optional description"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

              </div>


              {/* SUBMIT */}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Record Expense"}
              </button>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}


/* ============================================================
   CATEGORY LABEL
============================================================ */

function getCategoryLabel(
  category: string
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
    date
  ).toLocaleString(
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