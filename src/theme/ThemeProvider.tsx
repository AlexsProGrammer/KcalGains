import { useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { ACCENT_OPTIONS, DEFAULT_ACCENT } from '@/theme/accents'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()

  useEffect(() => {
    const accent = ACCENT_OPTIONS.some((entry) => entry.value === settings.accent) ? settings.accent : DEFAULT_ACCENT
    const root = document.documentElement

    root.dataset.accent = accent
    root.dataset.density = settings.density
    root.dataset.reduceMotion = settings.reduceMotion
    root.lang = settings.locale

    try {
      window.localStorage.setItem('kcalgains.accent', accent)
    } catch {
      // storage may be unavailable in private mode; keep the runtime value only.
    }

    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      themeMeta.setAttribute('content', '#0a0b0d')
    }
  }, [settings.accent, settings.density, settings.locale, settings.reduceMotion])

  useEffect(() => {
    const root = document.documentElement
    if (settings.reduceMotion === 'on') {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
  }, [settings.reduceMotion])

  return <>{children}</>
}
