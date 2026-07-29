-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "currentCtc" TEXT,
ADD COLUMN     "expectedCtc" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "noticePeriod" TEXT,
ADD COLUMN     "workLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Remark" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidateId" TEXT NOT NULL,

    CONSTRAINT "Remark_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Remark" ADD CONSTRAINT "Remark_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
