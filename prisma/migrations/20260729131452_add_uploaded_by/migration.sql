-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "uploadedById" TEXT;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "HrUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
