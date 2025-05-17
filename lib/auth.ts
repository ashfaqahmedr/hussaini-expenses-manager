import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { ZodError } from "zod"
import { signInSchema } from "@/lib/zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { username, password } = await signInSchema.parseAsync(credentials)

          const user = await prisma.user.findUnique({
            where: { userName: username },
          })

          if (!user || user.status !== "Active") return null

          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) return null

          return {
            id: user.id,
            fullName: user.fullName,
            userName: user.userName,
            userType: user.userType,
            timeoutInMinutes: user.timeOutMinute,
            userStatus: user.status,
          }
        } catch (error) {
          console.error("Authorize error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        const now = Math.floor(Date.now() / 1000)
        const expiresIn = (user.timeoutInMinutes || 30) * 60 // fallback to 30 mins
        token.id = user.id
        token.userType = user.userType
        token.timeoutInMinutes = user.timeoutInMinutes
        token.userStatus = user.userStatus
        token.exp = now + expiresIn
      }

      const now = Math.floor(Date.now() / 1000)
      if (token.exp && token.exp < now) {
        throw new Error("Session expired")
      }

      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id
        session.user.userType = token.userType
        session.user.timeoutInMinutes = token.timeoutInMinutes
        session.user.userStatus = token.userStatus
        session.expires = new Date(token.exp * 1000).toISOString()
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
})