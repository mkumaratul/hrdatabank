import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hrUsers = await prisma.hrUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json({ hrUsers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password } = body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.hrUser.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "That email is already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const hrUser = await prisma.hrUser.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json({ hrUser });
}
