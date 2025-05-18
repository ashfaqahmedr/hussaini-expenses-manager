"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "./auth"
import { z } from "zod"

// Validation schemas
const oilEntrySchema = z.object({
  entryType: z.enum(["Sales", "Purchase"]),
  date: z.string(),
  vehicleNo: z.string().optional(),
  oilLiters: z.string().optional(),
  purchasedStock: z.string().optional(),
  invoiceAmount: z.string().optional(),
  vendor: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(["Pending", "Updated", "Rejected"]).default("Pending"),
})

// Data actions
export async function createOilEntry(formData: FormData) {
  const user = await requireAuth()
  
  const validatedFields = oilEntrySchema.safeParse({
    entryType: formData.get("entryType"),
    date: formData.get("date"),
    vehicleNo: formData.get("vehicleNo"),
    oilLiters: formData.get("oilLiters"),
    purchasedStock: formData.get("purchasedStock"),
    invoiceAmount: formData.get("invoiceAmount"),
    vendor: formData.get("vendor"),
    remarks: formData.get("remarks"),
  })

  if (!validatedFields.success) {
    return { error: "Invalid data provided" }
  }

  try {
    const entry = await prisma.oilEntry.create({
      data: {
        ...validatedFields.data,
        createdOn: new Date(),
        enteredBy: user.fullName,
      },
    })

    revalidatePath("/dashboard")
    return { success: true, entry }
  } catch (error) {
    console.error("Create entry error:", error)
    return { error: "Failed to create entry" }
  }
}

export async function updateOilEntry(id: string, formData: FormData) {
  const user = await requireAuth()

  const validatedFields = oilEntrySchema.partial().safeParse({
    date: formData.get("date"),
    vehicleNo: formData.get("vehicleNo"),
    oilLiters: formData.get("oilLiters"),
    purchasedStock: formData.get("purchasedStock"),
    invoiceAmount: formData.get("invoiceAmount"),
    vendor: formData.get("vendor"),
    remarks: formData.get("remarks"),
    status: formData.get("status"),
  })

  if (!validatedFields.success) {
    return { error: "Invalid data provided" }
  }

  try {
    const entry = await prisma.oilEntry.update({
      where: { id },
      data: {
        ...validatedFields.data,
        editedOn: new Date(),
        editedBy: user.fullName,
      },
    })

    revalidatePath("/dashboard")
    return { success: true, entry }
  } catch (error) {
    console.error("Update entry error:", error)
    return { error: "Failed to update entry" }
  }
}

export async function deleteOilEntry(id: string) {
  await requireAuth()

  try {
    await prisma.oilEntry.delete({
      where: { id },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Delete entry error:", error)
    return { error: "Failed to delete entry" }
  }
}

export async function getDashboardData() {
  const user = await requireAuth()

  try {
    const [oilEntries, vehicles, reports, users, vendors] = await Promise.all([
      prisma.oilEntry.findMany({
        orderBy: { date: "desc" },
      }),
      prisma.vehicle.findMany(),
      prisma.report.findMany(),
      user.userType === "SuperAdmin" 
        ? prisma.user.findMany({
            select: {
              id: true,
              fullName: true,
              userName: true,
              userType: true,
              timeOutMinute: true,
              status: true,
            },
          })
        : Promise.resolve([]),
      prisma.oilEntry.findMany({
        where: { vendor: { not: null } },
        select: { vendor: true },
        distinct: ["vendor"],
      }).then(entries => entries.map(e => e.vendor!)),
    ])

    return {
      success: true,
      data: {
        oilEntries,
        vehicles,
        reports,
        users,
        vendors,
      },
    }
  } catch (error) {
    console.error("Get dashboard data error:", error)
    return { error: "Failed to fetch dashboard data" }
  }
}