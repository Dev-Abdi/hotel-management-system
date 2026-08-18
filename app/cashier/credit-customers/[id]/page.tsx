import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import CreditCustomerClient from "./CreditCustomerClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CashierCreditCustomerPage({
  params,
}: PageProps) {
  /*
   * ======================================================
   * AUTHENTICATION
   * ======================================================
   */

  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user) {
    redirect("/login");
  }

  /*
   * ======================================================
   * CASHIER ONLY
   * ======================================================
   */

  const role = String(
    session.user.role || ""
  )
    .trim()
    .toUpperCase();

  if (role === "ADMIN") {
    redirect("/admin/credit-customers");
  }

  if (role === "WAITER") {
    redirect("/waiter/credit-customers");
  }

  if (role !== "CASHIER") {
    redirect("/login");
  }

  /*
   * ======================================================
   * CUSTOMER ID
   * ======================================================
   */

  const { id } = await params;

  if (!id) {
    notFound();
  }

  /*
   * ======================================================
   * LOAD CUSTOMER
   * ======================================================
   */

  const customer =
    await prisma.creditCustomer.findUnique({
      where: {
        id,
      },

      include: {
        /*
         * Every credit posted to this customer.
         */

        creditSales: {
          orderBy: {
            createdAt: "desc",
          },

          include: {
            postedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },

        /*
         * Every payment received from this customer.
         */

        payments: {
          orderBy: {
            createdAt: "desc",
          },

          include: {
            receivedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

  if (!customer) {
    notFound();
  }

  /*
   * ======================================================
   * PREPARE CLIENT-SAFE DATA
   * ======================================================
   */

  const customerData = {
    id: customer.id,

    name: customer.name,

    phone: customer.phone,

    description:
      customer.description,

    totalCredit:
      customer.totalCredit,

    totalPaid:
      customer.totalPaid,

    creditSales:
      customer.creditSales.map(
        (sale) => ({
          id: sale.id,

          amount: sale.amount,

          description:
            sale.description,

          createdAt:
            sale.createdAt.toISOString(),

          postedBy: {
            id:
              sale.postedBy.id,

            name:
              sale.postedBy.name,

            username:
              sale.postedBy.username,
          },
        })
      ),

    payments:
      customer.payments.map(
        (payment) => ({
          id: payment.id,

          amount: payment.amount,

          createdAt:
            payment.createdAt.toISOString(),

          receivedBy: {
            id:
              payment.receivedBy.id,

            name:
              payment.receivedBy.name,

            username:
              payment.receivedBy.username,
          },
        })
      ),
  };

  /*
   * ======================================================
   * CLIENT
   * ======================================================
   */

  return (
    <CreditCustomerClient
      customer={customerData}
    />
  );
}