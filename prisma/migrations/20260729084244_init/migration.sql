-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('PENDING', 'SELECTED', 'REJECTED', 'WAITLIST');

-- CreateTable
CREATE TABLE "HrUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "skillCategory" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "rawText" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HrUser_email_key" ON "HrUser"("email");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "HrUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
