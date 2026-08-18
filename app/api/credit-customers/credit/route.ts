import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // ==========================================
    // CHECK LOGIN
    // ==========================================

    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const userId = (
      session.user as {
        id?: string;
      }
    ).id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to identify the logged-in user.",
        },
        { status: 401 }
      );
    }


    // ==========================================
    // READ REQUEST
    // ==========================================

    const body = await request.json();

    const customerId =
      typeof body.customerId === "string"
        ? body.customerId.trim()
        : "";

    const amount = Number(body.amount);

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";


    // ==========================================
    // VALIDATE
    // ==========================================

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid credit amount.",
        },
        { status: 400 }
      );
    }

    const roundedAmount =
      Math.round(amount);


    // ==========================================
    // FIND CUSTOMER
    // ==========================================

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
          message:
            "Credit customer not found.",
        },
        { status: 404 }
      );
    }


    // ==========================================
    // CREATE CREDIT SALE + UPDATE BALANCE
    //
    // Both happen in ONE transaction.
    // ==========================================

    const result =
      await prisma.$transaction(
        async (tx) => {

          // ------------------------------------
          // CREATE SALE RECORD
          // ------------------------------------

          const sale =
            await tx.sale.create({
              data: {
                amount: roundedAmount,

                paymentMethod:
                  "CREDIT",

                description:
                  description ||
                  "Credit sale",

                postedById:
                  userId,

                creditCustomerId:
                  customerId,
              },

              include: {
                postedBy: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },

                creditCustomer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            });


          // ------------------------------------
          // UPDATE CUSTOMER TOTAL CREDIT
          // ------------------------------------

          const updatedCustomer =
            await tx.creditCustomer.update({
              where: {
                id: customerId,
              },

              data: {
                totalCredit: {
                  increment:
                    roundedAmount,
                },
              },
            });


          return {
            sale,
            customer:
              updatedCustomer,
          };
        }
      );


    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,

      message:
        "Credit posted successfully.",

      sale: result.sale,

      customer:
        result.customer,
    });

  } catch (error) {

    console.error(
      "POST CREDIT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to post credit.",
      },
      { status: 500 }
    );
  }
}