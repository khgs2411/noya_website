import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const storedTheme = localStorage.getItem('noya-theme')
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : getSystemTheme()
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function syncSystemTheme() {
      if (!localStorage.getItem('noya-theme')) {
        setTheme(media.matches ? 'dark' : 'light')
      }
    }

    media.addEventListener('change', syncSystemTheme)
    return () => media.removeEventListener('change', syncSystemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme = current === 'dark' ? 'light' : 'dark'
      localStorage.setItem('noya-theme', nextTheme)
      return nextTheme
    })
  }

  return { theme, toggleTheme }
}
