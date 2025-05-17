// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing users (optional for dev environments)
  await prisma.user.deleteMany();

  const plainPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10); // 10 = salt rounds

  await prisma.user.create({
    data: {
      fullName: "Admin User",
      userName: "admin",
      password: hashedPassword, // store the hashed password
      userType: "SuperAdmin",
      timeOutMinute: 60,
      status: "Active",
    },
  });

  console.log("✅ Seeding completed with hashed password.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
