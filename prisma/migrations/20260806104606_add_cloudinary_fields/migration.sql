-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "cloudinaryResourceType" TEXT,
ALTER COLUMN "fileData" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CandidateAttachment" ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "cloudinaryResourceType" TEXT,
ALTER COLUMN "fileData" DROP NOT NULL;
