"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { observer } from "mobx-react-lite"
import { useStore } from "@/store/StoreProvider"
import { Loader2 } from "lucide-react"

const NavigationLoader = observer(() => {
  const store = useStore()
  const pathname = usePathname()

  useEffect(() => {
    // Set navigating to true when pathname changes
    store.setNavigating(true)

    // Set navigating to false after a short delay
    const timer = setTimeout(() => {
      store.setNavigating(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname, store])

  if (!store.isNavigating) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background border rounded-md shadow-md p-6 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Navigating to {pathname}...</span>
      </div>
    </div>
  )
})

// Make sure to export as default
export default NavigationLoader
