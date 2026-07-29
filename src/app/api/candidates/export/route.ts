import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reviewedBy: { select: { name: true } },
      remarks: { orderBy: { createdAt: "desc" }, select: { text: true } },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Candidates");

  sheet.columns = [
    { header: "Date", key: "createdAt", width: 14 },
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Skill Category", key: "skillCategory", width: 20 },
    { header: "Status", key: "status", width: 22 },
    { header: "Reason", key: "statusReason", width: 30 },
    { header: "Relevant Experience", key: "experience", width: 18 },
    { header: "Current CTC", key: "currentCtc", width: 16 },
    { header: "Expected CTC", key: "expectedCtc", width: 16 },
    { header: "Notice Period", key: "noticePeriod", width: 18 },
    { header: "Location", key: "location", width: 18 },
    { header: "Work Links", key: "workLinks", width: 40 },
    { header: "Remarks", key: "remarks", width: 50 },
    { header: "Resume File", key: "fileName", width: 25 },
    { header: "Reviewed By", key: "reviewedBy", width: 20 },
  ];

  for (const c of candidates) {
    sheet.addRow({
      createdAt: c.createdAt.toLocaleDateString("en-GB"),
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      skillCategory: c.skillCategory ?? "",
      status: c.status,
      statusReason: c.statusReason ?? "",
      experience: c.experience ?? "",
      currentCtc: c.currentCtc ?? "",
      expectedCtc: c.expectedCtc ?? "",
      noticePeriod: c.noticePeriod ?? "",
      location: c.location ?? "",
      workLinks: c.workLinks.join("\n"),
      remarks: c.remarks.map((r) => r.text).join("\n"),
      fileName: c.fileName,
      reviewedBy: c.reviewedBy?.name ?? "",
    });
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="candidates.xlsx"`,
    },
  });
}
