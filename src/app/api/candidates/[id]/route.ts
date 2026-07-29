import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CandidateStatus, Prisma } from "@/generated/prisma/client";
import { resolveCategory } from "@/lib/skillCategories";

const VALID_STATUSES = new Set(Object.values(CandidateStatus));

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, statusReason, skillCategory } = body as {
    status?: string;
    statusReason?: string;
    skillCategory?: string;
  };

  const data: Prisma.CandidateUpdateInput = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.has(status as CandidateStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if ((status === "REJECTED" || status === "WAITLIST") && !statusReason?.trim()) {
      return NextResponse.json(
        { error: "A reason is required for this status" },
        { status: 400 },
      );
    }

    data.status = status as CandidateStatus;
    data.statusReason = statusReason?.trim() || null;
    data.reviewedBy = { connect: { id: session.user.id } };
  }

  if (skillCategory !== undefined) {
    const trimmed = skillCategory.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Category cannot be empty" }, { status: 400 });
    }
    data.skillCategory = await resolveCategory(trimmed);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data,
    select: {
      id: true,
      status: true,
      statusReason: true,
      skillCategory: true,
      reviewedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ candidate });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.candidate.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
