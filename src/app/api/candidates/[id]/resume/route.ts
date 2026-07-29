import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    select: { fileData: true, fileName: true, mimeType: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mode = req.nextUrl.searchParams.get("mode");
  const disposition = mode === "download" ? "attachment" : "inline";
  const safeFileName = candidate.fileName.replace(/"/g, "");

  return new NextResponse(candidate.fileData, {
    headers: {
      "Content-Type": candidate.mimeType,
      "Content-Disposition": `${disposition}; filename="${safeFileName}"`,
    },
  });
}
