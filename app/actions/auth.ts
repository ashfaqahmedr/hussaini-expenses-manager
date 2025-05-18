"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

const userSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  userName: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userType: z.enum(["User", "Admin", "SuperAdmin"]),
  timeOutMinute: z.number().min(1),
  status: z.enum(["Active", "Disabled"]),
})

// Auth actions
export async function login(formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return { error: "Invalid credentials" }
  }

  const { username, password } = validatedFields.data

  try {
    const user = await prisma.user.findUnique({
      where: { userName: username },
      select: {
        id: true,
        fullName: true,
        userName: true,
        password: true,
        userType: true,
        timeOutMinute: true,
        status: true,
      },
    })

    if (!user || user.status !== "Active") {
      return { error: "Invalid credentials or inactive account" }
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return { error: "Invalid credentials" }
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expires: new Date(Date.now() + user.timeOutMinute * 60 * 1000),
      },
    })

    // Set session cookie
    cookies().set("session_id", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expires,
    })

    return {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        userName: user.userName,
        userType: user.userType,
        timeOutMinute: user.timeOutMinute,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An error occurred during login" }
  }
}

export async function logout() {
  const sessionId = cookies().get("session_id")?.value
  
  if (sessionId) {
    await prisma.session.delete({
      where: { id: sessionId },
    })
    cookies().delete("session_id")
  }
  
  redirect("/")
}

export async function getCurrentUser() {
  const sessionId = cookies().get("session_id")?.value
  
  if (!sessionId) {
    return null
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    })

    if (!session || session.expires < new Date()) {
      cookies().delete("session_id")
      return null
    }

    return session.user
  } catch {
    return null
  }
}

// Helper to check if user is authenticated
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/")
  }
  return user
}

// Helper to check user role
export async function requireRole(role: string) {
  const user = await requireAuth()
  if (user.userType !== role) {
    redirect("/dashboard")
  }
  return user
}