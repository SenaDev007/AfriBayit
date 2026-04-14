'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize theme from localStorage if available, otherwise default to 'system'
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      return savedTheme || 'system'
    }
    return 'system'
  })

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    // Initialize actualTheme based on saved theme or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme && savedTheme !== 'system') {
        return savedTheme
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  // Handle theme changes and save to localStorage
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    const root = window.document.documentElement

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setActualTheme(systemTheme)

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? 'dark' : 'light')
      }

      mediaQuery.addEventListener('change', handleSystemThemeChange)

      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      }
    } else {
      setActualTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
  }, [actualTheme])

  const value: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    actualTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
