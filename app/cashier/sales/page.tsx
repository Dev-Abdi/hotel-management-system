"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  ShoppingBag,
} from "lucide-react";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

export default function CashierSalesPage() {
  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [posting, setPosting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const saleAmount =
      Number(amount);

    if (
      !Number.isFinite(
        saleAmount
      ) ||
      saleAmount <= 0
    ) {
      setError(
        "Please enter a valid sale amount."
      );

      return;
    }

    try {
      setPosting(true);

      const response =
        await fetch(
          "/api/cashier/sales",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              amount: saleAmount,
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
            "Unable to post food sale."
        );

        return;
      }

      setAmount("");
      setDescription("");

      setSuccess(
        "Food sale posted successfully."
      );
    } catch (error) {
      console.error(
        "POST CASHIER SALE ERROR:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">

          <Link
            href="/cashier"
            aria-label="Back to cashier dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          >
            <ArrowLeft size={19} />
          </Link>

          <div className="min-w-0">

            <h1 className="truncate text-base font-bold sm:text-lg">
              Food Sales
            </h1>

            <p className="text-[11px] text-slate-500 sm:text-xs">
              Cashier Dashboard
            </p>

          </div>

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================== */}

      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">

        {/* =================================================
            PAGE INTRO
        ================================================== */}

        <div className="mb-6 sm:mb-8">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <ShoppingBag size={25} />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            Post Food Sale
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Enter the amount of the food sale and
            optionally add a description.
          </p>

        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">
                Sale posted successfully
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                The food sale has been recorded.
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================== */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            FORM CARD
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          <div className="p-5 sm:p-7">

            {/* =================================================
                AMOUNT
            ================================================== */}

            <div>

              <label
                htmlFor="amount"
                className="block text-sm font-semibold text-slate-700"
              >
                Sale Amount
              </label>

              <div className="relative mt-2">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  KSh
                </span>

                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  disabled={posting}
                  required
                  className="w-full rounded-xl border border-slate-300 py-3.5 pl-14 pr-4 text-lg font-semibold outline-none transition placeholder:text-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* =================================================
                DESCRIPTION
            ================================================== */}

            <div className="mt-6">

              <div className="flex items-center justify-between gap-3">

                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <span className="text-[11px] text-slate-400">
                  Optional
                </span>

              </div>

              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Example: Breakfast, lunch, dinner..."
                disabled={posting}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
              />

            </div>

          </div>

          {/* =================================================
              ACTION AREA
          ================================================== */}

          <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-7">

            <button
              type="submit"
              disabled={posting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >

              <Plus size={19} />

              {posting
                ? "Posting Sale..."
                : "Post Food Sale"}

            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
              Make sure the amount is correct before
              posting the sale.
            </p>

          </div>

        </form>

      </div>

    </main>
  );
}