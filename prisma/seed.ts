import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.MENTOR_EMAIL?.trim().toLowerCase();
  const password = process.env.MENTOR_PASSWORD;
  const name = process.env.MENTOR_NAME?.trim() || "Project Mentor";

  if (!email || !password) {
    throw new Error(
      "MENTOR_EMAIL and MENTOR_PASSWORD must be configured in .env.",
    );
  }

  if (password.length < 8) {
    throw new Error("MENTOR_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const mentor = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: "MENTOR",
    },
    create: {
      name,
      email,
      passwordHash,
      role: "MENTOR",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("Mentor account seeded:", mentor);
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed mentor account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
