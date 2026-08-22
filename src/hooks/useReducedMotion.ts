import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'

export function useReducedMotion() {
  const { settings } = useSettings()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setPrefersReducedMotion(false)
      return
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    const update = () => setPrefersReducedMotion(media.matches)
    update()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }

    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  if (settings.reduceMotion === 'on') return true
  if (settings.reduceMotion === 'off') return false
  return prefersReducedMotion
}
