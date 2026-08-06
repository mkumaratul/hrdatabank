import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resourceTypeForMime, uploadToCloudinary } from "../src/lib/cloudinary";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const candidates = await prisma.candidate.findMany({
    where: { cloudinaryPublicId: null, fileData: { not: null } },
    select: { id: true, fileName: true, mimeType: true, fileData: true },
  });

  console.log(`Migrating ${candidates.length} resume(s) to Cloudinary...`);
  for (const c of candidates) {
    const resourceType = resourceTypeForMime(c.mimeType);
    const { publicId } = await uploadToCloudinary(
      Buffer.from(c.fileData!),
      "hrdatabank/resumes",
      resourceType,
    );
    await prisma.candidate.update({
      where: { id: c.id },
      data: { cloudinaryPublicId: publicId, cloudinaryResourceType: resourceType },
    });
    console.log(`  resume ${c.id} (${c.fileName}) -> ${publicId}`);
  }

  const attachments = await prisma.candidateAttachment.findMany({
    where: { cloudinaryPublicId: null, fileData: { not: null } },
    select: { id: true, fileName: true, mimeType: true, fileData: true },
  });

  console.log(`Migrating ${attachments.length} attachment(s) to Cloudinary...`);
  for (const a of attachments) {
    const resourceType = resourceTypeForMime(a.mimeType);
    const { publicId } = await uploadToCloudinary(
      Buffer.from(a.fileData!),
      "hrdatabank/attachments",
      resourceType,
    );
    await prisma.candidateAttachment.update({
      where: { id: a.id },
      data: { cloudinaryPublicId: publicId, cloudinaryResourceType: resourceType },
    });
    console.log(`  attachment ${a.id} (${a.fileName}) -> ${publicId}`);
  }

  console.log("Done. Existing fileData columns were left in place as a backup.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
