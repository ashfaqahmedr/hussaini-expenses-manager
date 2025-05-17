"use client"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => setTheme && setTheme(theme === "light" ? "dark" : "light")}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Conditional text for Light/Dark */}
      <span className="text-gray-700 dark:text-gray-300">{theme === "light" ? "Dark" : "Light"}</span>
    </div>
  )
}

export default ThemeToggle
