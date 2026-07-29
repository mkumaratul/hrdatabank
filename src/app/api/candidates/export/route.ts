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
    include: { reviewedBy: { select: { name: true } } },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Candidates");

  sheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Skill Category", key: "skillCategory", width: 20 },
    { header: "Status", key: "status", width: 14 },
    { header: "Reason", key: "statusReason", width: 30 },
    { header: "Resume File", key: "fileName", width: 25 },
    { header: "Reviewed By", key: "reviewedBy", width: 20 },
    { header: "Uploaded At", key: "createdAt", width: 20 },
  ];

  for (const c of candidates) {
    sheet.addRow({
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      skillCategory: c.skillCategory ?? "",
      status: c.status,
      statusReason: c.statusReason ?? "",
      fileName: c.fileName,
      reviewedBy: c.reviewedBy?.name ?? "",
      createdAt: c.createdAt.toISOString(),
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
