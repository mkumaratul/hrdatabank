import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseResume } from "@/lib/parseResume";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      skillCategory: true,
      status: true,
      statusReason: true,
      fileName: true,
      createdAt: true,
      reviewedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ candidates });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const parsed = await parseResume(buffer, file.type, file.name);

    const candidate = await prisma.candidate.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        skillCategory: parsed.skillCategory,
        rawText: parsed.rawText.slice(0, 20000),
        fileName: file.name,
        mimeType: file.type,
        fileData: buffer,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        skillCategory: true,
        status: true,
        fileName: true,
        createdAt: true,
      },
    });

    created.push(candidate);
  }

  return NextResponse.json({ created, skipped });
}
