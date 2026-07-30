import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeJobDescriptionHtml } from "@/lib/sanitizeJobDescriptionHtml";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.jobDescription.findUnique({
    where: { id },
    select: { createdById: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Job description not found" }, { status: 404 });
  }

  if (existing.createdById !== session.user.id) {
    return NextResponse.json(
      { error: "Only the creator can edit this job description" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { title, content } = body as { title?: string; content?: string };

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const jobDescription = await prisma.jobDescription.update({
    where: { id },
    data: { title: title.trim(), content: sanitizeJobDescriptionHtml(content) },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ jobDescription });
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
  const existing = await prisma.jobDescription.findUnique({
    where: { id },
    select: { createdById: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Job description not found" }, { status: 404 });
  }

  if (existing.createdById !== session.user.id) {
    return NextResponse.json(
      { error: "Only the creator can delete this job description" },
      { status: 403 },
    );
  }

  await prisma.jobDescription.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
