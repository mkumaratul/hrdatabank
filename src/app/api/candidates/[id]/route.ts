import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { resolveCategory } from "@/lib/skillCategories";
import {
  resolveStatus,
  STATUSES_REQUIRING_REASON,
  STATUSES_REQUIRING_INTERVIEW_DATE,
} from "@/lib/candidateStatuses";

const TEXT_FIELDS = [
  "name",
  "email",
  "phone",
  "experience",
  "currentCtc",
  "expectedCtc",
  "noticePeriod",
  "location",
] as const;
type TextField = (typeof TEXT_FIELDS)[number];

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
  const { status, statusReason, interviewDate, skillCategory, workLinks, ...textFields } =
    body as {
      status?: string;
      statusReason?: string;
      interviewDate?: string | null;
      skillCategory?: string;
      workLinks?: string[];
    } & Partial<Record<TextField, string>>;

  const data: Prisma.CandidateUpdateInput = {};

  if (status !== undefined) {
    const trimmedStatus = status.trim();
    if (!trimmedStatus) {
      return NextResponse.json({ error: "Status cannot be empty" }, { status: 400 });
    }

    const resolvedStatus = await resolveStatus(trimmedStatus);

    if (STATUSES_REQUIRING_REASON.has(resolvedStatus) && !statusReason?.trim()) {
      return NextResponse.json(
        { error: "A reason is required for this status" },
        { status: 400 },
      );
    }

    if (STATUSES_REQUIRING_INTERVIEW_DATE.has(resolvedStatus) && !interviewDate) {
      return NextResponse.json(
        { error: "An interview date is required for this status" },
        { status: 400 },
      );
    }

    data.status = resolvedStatus;
    data.statusReason = statusReason?.trim() || null;
    data.reviewedBy = { connect: { id: session.user.id } };
  }

  if (interviewDate !== undefined) {
    if (interviewDate === null || interviewDate === "") {
      data.interviewDate = null;
    } else {
      const parsed = new Date(interviewDate);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid interview date" }, { status: 400 });
      }
      data.interviewDate = parsed;
    }
  }

  if (skillCategory !== undefined) {
    const trimmed = skillCategory.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Category cannot be empty" }, { status: 400 });
    }
    data.skillCategory = await resolveCategory(trimmed);
  }

  for (const field of TEXT_FIELDS) {
    const value = textFields[field];
    if (value !== undefined) {
      data[field] = value.trim() || null;
    }
  }

  if (workLinks !== undefined) {
    data.workLinks = workLinks.map((l) => l.trim()).filter(Boolean);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      statusReason: true,
      interviewDate: true,
      skillCategory: true,
      experience: true,
      currentCtc: true,
      expectedCtc: true,
      noticePeriod: true,
      location: true,
      workLinks: true,
      updatedAt: true,
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
