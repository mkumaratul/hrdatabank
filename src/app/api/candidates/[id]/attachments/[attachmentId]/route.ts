import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { touchCandidateUpdatedAt } from "@/lib/touchCandidate";
import { CloudinaryResourceType, deleteFromCloudinary, signedDeliveryUrl } from "@/lib/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, attachmentId } = await params;
  const attachment = await prisma.candidateAttachment.findFirst({
    where: { id: attachmentId, candidateId: id },
    select: {
      fileData: true,
      fileName: true,
      mimeType: true,
      cloudinaryPublicId: true,
      cloudinaryResourceType: true,
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mode = req.nextUrl.searchParams.get("mode") === "download" ? "download" : "inline";
  const safeFileName = attachment.fileName.replace(/"/g, "");

  if (attachment.cloudinaryPublicId) {
    const url = signedDeliveryUrl(
      attachment.cloudinaryPublicId,
      (attachment.cloudinaryResourceType as CloudinaryResourceType) ?? "raw",
      mode,
    );
    return NextResponse.redirect(url);
  }

  if (!attachment.fileData) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(attachment.fileData, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `${mode === "download" ? "attachment" : "inline"}; filename="${safeFileName}"`,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, attachmentId } = await params;
  const attachment = await prisma.candidateAttachment.findFirst({
    where: { id: attachmentId, candidateId: id },
    select: { id: true, cloudinaryPublicId: true, cloudinaryResourceType: true },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.candidateAttachment.delete({ where: { id: attachmentId } });

  if (attachment.cloudinaryPublicId) {
    await deleteFromCloudinary(
      attachment.cloudinaryPublicId,
      (attachment.cloudinaryResourceType as CloudinaryResourceType) ?? "raw",
    );
  }

  const updatedAt = await touchCandidateUpdatedAt(id);

  return NextResponse.json({ ok: true, updatedAt });
}
