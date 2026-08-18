import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const customers = await prisma.creditCustomer.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
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

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("GET CREDIT CUSTOMERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load credit customers.",
      },
      { status: 500 }
    );
  }
}


/*
 * ADMIN ONLY
 *
 * Register a new credit customer.
 */
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators can register customers.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const description = String(
      body.description || ""
    ).trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required.",
        },
        { status: 400 }
      );
    }

    const customer =
      await prisma.creditCustomer.create({
        data: {
          name,
          phone: phone || null,
          description: description || null,
        },
      });

    return NextResponse.json({
      success: true,
      message: "Credit customer registered successfully.",
      customer,
    });
  } catch (error) {
    console.error(
      "CREATE CREDIT CUSTOMER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to register customer.",
      },
      { status: 500 }
    );
  }
}