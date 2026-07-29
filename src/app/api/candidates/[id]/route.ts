import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CandidateStatus } from "@/generated/prisma/client";

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
  const { status, statusReason } = body as { status?: string; statusReason?: string };

  if (!status || !VALID_STATUSES.has(status as CandidateStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if ((status === "REJECTED" || status === "WAITLIST") && !statusReason?.trim()) {
    return NextResponse.json(
      { error: "A reason is required for this status" },
      { status: 400 },
    );
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: {
      status: status as CandidateStatus,
      statusReason: statusReason?.trim() || null,
      reviewedById: session.user.id,
    },
    select: {
      id: true,
      status: true,
      statusReason: true,
      reviewedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ candidate });
}
