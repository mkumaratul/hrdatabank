import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatRemarkDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day}-${month}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { text } = body as { text?: string };

  const trimmed = text?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Remark text is required" }, { status: 400 });
  }

  const now = new Date();
  const remark = await prisma.remark.create({
    data: {
      text: `${formatRemarkDate(now)}: ${trimmed}`,
      candidateId: id,
    },
    select: { id: true, text: true },
  });

  return NextResponse.json({ remark });
}
