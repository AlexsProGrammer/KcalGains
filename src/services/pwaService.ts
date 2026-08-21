type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let initialized = false

export function initializePWAInstall(): () => void {
  if (typeof window === 'undefined' || initialized) return () => undefined
  initialized = true
  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
  }
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    deferredPrompt = null
    initialized = false
  }
}

export function isNativeInstallPromptAvailable(): boolean {
  return deferredPrompt !== null
}

export async function promptNativeInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  const prompt = deferredPrompt
  deferredPrompt = null
  await prompt.prompt()
  return (await prompt.userChoice).outcome === 'accepted'
}
