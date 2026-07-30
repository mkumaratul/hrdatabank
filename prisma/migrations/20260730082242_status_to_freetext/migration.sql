-- Convert Candidate.status from the CandidateStatus enum to free text,
-- preserving existing values (enum label text == desired string value).
ALTER TABLE "Candidate" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Candidate" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
ALTER TABLE "Candidate" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "CandidateStatus";
