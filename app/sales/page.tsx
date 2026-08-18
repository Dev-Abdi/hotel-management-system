"use client";

import { ArrowLeft, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Sale = {
  id: number;
  amount: number;
  postedBy: string;
  time: string;
};

export default function SalesPage() {
  const [amount, setAmount] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);

  const totalSales = sales.reduce(
    (total, sale) => total + sale.amount,
    0
  );

  function postSale() {
    const saleAmount = Number(amount);

    if (!saleAmount || saleAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const newSale: Sale = {
      id: Date.now(),
      amount: saleAmount,
      postedBy: "Admin",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setSales((current) => [newSale, ...current]);
    setAmount("");
  }

  function deleteSale(id: number) {
    setSales((current) =>
      current.filter((sale) => sale.id !== id)
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-50"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-xl font-bold">Food Sales</h1>

            <p className="text-sm text-slate-500">
              Record food served to customers.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        {/* Total Sales */}
        <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <ShoppingBag size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-300">
                Today&apos;s Total Sales
              </p>

              <p className="text-3xl font-bold">
                KSh {totalSales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Post Sale Form */}
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Post Food Sale
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the total price of food served to the
              customer.
            </p>

            <label
              htmlFor="sale-amount"
              className="mt-6 block text-sm font-medium"
            >
              Amount (KSh)
            </label>

            <input
              id="sale-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  postSale();
                }
              }}
              placeholder="e.g. 850"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />

            <button
              type="button"
              onClick={postSale}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
            >
              <Plus size={19} />
              Post Sale
            </button>
          </section>

          {/* Sales History */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-bold">
                Today&apos;s Sales
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sales posted today.
              </p>
            </div>

            {sales.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <ShoppingBag
                  size={35}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-medium text-slate-600">
                  No sales posted yet
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Post your first food sale using the form.
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
                        <td className="px-6 py-4">
                          {sale.time}
                        </td>

                        <td className="px-6 py-4">
                          {sale.postedBy}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold">
                          KSh {sale.amount.toLocaleString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              deleteSale(sale.id)
                            }
                            className="cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-50"
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
    </main>
  );
}