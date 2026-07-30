import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { formatRemarkDate } from "@/lib/remarkDate";
import { touchCandidateUpdatedAt } from "@/lib/touchCandidate";

const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15MB combined
const MAX_ATTACHMENTS = 5;

export async function POST(
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
    select: { name: true, email: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  if (!candidate.email) {
    return NextResponse.json(
      { error: "This candidate has no email on file" },
      { status: 400 },
    );
  }

  const formData = await req.formData();
  const jobDescriptionId = formData.get("jobDescriptionId");
  const subject = formData.get("subject");
  const additionalContent = formData.get("additionalContent");
  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File);

  if (typeof jobDescriptionId !== "string" || typeof subject !== "string" || !subject.trim()) {
    return NextResponse.json({ error: "Job description and subject are required" }, { status: 400 });
  }

  if (files.length > MAX_ATTACHMENTS) {
    return NextResponse.json(
      { error: `You can attach at most ${MAX_ATTACHMENTS} files` },
      { status: 400 },
    );
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_ATTACHMENT_SIZE) {
    return NextResponse.json(
      { error: "Attachments are too large (15MB combined limit)" },
      { status: 400 },
    );
  }

  const jobDescription = await prisma.jobDescription.findUnique({
    where: { id: jobDescriptionId },
    select: { title: true, content: true },
  });

  if (!jobDescription) {
    return NextResponse.json({ error: "Job description not found" }, { status: 404 });
  }

  const attachments = await Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || undefined,
    })),
  );

  const greeting = candidate.name ? `Hi ${candidate.name},` : "Hi,";
  const extraHtml =
    typeof additionalContent === "string" && additionalContent.trim()
      ? `<div>${additionalContent}</div><hr />`
      : "";

  const html = `
    <p>${greeting}</p>
    ${extraHtml}
    <h2>${jobDescription.title}</h2>
    <div>${jobDescription.content}</div>
  `;

  try {
    await sendMail({
      to: candidate.email,
      subject: subject.trim(),
      html,
      attachments,
    });
  } catch (err) {
    console.error("Failed to send JD email", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  const remark = await prisma.remark.create({
    data: {
      text: `${formatRemarkDate(new Date())}: Sent JD "${jobDescription.title}" to candidate`,
      candidateId: id,
    },
    select: { id: true, text: true },
  });
  const updatedAt = await touchCandidateUpdatedAt(id);

  return NextResponse.json({ ok: true, remark, updatedAt });
}
