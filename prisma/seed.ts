import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_HR_EMAIL;
  const password = process.env.SEED_HR_PASSWORD;
  const name = process.env.SEED_HR_NAME ?? "HR Admin";

  if (!email || !password) {
    throw new Error(
      "Set SEED_HR_EMAIL and SEED_HR_PASSWORD env vars before running the seed script",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.hrUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, name, passwordHash },
  });

  console.log(`HR user ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
