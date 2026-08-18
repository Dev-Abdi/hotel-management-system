import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Must be logged in
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "You must be logged in." },
        { status: 401 }
      );
    }

    // Only Admin can create users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Only administrators can add users." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "").toUpperCase();

    if (!name || !username || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (role !== "CASHIER" && role !== "WAITER") {
      return NextResponse.json(
        {
          success: false,
          message: "You can only create Cashier or Waiter accounts.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "That username is already in use.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: role as "CASHIER" | "WAITER",
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${role === "CASHIER" ? "Cashier" : "Waiter"} account created successfully.`,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating the user.",
      },
      { status: 500 }
    );
  }
}