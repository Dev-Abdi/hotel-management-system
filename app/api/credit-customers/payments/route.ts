import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const customerId = String(
      body.customerId || ""
    );

    const amount = Number(body.amount);

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer is required.",
        },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid payment amount.",
        },
        { status: 400 }
      );
    }

    const customer =
      await prisma.creditCustomer.findUnique({
        where: {
          id: customerId,
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 }
      );
    }

    const outstanding =
      customer.totalCredit -
      customer.totalPaid;

    if (amount > outstanding) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment cannot exceed the outstanding balance of KSh ${outstanding.toLocaleString(
            "en-KE"
          )}.`,
        },
        { status: 400 }
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {

          const payment =
            await tx.creditPayment.create({
              data: {
                amount,
                customerId,
                receivedById:
                  session.user.id,
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
            });


          const updatedCustomer =
            await tx.creditCustomer.update({
              where: {
                id: customerId,
              },

              data: {
                totalPaid: {
                  increment: amount,
                },
              },
            });


          return {
            payment,
            updatedCustomer,
          };
        }
      );

    return NextResponse.json({
      success: true,
      message: "Credit payment received successfully.",
      customer: result.updatedCustomer,
      payment: result.payment,
    });

  } catch (error) {
    console.error(
      "RECEIVE CREDIT PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to record payment.",
      },
      { status: 500 }
    );
  }
}