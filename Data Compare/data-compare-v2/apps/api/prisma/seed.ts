import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function upsertUser(username: string, password: string, role: UserRole) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { username },
    update: { passwordHash, role },
    create: { username, passwordHash, role },
  });
}

async function main() {
  // These mirror the legacy default credentials. Operators MUST rotate them
  // after first login — see README "Initial setup".
  await upsertUser("superadmin", "SuperAdmin@123!", "superadmin");
  await upsertUser("admin", "Admin123!", "admin");
  for (let i = 1; i <= 4; i++) {
    await upsertUser(`user${i}`, `User${i}Pass!`, "user");
  }
  console.log("Seeded default users.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
