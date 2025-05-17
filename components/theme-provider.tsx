"use client"

import * as React from "react"

type Theme = "light" | "dark"

interface ThemeContextProps {
  theme?: Theme
  setTheme?: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextProps>({})

const useTheme = () => {
  return React.useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  attribute?: string
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, defaultTheme = "light", attribute = "class" }) => {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    root.setAttribute(attribute, theme)

    try {
      localStorage.setItem("theme", theme)
    } catch (e) {}
  }, [theme, attribute, mounted])

  React.useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("theme") as Theme | null
      if (storedTheme) {
        setTheme(storedTheme)
      } else {
        setTheme(defaultTheme)
      }
    } catch (e) {}
  }, [defaultTheme])

  const contextValue = React.useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export { ThemeProvider, useTheme }
