export type Platform = 'ios' | 'android' | 'desktop'

function userAgent(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent
}

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent()) || (userAgent().includes('Macintosh') && typeof navigator !== 'undefined' && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1)
}

export function isAndroid(): boolean {
  return /Android/i.test(userAgent())
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches === true || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function getPlatform(): Platform {
  if (isIOS()) return 'ios'
  if (isAndroid()) return 'android'
  return 'desktop'
}
