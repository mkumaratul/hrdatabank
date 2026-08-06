import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { uploadToCloudinary } from "../src/lib/cloudinary";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const candidates = await prisma.candidate.findMany({
    where: { cloudinaryPublicId: null, fileData: { not: null } },
    select: { id: true, fileName: true, fileData: true },
  });

  console.log(`Migrating ${candidates.length} resume(s) to Cloudinary...`);
  for (const c of candidates) {
    const { publicId } = await uploadToCloudinary(Buffer.from(c.fileData!), "hrdatabank/resumes");
    await prisma.candidate.update({
      where: { id: c.id },
      data: { cloudinaryPublicId: publicId, cloudinaryResourceType: "raw" },
    });
    console.log(`  resume ${c.id} (${c.fileName}) -> ${publicId}`);
  }

  const attachments = await prisma.candidateAttachment.findMany({
    where: { cloudinaryPublicId: null, fileData: { not: null } },
    select: { id: true, fileName: true, fileData: true },
  });

  console.log(`Migrating ${attachments.length} attachment(s) to Cloudinary...`);
  for (const a of attachments) {
    const { publicId } = await uploadToCloudinary(Buffer.from(a.fileData!), "hrdatabank/attachments");
    await prisma.candidateAttachment.update({
      where: { id: a.id },
      data: { cloudinaryPublicId: publicId, cloudinaryResourceType: "raw" },
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
