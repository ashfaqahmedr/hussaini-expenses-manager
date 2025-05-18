import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Validation schema for credentials
const credentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const { username, password } = credentialsSchema.parse(credentials)

          // Find user
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
            throw new Error("Invalid credentials or inactive account")
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password)
          if (!isValidPassword) {
            throw new Error("Invalid credentials")
          }

          // Return user data (excluding sensitive information)
          return {
            id: user.id,
            name: user.fullName,
            email: user.userName,
            userType: user.userType,
            timeoutInMinutes: user.timeOutMinute,
          }
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.userType = user.userType
        token.timeoutInMinutes = user.timeoutInMinutes
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.userType = token.userType
        session.user.timeoutInMinutes = token.timeoutInMinutes
      }
      return session
    },
  },
})

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  try {
    const session = await auth()
    return !!session
  } catch {
    return false
  }
}

// Helper function to check user role
export async function hasRole(role: string) {
  try {
    const session = await auth()
    return session?.user?.userType === role
  } catch {
    return false
  }
}