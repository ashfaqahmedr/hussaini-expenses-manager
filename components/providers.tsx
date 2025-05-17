// components/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import { StoreProvider } from "@/store/StoreProvider"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <StoreProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </StoreProvider>
    </SessionProvider>
  )
}