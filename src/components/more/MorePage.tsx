import { AlertTriangle, Database, Dumbbell, FileLock2, Palette, ShieldCheck, Sparkles, Target, Wand2, Wrench } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { Github } from 'lucide-react'
import { BackupManager } from '@/components/BackupManager'
import { StorageStatus } from '@/components/StorageStatus'
import { AiBridgeContainer } from '@/components/ai-bridge/AiBridgeContainer'
import { BalancerDevPanel } from '@/components/balancer/BalancerDevPanel'
import { DatabaseDebugger } from '@/components/DatabaseDebugger'
import { AppearanceSettings } from '@/components/settings/AppearanceSettings'
import { ModuleSettingsPanel } from '@/components/settings/ModuleSettingsPanel'
import { AllergyConstraintsForm } from '@/components/settings/AllergyConstraintsForm'
import { ProfileGoalForm } from '@/components/settings/ProfileGoalForm'
import { TrainingModeSettingsForm } from '@/components/settings/TrainingModeSettingsForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { clearOnboardingState } from '@/db/settingsRepository'
import { useT } from '@/i18n'
import { clsx } from 'clsx'

const developerNavItem = { to: '/more/developer', label: 'developer', icon: Wrench } as const

const navItems = [
  { to: '/more/profile', label: 'profile', icon: Target },
  { to: '/more/training', label: 'training', icon: Dumbbell },
  { to: '/more/appearance', label: 'appearance', icon: Palette },
  { to: '/more/modules', label: 'modules', icon: ShieldCheck },
  { to: '/more/data', label: 'data', icon: FileLock2 },
  { to: '/more/ai', label: 'ai', icon: Sparkles },
  { to: '/more/about', label: 'about', icon: Wand2 },
  { to: '/more/danger', label: 'danger', icon: AlertTriangle },
  developerNavItem,
] as const

function AboutCard() {
  const { t } = useT()
  return (
    <Card>
      <CardHeader icon={<Wand2 />} title={t.more.aboutTitle} />
      <CardContent className="space-y-4 text-sm text-ink-mid">
        <p>
          {t.more.aboutBody}
        </p>
        <div className="rounded-xl border border-line bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <span className="text-ink-low">{t.more.author}</span>
            <strong className="text-ink-hi">AlexsdeProgrammer</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-low">{t.more.github}</span>
            <div className="flex items-center gap-4">
              <a
              href="https://github.com/AlexsProgrammer/KcalGains"
              target="_blank"
              rel="noreferrer"
              className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:bg-white/10"
            >
              <Github size={20} />
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-low">{t.more.appVersion}</span>
            <strong className="text-ink-hi">{APP_VERSION}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-ink-low">{t.more.storageTech}</span>
            <strong className="text-ink-hi">IndexedDB</strong>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={() => window.location.assign('/today')}>
          {t.more.backToToday}
        </Button>
      </CardContent>
    </Card>
  )
}

function DeveloperPanel() {
  return (
    <div className="space-y-4">
      <DatabaseDebugger />
      <BalancerDevPanel />
    </div>
  )
}

function DangerZone() {
  const { t } = useT()
  const handleReset = async () => {
    const confirmed = window.confirm(t.more.resetConfirm)
    if (!confirmed) return

    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
      window.localStorage.setItem('kcalgains.forceOnboarding', 'true')
      window.sessionStorage.setItem('kcalgains.forceOnboarding', 'true')
      window.localStorage.setItem('kcalgains.onboardingState', 'pending')
      window.sessionStorage.setItem('kcalgains.onboardingState', 'pending')

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))
      }

      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      }

      db.close()
      await db.delete()

      if ('indexedDB' in window) {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase('KcalGains')
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error ?? new Error('IndexedDB delete failed'))
          request.onblocked = () => resolve()
        })
      }

      window.location.reload()
    } catch (error) {
      console.error('Reset failed', error)
      window.alert(t.more.resetFailed)
    }
  }

  return (
    <Card className="border-danger/30 bg-danger/5">
      <CardHeader icon={<AlertTriangle className="text-danger" />} title={t.more.dangerZone} />
      <CardContent className="space-y-4 text-sm text-ink-mid">
        <p>
          {t.more.dangerDesc}
        </p>
        <div className="rounded-xl border border-danger/30 bg-surface-1 p-4 text-ink-hi">
          <div className="font-medium text-danger">{t.more.resetAllData}</div>
          <p className="mt-2 text-sm text-ink-mid">{t.more.cannotUndo}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="danger" onClick={() => void handleReset()}>
            {t.more.deleteAllReset}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function MorePage() {
  const { t } = useT()
  const location = useLocation()
  const section = location.pathname.replace(/^\/more\//, '').split('/')[0] || 'profile'

  const contentMap: Record<string, React.ReactNode> = {
    profile: <div className="space-y-4"><ProfileGoalForm /><AllergyConstraintsForm /></div>,
    training: <TrainingModeSettingsForm />,
    appearance: <AppearanceSettings />,
    modules: <ModuleSettingsPanel />,
    data: (
      <div className="space-y-4">
        <StorageStatus />
        <BackupManager />
      </div>
    ),
    danger: <DangerZone />,
    ai: <AiBridgeContainer />,
    about: <AboutCard />,
    developer: <DeveloperPanel />,
  }

  const activeSection = section in contentMap ? section : 'profile'

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">More</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink-hi">{t.more.subtitle}</h2>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-surface-1/70 p-2">
        <nav className="flex min-w-0 flex-wrap gap-2 p-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isDanger = label === 'danger'
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isDanger
                      ? isActive
                        ? 'bg-danger/15 text-danger shadow-danger-glow border border-danger/30'
                        : 'border border-danger/20 text-danger hover:bg-danger/10 hover:text-danger'
                      : isActive
                        ? 'bg-accent/12 text-accent-text shadow-accent-glow'
                        : 'text-ink-mid hover:bg-surface-2 hover:text-ink-hi',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.more[label]}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="min-w-0 space-y-4">{contentMap[activeSection]}</div>
    </div>
  )
}

const APP_VERSION = '0.7.3'
