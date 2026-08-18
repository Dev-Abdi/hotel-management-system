import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       CHECK SESSION
    ===================================================== */

    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be logged in.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       CHECK ROLE
    ===================================================== */

    const role = String(
      session.user.role || ""
    )
      .trim()
      .toUpperCase();

    /*
     * CASHIER ONLY
     */

    if (role !== "CASHIER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Cashiers can post sales from this page.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       GET USER ID
    ===================================================== */

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

    /* =====================================================
       READ REQUEST
    ===================================================== */

    const body =
      await request.json();

    const amount =
      Number(body.amount);

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    /* =====================================================
       VALIDATE AMOUNT
    ===================================================== */

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid sale amount.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CREATE FOOD SALE
    ===================================================== */

    const sale =
      await prisma.sale.create({
        data: {
          amount,

          description:
            description ||
            "Food sale",

          postedById:
            userId,
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
      });

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        "Food sale posted successfully.",

      sale,
    });

  } catch (error) {

    console.error(
      "CASHIER FOOD SALE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to post food sale.",
      },
      { status: 500 }
    );
  }
}