import { prisma } from "@/lib/prisma";

export async function touchCandidateUpdatedAt(candidateId: string): Promise<Date> {
  await prisma.$executeRaw`UPDATE "Candidate" SET "updatedAt" = NOW() WHERE id = ${candidateId}`;
  const candidate = await prisma.candidate.findUniqueOrThrow({
    where: { id: candidateId },
    select: { updatedAt: true },
  });
  return candidate.updatedAt;
}
