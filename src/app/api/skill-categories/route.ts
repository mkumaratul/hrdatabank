import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listCategories } from "@/lib/skillCategories";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await listCategories();
  return NextResponse.json({ categories });
}
