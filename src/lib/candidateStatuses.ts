import { prisma } from "@/lib/prisma";

export const BUILT_IN_STATUSES = [
  "PENDING",
  "SELECTED",
  "REJECTED",
  "WAITLIST",
  "INTERVIEW_TO_BE_SCHEDULED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_CANCELLED",
  "INTERVIEW_REJECTED",
];

export const STATUSES_REQUIRING_REASON = new Set<string>([
  "REJECTED",
  "WAITLIST",
  "INTERVIEW_CANCELLED",
  "INTERVIEW_REJECTED",
]);

export const STATUSES_REQUIRING_INTERVIEW_DATE = new Set<string>(["INTERVIEW_SCHEDULED"]);

export async function listStatuses(): Promise<string[]> {
  const rows = await prisma.candidate.findMany({
    select: { status: true },
    distinct: ["status"],
  });

  const seen = new Map<string, string>();
  for (const status of [...BUILT_IN_STATUSES, ...rows.map((r) => r.status)]) {
    const key = status.toLowerCase();
    if (!seen.has(key)) seen.set(key, status);
  }

  return Array.from(seen.values());
}

export async function resolveStatus(input: string): Promise<string> {
  const trimmed = input.trim();
  const key = trimmed.toLowerCase();

  const builtInMatch = BUILT_IN_STATUSES.find((s) => s.toLowerCase() === key);
  if (builtInMatch) return builtInMatch;

  const existing = await prisma.candidate.findFirst({
    where: { status: { equals: trimmed, mode: "insensitive" } },
    select: { status: true },
  });

  return existing?.status ?? trimmed;
}
