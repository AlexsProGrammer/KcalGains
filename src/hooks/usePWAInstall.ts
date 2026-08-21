import { useEffect, useState } from 'react'
import { initializePWAInstall, isNativeInstallPromptAvailable, promptNativeInstall } from '@/services/pwaService'
import { getPlatform, isStandalone, type Platform } from '@/utils/platformDetect'

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(isStandalone)
  const [platform] = useState<Platform>(getPlatform)

  useEffect(() => {
    const cleanup = initializePWAInstall()
    const updateInstallState = () => {
      setIsInstallable(isNativeInstallPromptAvailable())
      setIsInstalled(isStandalone())
    }
    updateInstallState()
    window.addEventListener('beforeinstallprompt', updateInstallState)
    window.addEventListener('appinstalled', updateInstallState)
    return () => {
      cleanup()
      window.removeEventListener('beforeinstallprompt', updateInstallState)
      window.removeEventListener('appinstalled', updateInstallState)
    }
  }, [])

  async function promptInstall(): Promise<void> {
    await promptNativeInstall()
    setIsInstallable(false)
    setIsInstalled(isStandalone())
  }

  return { isInstallable, isInstalled, platform, promptInstall }
}
