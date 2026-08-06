-- CreateTable
CREATE TABLE "CandidateAttachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CandidateAttachment" ADD CONSTRAINT "CandidateAttachment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
