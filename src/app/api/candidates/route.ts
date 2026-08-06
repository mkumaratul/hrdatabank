import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseResume } from "@/lib/parseResume";
import { resourceTypeForMime, uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function normalizeEmail(email: string | null): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function normalizePhone(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, "");
  return digits ? digits : null;
}

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
      experience: true,
      currentCtc: true,
      expectedCtc: true,
      noticePeriod: true,
      location: true,
      workLinks: true,
      fileName: true,
      mimeType: true,
      createdAt: true,
      updatedAt: true,
      reviewedBy: { select: { name: true } },
      uploadedBy: { select: { id: true, name: true } },
      remarks: { orderBy: { createdAt: "desc" }, select: { id: true, text: true } },
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

  const existing = await prisma.candidate.findMany({ select: { email: true, phone: true } });
  const seenEmails = new Set(
    existing.map((c) => normalizeEmail(c.email)).filter((v): v is string => v !== null),
  );
  const seenPhones = new Set(
    existing.map((c) => normalizePhone(c.phone)).filter((v): v is string => v !== null),
  );

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

    const normEmail = normalizeEmail(parsed.email);
    const normPhone = normalizePhone(parsed.phone);

    if ((normEmail && seenEmails.has(normEmail)) || (normPhone && seenPhones.has(normPhone))) {
      skipped.push({
        fileName: file.name,
        reason: "Duplicate candidate (matching email or phone already exists)",
      });
      continue;
    }

    const resourceType = resourceTypeForMime(file.type);
    const { publicId } = await uploadToCloudinary(buffer, "hrdatabank/resumes", resourceType);

    const candidate = await prisma.candidate.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        skillCategory: parsed.skillCategory,
        experience: parsed.experience,
        currentCtc: parsed.currentCtc,
        expectedCtc: parsed.expectedCtc,
        noticePeriod: parsed.noticePeriod,
        location: parsed.location,
        workLinks: parsed.workLinks,
        rawText: parsed.rawText.slice(0, 20000),
        fileName: file.name,
        mimeType: file.type,
        cloudinaryPublicId: publicId,
        cloudinaryResourceType: resourceType,
        uploadedById: session.user.id,
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
    if (normEmail) seenEmails.add(normEmail);
    if (normPhone) seenPhones.add(normPhone);
  }

  return NextResponse.json({ created, skipped });
}
