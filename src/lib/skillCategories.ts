import { prisma } from "@/lib/prisma";
import { SKILL_CATEGORIES } from "@/lib/parseResume";

const BUILT_IN_CATEGORIES = Object.keys(SKILL_CATEGORIES).concat("Uncategorized");

export async function listCategories(): Promise<string[]> {
  const rows = await prisma.candidate.findMany({
    where: { skillCategory: { not: null } },
    select: { skillCategory: true },
    distinct: ["skillCategory"],
  });

  const seen = new Map<string, string>();
  for (const category of [...BUILT_IN_CATEGORIES, ...rows.map((r) => r.skillCategory!)]) {
    const key = category.toLowerCase();
    if (!seen.has(key)) seen.set(key, category);
  }

  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

export async function resolveCategory(input: string): Promise<string> {
  const trimmed = input.trim();
  const key = trimmed.toLowerCase();

  const builtInMatch = BUILT_IN_CATEGORIES.find((c) => c.toLowerCase() === key);
  if (builtInMatch) return builtInMatch;

  const existing = await prisma.candidate.findFirst({
    where: { skillCategory: { equals: trimmed, mode: "insensitive" } },
    select: { skillCategory: true },
  });

  return existing?.skillCategory ?? trimmed;
}
