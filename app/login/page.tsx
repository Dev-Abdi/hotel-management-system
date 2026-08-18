"use client";

import { FormEvent, useState } from "react";
import {
  LogIn,
  LockKeyhole,
  User,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError(
        "Please enter your username and password."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * ================================================
       * AUTHENTICATE USER
       * ================================================
       */

      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      /*
       * ================================================
       * LOGIN FAILED
       * ================================================
       */

      if (!result || result.error) {
        setError(
          "Invalid username or password."
        );
        return;
      }

      /*
       * ================================================
       * LOGIN SUCCESSFUL
       * ================================================
       *
       * Do NOT decide the user's role here.
       *
       * Do NOT send users directly to /admin.
       *
       * The /dashboard page is a SERVER-SIDE
       * role router and will determine:
       *
       * ADMIN   -> /admin
       * CASHIER -> /cashier
       * WAITER  -> /waiter
       *
       */

      router.replace("/dashboard");

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        "Unable to connect to the authentication server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">

      <div className="w-full max-w-md">

        {/* =================================================
            BRANDING
        ================================================= */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <span className="text-2xl font-bold">
              H
            </span>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Hotel Management System
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue
          </p>

        </div>

        {/* =================================================
            LOGIN CARD
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold text-slate-900">
            Login
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter your account details below.
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-6 space-y-5"
          >

            {/* =================================================
                USERNAME
            ================================================= */}

            <div>

              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700"
              >
                Username
              </label>

              <div className="relative mt-2">

                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative mt-2">

                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <LogIn size={18} />

              {loading
                ? "Signing in..."
                : "Sign In"}

            </button>

          </form>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <p className="mt-6 text-center text-xs text-slate-400">
          Hotel Management System
        </p>

      </div>

    </main>
  );
}