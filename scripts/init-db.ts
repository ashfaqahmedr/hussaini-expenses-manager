import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // 1. Users
  await prisma.user.createMany({
    data: Array.from({ length: 10 }).map(() => ({
      fullName: faker.person.fullName(),
      userName: faker.internet.userName(),
      password: faker.internet.password(),
      userType: faker.helpers.arrayElement(["User", "Admin", "SuperAdmin"]),
      status: faker.helpers.arrayElement(["Active", "Disabled"]),
    })),
  })

  // 2. Vehicles
  await prisma.vehicle.createMany({
    data: Array.from({ length: 10 }).map((_, i) => ({
      vehicleNo: `VEH-${1000 + i}`,
      oilInLiters: `${faker.number.float({ min: 5, max: 50, fractionDigits: 1 }).toFixed(1)}`,
      contractor: faker.company.name(),
    })),
  })

  // 3. Oil Entries
  await prisma.oilEntry.createMany({
    data: Array.from({ length: 10 }).map(() => ({
      entryType: faker.helpers.arrayElement(["Sales", "Purchase"]),
      date: faker.date.recent({ days: 30 }),
      vehicleNo: `VEH-${faker.number.int({ min: 1000, max: 1009 })}`,
      oilLiters: faker.number.int({ min: 10, max: 60 }).toString(),
      purchasedStock: faker.number.int({ min: 100, max: 1000 }).toString(),
      invoiceAmount: faker.number.float({ min: 1000, max: 10000, fractionDigits: 0 }).toString(),
      vendor: faker.company.name(),
      remarks: faker.lorem.sentence(),
      createdOn: faker.date.recent({ days: 30 }),
      enteredBy: faker.internet.userName(),
      editedOn: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : null,
      editedBy: faker.datatype.boolean() ? faker.internet.userName() : null,
      status: faker.helpers.arrayElement(["Pending", "Updated", "Rejected"]),
    })),
  })

  // 4. Reports
  await prisma.report.createMany({
    data: Array.from({ length: 10 }).map((_, i) => ({
      srNo: `SR-${i + 1}`,
      vehicleNo: `VEH-${1000 + i}`,
      lastDateOfOilChange: faker.date.past(),
      tripAfterOilChange: faker.number.int({ min: 100, max: 1000 }).toString(),
    })),
  })

  // 5. Settings
  await prisma.settings.createMany({
    data: Array.from({ length: 10 }).map((_, i) => ({
      key: `setting_key_${i + 1}`,
      value: faker.lorem.word(),
    })),
  })

  console.log("✅ Seeding complete")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
