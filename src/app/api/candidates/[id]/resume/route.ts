import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CloudinaryResourceType, signedDeliveryUrl } from "@/lib/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: {
      fileData: true,
      fileName: true,
      mimeType: true,
      cloudinaryPublicId: true,
      cloudinaryResourceType: true,
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mode = req.nextUrl.searchParams.get("mode") === "download" ? "download" : "inline";
  const safeFileName = candidate.fileName.replace(/"/g, "");

  if (candidate.cloudinaryPublicId) {
    const url = signedDeliveryUrl(
      candidate.cloudinaryPublicId,
      (candidate.cloudinaryResourceType as CloudinaryResourceType) ?? "raw",
      mode,
    );
    return NextResponse.redirect(url);
  }

  // Legacy rows uploaded before the Cloudinary migration still carry raw bytes.
  if (!candidate.fileData) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(candidate.fileData, {
    headers: {
      "Content-Type": candidate.mimeType,
      "Content-Disposition": `${mode === "download" ? "attachment" : "inline"}; filename="${safeFileName}"`,
    },
  });
}
