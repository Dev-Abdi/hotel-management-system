import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardRouter() {
  const session = await getServerSession(authOptions);

  /*
   * User must be logged in.
   */
  if (!session?.user) {
    redirect("/login");
  }

  /*
   * Get the authenticated user's role
   * directly from the server-side session.
   */
  const role = String(session.user.role || "")
    .trim()
    .toUpperCase();

  console.log("DASHBOARD ROUTER ROLE:", role);

  /*
   * ADMIN
   */
  if (role === "ADMIN") {
    redirect("/admin");
  }

  /*
   * CASHIER
   */
  if (role === "CASHIER") {
    redirect("/cashier");
  }

  /*
   * WAITER
   */
  if (role === "WAITER") {
    redirect("/waiter");
  }

  /*
   * Unknown or invalid role.
   */
  console.error(
    "INVALID USER ROLE:",
    session.user.role
  );

  redirect("/login");
}