import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100">

      <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">

        <div className="mx-auto flex max-w-6xl items-center justify-between">

          <div className="flex items-center gap-4">

            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-xl font-bold">
                Users
              </h1>

              <p className="text-sm text-slate-500">
                Manage hotel system users.
              </p>
            </div>

          </div>

          <Link
            href="/admin/users/add"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <UserPlus size={18} />
            Add User
          </Link>

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-bold">
              System Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {users.length} user{users.length === 1 ? "" : "s"} registered.
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>
                  <th className="px-6 py-3 font-semibold">
                    Name
                  </th>

                  <th className="px-6 py-3 font-semibold">
                    Username
                  </th>

                  <th className="px-6 py-3 font-semibold">
                    Role
                  </th>

                  <th className="px-6 py-3 font-semibold">
                    Status
                  </th>

                  <th className="px-6 py-3 font-semibold">
                    Created
                  </th>
                </tr>

              </thead>

              <tbody>

                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0"
                  >

                    <td className="px-6 py-4 font-medium">
                      {user.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {user.username}
                    </td>

                    <td className="px-6 py-4">

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                        {user.role}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      {user.active ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Inactive
                        </span>
                      )}

                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {user.createdAt.toLocaleDateString()}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </main>
  );
}