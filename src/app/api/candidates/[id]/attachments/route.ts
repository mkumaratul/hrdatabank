import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { touchCandidateUpdatedAt } from "@/lib/touchCandidate";
import { resourceTypeForMime, uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const attachments = await prisma.candidateAttachment.findMany({
    where: { candidateId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true, mimeType: true, createdAt: true },
  });

  return NextResponse.json({ attachments });
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

  const candidate = await prisma.candidate.findUnique({ where: { id }, select: { id: true } });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const created = [];
  const skipped = [];

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      skipped.push({ fileName: file.name, reason: "Unsupported file type" });
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      skipped.push({ fileName: file.name, reason: "File too large" });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resourceType = resourceTypeForMime(file.type);
    const { publicId } = await uploadToCloudinary(buffer, "hrdatabank/attachments", resourceType);

    const attachment = await prisma.candidateAttachment.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        cloudinaryPublicId: publicId,
        cloudinaryResourceType: resourceType,
        candidateId: id,
      },
      select: { id: true, fileName: true, mimeType: true, createdAt: true },
    });

    created.push(attachment);
  }

  if (created.length > 0) await touchCandidateUpdatedAt(id);

  return NextResponse.json({ created, skipped });
}
