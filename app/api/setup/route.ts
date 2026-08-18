import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const username = String(body.username ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, username and password are required.",
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

    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Initial admin setup has already been completed.",
        },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: "ADMIN",
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Administrator account created successfully.",
      user: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin setup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create administrator account.",
      },
      { status: 500 }
    );
  }
}