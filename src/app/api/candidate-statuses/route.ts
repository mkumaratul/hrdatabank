import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listStatuses } from "@/lib/candidateStatuses";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statuses = await listStatuses();
  return NextResponse.json({ statuses });
}
