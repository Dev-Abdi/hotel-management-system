import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required.",
        },
        { status: 400 }
      );
    }

    const customer =
      await prisma.creditCustomer.findUnique({
        where: {
          id,
        },
        include: {
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
      return NextResponse.json(
        {
          success: false,
          message: "Credit customer not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });

  } catch (error) {
    console.error(
      "CREDIT CUSTOMER STATEMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load customer statement.",
      },
      { status: 500 }
    );
  }
}