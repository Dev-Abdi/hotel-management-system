"use client";

import {
  ArrowLeft,
  Plus,
  Receipt,
  ShoppingBag,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Sale = {
  id: string;
  amount: number;
  paymentMethod: "CASH" | "MPESA" | "CREDIT";
  description: string | null;
  createdAt: string;
  postedBy: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
};

type UserTotal = {
  userId: string;
  name: string;
  username: string;
  role: string;
  total: number;
  count: number;
};

export default function AdminSalesPage() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesByUser, setSalesByUser] = useState<UserTotal[]>([]);
  const [totalSales, setTotalSales] = useState(0);

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load today's sales.
   */
  async function loadSales() {
    try {
      setError("");

      const response = await fetch("/api/admin/sales", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to load sales.");
        return;
      }

      setSales(data.sales);
      setSalesByUser(data.salesByUser);
      setTotalSales(data.totalSales);
    } catch (error) {
      console.error("LOAD SALES ERROR:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * Initial page load.
   */
  useEffect(() => {
    let cancelled = false;

    async function fetchInitialSales() {
      try {
        const response = await fetch("/api/admin/sales", {
          cache: "no-store",
        });

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          setError(data.message || "Unable to load sales.");
          setLoading(false);
          return;
        }

        setSales(data.sales);
        setSalesByUser(data.salesByUser);
        setTotalSales(data.totalSales);
        setLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("INITIAL SALES LOAD ERROR:", error);
        setError("Unable to connect to the server.");
        setLoading(false);
      }
    }

    void fetchInitialSales();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Post a new food sale.
   */
  async function postSale() {
    setError("");
    setSuccess("");

    const saleAmount = Number(amount);

    if (!saleAmount || saleAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setPosting(true);

    try {
      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: saleAmount,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to post sale.");
        return;
      }

      // Clear the form
      setAmount("");
      setDescription("");

      setSuccess("Food sale posted successfully.");

      // Refresh totals and sales history
      await loadSales();
    } catch (error) {
      console.error("POST SALE ERROR:", error);
      setError("Unable to connect to the server.");
    } finally {
      setPosting(false);
    }
  }

  /*
   * Delete a sale.
   * Only the Admin API can perform this operation.
   */
  async function deleteSale(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sale? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await fetch("/api/admin/sales", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to delete sale.");
        return;
      }

      setSuccess("Sale deleted successfully.");

      // Refresh totals and history
      await loadSales();
    } catch (error) {
      console.error("DELETE SALE ERROR:", error);
      setError("Unable to connect to the server.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-50"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-xl font-bold">
              Food Sales
            </h1>

            <p className="text-sm text-slate-500">
              Post and manage today&apos;s food sales.
            </p>
          </div>
        </div>
      </header>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        {/* =====================================================
            TOTAL SALES
        ====================================================== */}

        <section className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <ShoppingBag size={23} />
            </div>

            <div>

              <p className="text-sm text-slate-300">
                Today&apos;s Total Sales
              </p>

              <p className="mt-1 text-3xl font-bold">
                KSh {totalSales.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {sales.length} sale{sales.length === 1 ? "" : "s"} posted today
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            MESSAGES
        ====================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}


        {/* =====================================================
            TWO COLUMN LAYOUT
        ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">


          {/* ===================================================
              POST SALE
          ==================================================== */}

          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Plus size={21} />
              </div>

              <div>

                <h2 className="font-bold">
                  Post Food Sale
                </h2>

                <p className="text-sm text-slate-500">
                  Add a new food sale.
                </p>

              </div>

            </div>


            {/* AMOUNT */}

            <div className="mt-6">

              <label className="block text-sm font-medium">
                Amount (KSh)
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 850"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
              />

            </div>


            {/* DESCRIPTION */}

            <div className="mt-5">

              <label className="block text-sm font-medium">

                Description

                <span className="ml-1 font-normal text-slate-400">
                  (optional)
                </span>

              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional note about this sale"
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
              />

            </div>


            {/* POST BUTTON */}

            <button
              type="button"
              onClick={postSale}
              disabled={posting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <Plus size={18} />

              {posting ? "Posting..." : "Post Sale"}

            </button>

          </section>


          {/* ===================================================
              RIGHT SIDE
          ==================================================== */}

          <div className="space-y-6">


            {/* =================================================
                SALES BY USER
            ================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Users size={19} />
                  </div>

                  <div>

                    <h2 className="font-bold">
                      Sales by User
                    </h2>

                    <p className="text-sm text-slate-500">
                      Total sales posted by each user today.
                    </p>

                  </div>

                </div>

              </div>


              {loading ? (

                <div className="px-6 py-10 text-center text-sm text-slate-500">
                  Loading sales...
                </div>

              ) : salesByUser.length === 0 ? (

                <div className="px-6 py-10 text-center text-sm text-slate-500">
                  No sales have been posted today.
                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full text-left text-sm">

                    <thead className="border-b border-slate-200 bg-slate-50">

                      <tr>

                        <th className="px-6 py-3 font-semibold">
                          User
                        </th>

                        <th className="px-6 py-3 font-semibold">
                          Role
                        </th>

                        <th className="px-6 py-3 text-center font-semibold">
                          Sales
                        </th>

                        <th className="px-6 py-3 text-right font-semibold">
                          Total
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {salesByUser.map((user) => (

                        <tr
                          key={user.userId}
                          className="border-b border-slate-100 last:border-0"
                        >

                          {/* USER */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                                <User size={16} />
                              </div>

                              <div>

                                <p className="font-semibold">
                                  {user.name}
                                </p>

                                <p className="text-xs text-slate-400">
                                  @{user.username}
                                </p>

                              </div>

                            </div>

                          </td>


                          {/* ROLE */}

                          <td className="px-6 py-4">

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                              {user.role}
                            </span>

                          </td>


                          {/* NUMBER OF SALES */}

                          <td className="px-6 py-4 text-center">
                            {user.count}
                          </td>


                          {/* USER TOTAL */}

                          <td className="px-6 py-4 text-right font-bold">
                            KSh {user.total.toLocaleString()}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>


            {/* =================================================
                TODAY'S SALES
            ================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Receipt size={19} />
                  </div>

                  <div>

                    <h2 className="font-bold">
                      Today&apos;s Sales
                    </h2>

                    <p className="text-sm text-slate-500">
                      All food sales posted today.
                    </p>

                  </div>

                </div>

              </div>


              {loading ? (

                <div className="px-6 py-10 text-center text-sm text-slate-500">
                  Loading sales...
                </div>

              ) : sales.length === 0 ? (

                <div className="px-6 py-14 text-center">

                  <ShoppingBag
                    size={35}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-4 font-medium text-slate-600">
                    No sales posted yet
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Post the first food sale using the form.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full text-left text-sm">

                    <thead className="border-b border-slate-200 bg-slate-50">

                      <tr>

                        <th className="px-6 py-3 font-semibold">
                          Time
                        </th>

                        <th className="px-6 py-3 font-semibold">
                          Posted By
                        </th>

                        <th className="px-6 py-3 font-semibold">
                          Description
                        </th>

                        <th className="px-6 py-3 text-right font-semibold">
                          Amount
                        </th>

                        <th className="px-6 py-3 text-right font-semibold">
                          Action
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {sales.map((sale) => (

                        <tr
                          key={sale.id}
                          className="border-b border-slate-100 last:border-0"
                        >

                          {/* TIME */}

                          <td className="px-6 py-4 whitespace-nowrap">

                            {new Date(
                              sale.createdAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}

                          </td>


                          {/* POSTED BY */}

                          <td className="px-6 py-4">

                            <div>

                              <p className="font-medium">
                                {sale.postedBy.name}
                              </p>

                              <p className="text-xs text-slate-400">
                                {sale.postedBy.role}
                              </p>

                            </div>

                          </td>


                          {/* DESCRIPTION */}

                          <td className="max-w-xs px-6 py-4">

                            {sale.description ? (
                              <span className="text-slate-600">
                                {sale.description}
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                —
                              </span>
                            )}

                          </td>


                          {/* AMOUNT */}

                          <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
                            KSh {sale.amount.toLocaleString()}
                          </td>


                          {/* DELETE */}

                          <td className="px-6 py-4 text-right">

                            <button
                              type="button"
                              onClick={() => deleteSale(sale.id)}
                              disabled={deletingId === sale.id}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete sale"
                            >

                              <Trash2 size={17} />

                            </button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          </div>

        </div>

      </div>
    </main>
  );
}