"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Lock,
} from "lucide-react";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type ReportData = {
  reportDate: string;

  totalSales: number;
  totalExpenses: number;
  creditSales: number;

  actualCash: number | null;
  actualMpesa: number | null;

  submitted: boolean;
  submittedAt: string | null;

  withinSubmissionWindow: boolean;
};

export default function CashierDailyReportPage() {
  const [report, setReport] =
    useState<ReportData | null>(null);

  const [actualMpesa, setActualMpesa] =
    useState("");

  const [actualCash, setActualCash] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [confirmed, setConfirmed] =
    useState(false);

  /* =====================================================
     LOAD DAILY REPORT
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/cashier/daily-report",
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
              "Unable to load daily report."
          );
        }

        if (cancelled) {
          return;
        }

        const loadedReport =
          data.report as ReportData;

        setReport(
          loadedReport
        );

        if (
          loadedReport.actualMpesa !==
          null
        ) {
          setActualMpesa(
            String(
              loadedReport.actualMpesa
            )
          );
        }

        if (
          loadedReport.actualCash !==
          null
        ) {
          setActualCash(
            String(
              loadedReport.actualCash
            )
          );
        }
      } catch (error) {
        console.error(
          "LOAD DAILY REPORT ERROR:",
          error
        );

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load daily report."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     SUBMIT
  ===================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!report) {
      setError(
        "Daily report information is not available."
      );

      return;
    }

    if (
      !report.withinSubmissionWindow
    ) {
      setError(
        "Daily reports can only be submitted between 22:30 and 00:00."
      );

      return;
    }

    if (report.submitted) {
      setError(
        "Today's daily report has already been submitted."
      );

      return;
    }

    if (!confirmed) {
      setError(
        "Please review the figures and confirm the report before submitting."
      );

      return;
    }

    /* ===================================================
       CLOSING M-PESA
       
       M-Pesa starts from ZERO every day.
    =================================================== */

    const closingMpesa =
      Number(actualMpesa);

    /* ===================================================
       CLOSING CASH
    =================================================== */

    const cash =
      Number(actualCash);

    if (
      !Number.isFinite(
        closingMpesa
      ) ||
      closingMpesa < 0
    ) {
      setError(
        "Please enter a valid closing M-Pesa balance."
      );

      return;
    }

    if (
      !Number.isFinite(cash) ||
      cash < 0
    ) {
      setError(
        "Please enter a valid closing Cash amount."
      );

      return;
    }

    try {
      setSubmitting(true);

      const response =
        await fetch(
          "/api/cashier/daily-report",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              actualMpesa:
                closingMpesa,

              actualCash:
                cash,

              notes,

              confirmed: true,
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
            "Unable to submit daily report."
        );

        return;
      }

      setSuccess(
        "Daily report submitted successfully."
      );

      setReport(
        data.report
      );

      setConfirmed(false);
    } catch (error) {
      console.error(
        "SUBMIT DAILY REPORT ERROR:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="text-center">

          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            Loading daily report...
          </p>

        </div>

      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">

          <Link
            href="/cashier"
            aria-label="Back to Cashier Dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          >
            <ArrowLeft size={19} />
          </Link>

          <div className="min-w-0">

            <h1 className="truncate text-base font-bold sm:text-lg">
              Daily Report
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
            TITLE
        ================================================== */}

        <div className="mb-6 sm:mb-8">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <ClipboardCheck size={25} />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            Close Today&apos;s Report
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            Enter the actual closing Cash and
            M-Pesa balances, review the
            information and submit the report
            for administrative review.
          </p>

        </div>

        {/* =================================================
            SUBMISSION WINDOW
        ================================================== */}

        <div
          className={
            report?.withinSubmissionWindow
              ? "mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
              : "mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
          }
        >

          <Clock3
            size={20}
            className={
              report?.withinSubmissionWindow
                ? "mt-0.5 shrink-0 text-emerald-600"
                : "mt-0.5 shrink-0 text-amber-600"
            }
          />

          <div>

            <p className="text-sm font-semibold">
              {report?.withinSubmissionWindow
                ? "Report submission is open"
                : "Report submission is closed"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Daily reports can be submitted
              between 22:30 and 00:00.
            </p>

          </div>

        </div>

        {/* =================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">
                Report submitted
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                The report has been submitted
                for administrative review.
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================== */}

        {report && (
          <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Today&apos;s Activity
              </p>

              <p className="mt-1 text-sm font-semibold">
                {report.reportDate}
              </p>

            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3 sm:divide-y-0">

              <SummaryItem
                label="Food Sales"
                value={report.totalSales}
              />

              <SummaryItem
                label="Expenses"
                value={report.totalExpenses}
              />

              <SummaryItem
                label="Credit Sales"
                value={report.creditSales}
              />

            </div>

          </section>
        )}

        {/* =================================================
            ALREADY SUBMITTED
        ================================================== */}

        {report?.submitted && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-4">

            <Lock
              size={19}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <div>

              <p className="text-sm font-semibold">
                Today&apos;s report has already
                been submitted
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                This report is locked and cannot
                be submitted again.
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          <div className="p-5 sm:p-7">

            {/* =================================================
                CLOSING M-PESA
            ================================================== */}

            <div>

              <label
                htmlFor="actualMpesa"
                className="block text-sm font-semibold text-slate-700"
              >
                Today&apos;s Closing M-Pesa Balance
              </label>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Enter the actual M-Pesa balance
                at closing. M-Pesa starts from
                zero every day.
              </p>

              <div className="relative mt-3">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  KSh
                </span>

                <input
                  id="actualMpesa"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={actualMpesa}
                  onChange={(event) =>
                    setActualMpesa(
                      event.target.value
                    )
                  }
                  placeholder="0"
                  disabled={
                    submitting ||
                    report?.submitted
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 py-3.5 pl-14 pr-4 text-base font-semibold outline-none transition placeholder:text-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* =================================================
                CASH
            ================================================== */}

            <div className="mt-6">

              <label
                htmlFor="actualCash"
                className="block text-sm font-semibold text-slate-700"
              >
                Today&apos;s Closing Cash
              </label>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Enter the physical cash
                available at closing.
              </p>

              <div className="relative mt-3">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  KSh
                </span>

                <input
                  id="actualCash"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={actualCash}
                  onChange={(event) =>
                    setActualCash(
                      event.target.value
                    )
                  }
                  placeholder="0"
                  disabled={
                    submitting ||
                    report?.submitted
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 py-3.5 pl-14 pr-4 text-base font-semibold outline-none transition placeholder:text-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* =================================================
                NOTES
            ================================================== */}

            <div className="mt-6">

              <label
                htmlFor="notes"
                className="block text-sm font-semibold text-slate-700"
              >
                Notes
                <span className="ml-1 font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Add any explanation or closing note..."
                disabled={
                  submitting ||
                  report?.submitted
                }
                className="mt-3 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
              />

            </div>

            {/* =================================================
                CONFIRMATION
            ================================================== */}

            {!report?.submitted && (
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) =>
                    setConfirmed(
                      event.target.checked
                    )
                  }
                  disabled={submitting}
                  className="mt-1 h-4 w-4 shrink-0 accent-slate-900"
                />

                <span className="text-sm leading-6 text-slate-600">
                  I have checked the figures
                  above and confirm that they
                  are correct. I understand that
                  the report will be submitted
                  for administrative review.
                </span>

              </label>
            )}

          </div>

          {/* =================================================
              SUBMIT
          ================================================== */}

          {!report?.submitted && (
            <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-7">

              <button
                type="submit"
                disabled={
                  submitting ||
                  !report?.withinSubmissionWindow
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <ClipboardCheck
                  size={19}
                />

                {submitting
                  ? "Submitting Report..."
                  : "Confirm & Submit Report"}

              </button>

              <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                Once submitted, this daily report
                cannot be submitted again.
              </p>

            </div>
          )}

        </form>

      </div>

    </main>
  );
}

/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="p-4 sm:p-5">

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-base font-bold sm:text-lg">
        KSh{" "}
        {value.toLocaleString(
          "en-KE"
        )}
      </p>

    </div>
  );
}