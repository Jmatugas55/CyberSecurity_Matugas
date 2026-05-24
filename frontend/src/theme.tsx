import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

export type Theme = "light" | "dark"

interface ThemeCtx {
  theme: Theme
  isDark: boolean
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx | null>(null)

const STORAGE_KEY = "appTheme"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved === "light" || saved === "dark") return saved
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
      root.style.colorScheme = "dark"
    } else {
      root.classList.remove("dark")
      root.style.colorScheme = "light"
    }
    document.body.style.backgroundColor = theme === "dark" ? "#0b1220" : "#f3f4f6"
    document.body.style.color = theme === "dark" ? "#f9fafb" : "#111827"
  }, [theme])

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      isDark: theme === "dark",
      toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
      setTheme: (t: Theme) => setThemeState(t),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export const themeClass = (isDark: boolean, dark: string, light: string) => (isDark ? dark : light)
