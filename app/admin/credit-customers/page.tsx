"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Plus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";

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
  payments: Payment[];
};

export default function CreditCustomersPage() {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [showRegister, setShowRegister] =
    useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [showCredit, setShowCredit] =
    useState(false);

  const [showPayment, setShowPayment] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD CUSTOMERS
  ===================================================== */

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
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
            "Unable to load customers."
        );
      }

      setCustomers(
        data.customers || []
      );

    } catch (err) {
      console.error(
        "LOAD CUSTOMERS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );

    } finally {
      setLoading(false);
    }
  }

useEffect(() => {
  let cancelled = false;

  async function loadInitialCustomers() {
    try {
      const response = await fetch(
        "/api/credit-customers",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load customers."
        );
      }

      if (!cancelled) {
        setCustomers(
          data.customers || []
        );
        setLoading(false);
      }
    } catch (err) {
      console.error(
        "LOAD CUSTOMERS ERROR:",
        err
      );

      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load customers."
        );

        setLoading(false);
      }
    }
  }

  loadInitialCustomers();

  return () => {
    cancelled = true;
  };
}, []);


  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredCustomers =
    customers.filter((customer) => {

      const value =
        search.trim().toLowerCase();

      if (!value) {
        return true;
      }

      return (
        customer.name
          .toLowerCase()
          .includes(value) ||
        (customer.phone || "")
          .toLowerCase()
          .includes(value)
      );
    });


  /* =====================================================
     TOTAL OUTSTANDING
  ===================================================== */

  const totalOutstanding =
    customers.reduce(
      (total, customer) =>
        total +
        Math.max(
          0,
          customer.totalCredit -
            customer.totalPaid
        ),
      0
    );


  function clearMessages() {
    setMessage("");
    setError("");
  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex min-w-0 items-center gap-3">

            <Link
              href="/admin"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="min-w-0">

              <h1 className="truncate text-base font-bold">
                Credit Customers
              </h1>

              <p className="truncate text-xs text-slate-500">
                Manage customer credit accounts
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={() => {
              clearMessages();
              setShowRegister(true);
            }}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 sm:px-4 sm:text-sm"
          >
            <UserPlus size={16} />

            <span className="hidden sm:inline">
              Register Customer
            </span>

            <span className="sm:hidden">
              Add
            </span>

          </button>

        </div>

      </header>


      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mb-6 flex flex-wrap items-end gap-10">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Customers
            </p>

            <p className="mt-1 text-2xl font-bold">
              {customers.length}
            </p>

          </div>


          <div>

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Total Outstanding
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatMoney(
                totalOutstanding
              )}
            </p>

          </div>

        </div>


        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="relative mb-5 max-w-md">

          <Search
            size={17}
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
            placeholder="Search customer..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

        </div>


        {/* =================================================
            SUCCESS
        ================================================= */}

        {message && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

            <span>
              {message}
            </span>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
              className="ml-3"
            >
              <X size={15} />
            </button>

          </div>
        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-3"
            >
              <X size={15} />
            </button>

          </div>
        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="border-t border-slate-200 py-14 text-center">

            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

            <p className="mt-3 text-sm text-slate-500">
              Loading customers...
            </p>

          </div>

        ) : filteredCustomers.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="border-t border-slate-200 py-14 text-center">

            <CreditCard
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold">
              {search
                ? "No customers found"
                : "No credit customers yet"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {search
                ? "Try another name or phone number."
                : "Register a customer who is allowed to eat on credit."}
            </p>

          </div>

        ) : (

          /* =================================================
             CUSTOMER LIST
          ================================================= */

          <div className="border-t border-slate-200">

            {filteredCustomers.map(
              (customer) => {

                const outstanding =
                  customer.totalCredit -
                  customer.totalPaid;

                return (

                  <div
                    key={customer.id}
                    className="border-b border-slate-200 py-5"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      {/* CUSTOMER */}

                      <div className="min-w-0">

                        <p className="truncate font-semibold">
                          {customer.name}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">

                          <span>
                            {customer.phone ||
                              "No phone number"}
                          </span>

                          {customer.description && (
                            <>
                              <span className="text-slate-300">
                                •
                              </span>

                              <span>
                                {customer.description}
                              </span>
                            </>
                          )}

                        </div>

                      </div>


                      {/* RIGHT SIDE */}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">

                        {/* BALANCE */}

                        <div className="sm:min-w-[150px] sm:text-right">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Outstanding
                          </p>

                          <p
                            className={`mt-1 text-sm font-bold ${
                              outstanding > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatMoney(
                              outstanding
                            )}
                          </p>

                        </div>


                        {/* ACTIONS */}

                        <div className="flex flex-wrap items-center gap-2">

                          {/* CREDIT */}

                          <button
                            type="button"
                            onClick={() => {
                              clearMessages();

                              setSelectedCustomer(
                                customer
                              );

                              setShowCredit(
                                true
                              );
                            }}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold hover:bg-slate-50"
                          >
                            <Plus size={14} />
                            Credit
                          </button>


                          {/* PAYMENT */}

                          <button
                            type="button"
                            disabled={
                              outstanding <= 0
                            }
                            onClick={() => {
                              clearMessages();

                              setSelectedCustomer(
                                customer
                              );

                              setShowPayment(
                                true
                              );
                            }}
                            className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Pay
                          </button>


                          {/* STATEMENT */}

                          <Link
                            href={`/admin/credit-customers/${customer.id}`}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold hover:bg-slate-50"
                          >
                            <FileText size={14} />
                            Statement
                          </Link>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>


      {/* =================================================
          REGISTER MODAL
      ================================================= */}

      {showRegister && (
        <RegisterCustomerModal
          onClose={() =>
            setShowRegister(false)
          }
          onSuccess={(text) => {
            setShowRegister(false);
            setMessage(text);
            setError("");
            loadCustomers();
          }}
          onError={(text) => {
            setError(text);
            setMessage("");
          }}
        />
      )}


      {/* =================================================
          CREDIT MODAL
      ================================================= */}

      {showCredit &&
        selectedCustomer && (
          <CreditModal
            customer={selectedCustomer}
            onClose={() => {
              setShowCredit(false);
              setSelectedCustomer(null);
            }}
            onSuccess={(text) => {
              setShowCredit(false);
              setSelectedCustomer(null);
              setMessage(text);
              setError("");
              loadCustomers();
            }}
            onError={(text) => {
              setError(text);
              setMessage("");
            }}
          />
        )}


      {/* =================================================
          PAYMENT MODAL
      ================================================= */}

      {showPayment &&
        selectedCustomer && (
          <PaymentModal
            customer={selectedCustomer}
            onClose={() => {
              setShowPayment(false);
              setSelectedCustomer(null);
            }}
            onSuccess={(text) => {
              setShowPayment(false);
              setSelectedCustomer(null);
              setMessage(text);
              setError("");
              loadCustomers();
            }}
            onError={(text) => {
              setError(text);
              setMessage("");
            }}
          />
        )}

    </main>
  );
}


/* ============================================================
   REGISTER CUSTOMER
============================================================ */

function RegisterCustomerModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!name.trim()) {
      onError(
        "Customer name is required."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/credit-customers",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            description:
              description.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to register customer."
        );
      }

      onSuccess(
        "Customer registered successfully."
      );

    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Unable to register customer."
      );

    } finally {
      setSaving(false);
    }
  }


  return (
    <Modal
      title="Register Credit Customer"
      onClose={onClose}
    >

      <form
        onSubmit={submit}
        className="space-y-4"
      >

        <Input
          label="Customer Name"
          value={name}
          onChange={setName}
          placeholder="Enter customer name"
          required
        />

        <Input
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          placeholder="07..."
        />

        <Input
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Optional"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? "Registering..."
            : "Register Customer"}
        </button>

      </form>

    </Modal>
  );
}


/* ============================================================
   CREDIT
============================================================ */

function CreditModal({
  customer,
  onClose,
  onSuccess,
  onError,
}: {
  customer: Customer;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const numericAmount =
      Number(amount);

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      onError(
        "Please enter a valid credit amount."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
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
            amount:
              numericAmount,
            description:
              description.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to post credit."
        );
      }

      onSuccess(
        "Credit posted successfully."
      );

    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Unable to post credit."
      );

    } finally {
      setSaving(false);
    }
  }


  return (
    <Modal
      title={`Post Credit — ${customer.name}`}
      onClose={onClose}
    >

      <form
        onSubmit={submit}
        className="space-y-4"
      >

        <Input
          label="Credit Amount"
          value={amount}
          onChange={setAmount}
          placeholder="Enter amount"
          type="number"
          required
        />

        <Input
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="e.g. Lunch"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? "Posting..."
            : "Post Credit"}
        </button>

      </form>

    </Modal>
  );
}


/* ============================================================
   PAYMENT
============================================================ */

function PaymentModal({
  customer,
  onClose,
  onSuccess,
  onError,
}: {
  customer: Customer;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const outstanding =
    customer.totalCredit -
    customer.totalPaid;

  const [amount, setAmount] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const numericAmount =
      Number(amount);

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      onError(
        "Please enter a valid payment amount."
      );
      return;
    }

    if (
      numericAmount > outstanding
    ) {
      onError(
        `Payment cannot exceed the outstanding balance of ${formatMoney(
          outstanding
        )}.`
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
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
            amount:
              numericAmount,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to record payment."
        );
      }

      onSuccess(
        "Credit payment received successfully."
      );

    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Unable to record payment."
      );

    } finally {
      setSaving(false);
    }
  }


  return (
    <Modal
      title={`Receive Payment — ${customer.name}`}
      onClose={onClose}
    >

      <div className="mb-5 rounded-xl bg-slate-50 p-4">

        <p className="text-xs text-slate-500">
          Outstanding balance
        </p>

        <p className="mt-1 text-xl font-bold">
          {formatMoney(outstanding)}
        </p>

      </div>


      <form
        onSubmit={submit}
        className="space-y-4"
      >

        <Input
          label="Payment Amount"
          value={amount}
          onChange={setAmount}
          placeholder="Enter amount"
          type="number"
          required
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Receive Payment"}
        </button>

      </form>

    </Modal>
  );
}


/* ============================================================
   MODAL
============================================================ */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <h2 className="text-sm font-bold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>

        </div>

        <div className="p-5">
          {children}
        </div>

      </div>

    </div>
  );
}


/* ============================================================
   INPUT
============================================================ */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        required={required}
        min={
          type === "number"
            ? "1"
            : undefined
        }
        step={
          type === "number"
            ? "1"
            : undefined
        }
        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />

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