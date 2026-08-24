import { AlertTriangle, Database, Dumbbell, FileLock2, Gauge, Palette, ShieldCheck, Sparkles, Target, Wand2, Wrench } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
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
import { clsx } from 'clsx'

const developerNavItem = { to: '/more/developer', label: 'Developer', icon: Wrench } as const

const navItems = [
  { to: '/more/profile', label: 'Profile', icon: Target },
  { to: '/more/goals', label: 'Goals', icon: Gauge },
  { to: '/more/training', label: 'Training', icon: Dumbbell },
  { to: '/more/appearance', label: 'Appearance', icon: Palette },
  { to: '/more/modules', label: 'Modules', icon: ShieldCheck },
  { to: '/more/data', label: 'Data', icon: FileLock2 },
  { to: '/more/ai', label: 'AI', icon: Sparkles },
  { to: '/more/about', label: 'About', icon: Wand2 },
  { to: '/more/danger', label: 'Danger', icon: AlertTriangle },
  developerNavItem,
] as const

function AboutCard() {
  return (
    <Card>
      <CardHeader icon={<Wand2 />} title="About KcalGains" />
      <CardContent className="space-y-4 text-sm text-ink-mid">
        <p>
          A local-first fitness and nutrition workspace built for daily tracking, macro planning, and offline reliability.
        </p>
        <div className="rounded-xl border border-line bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <span className="text-ink-low">App version</span>
            <strong className="text-ink-hi">{APP_VERSION}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-ink-low">Storage</span>
            <strong className="text-ink-hi">IndexedDB</strong>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={() => window.location.assign('/today')}>
          Back to today
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
  const handleReset = async () => {
    const confirmed = window.confirm('This permanently deletes all local app data, including IndexedDB records and browser storage. Continue?')
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
      window.alert('The reset could not complete. Please try again or clear site data in the browser settings.')
    }
  }

  return (
    <Card className="border-danger/30 bg-danger/5">
      <CardHeader icon={<AlertTriangle className="text-danger" />} title="Danger zone" />
      <CardContent className="space-y-4 text-sm text-ink-mid">
        <p>
          This removes all local nutrition, workout, profile, settings, and cache data for this website. The app will reload afterward.
        </p>
        <div className="rounded-xl border border-danger/30 bg-surface-1 p-4 text-ink-hi">
          <div className="font-medium text-danger">Reset all app data</div>
          <p className="mt-2 text-sm text-ink-mid">This cannot be undone.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="danger" onClick={() => void handleReset()}>
            Delete all local data and reset the app
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function MorePage() {
  const location = useLocation()
  const section = location.pathname.replace(/^\/more\//, '').split('/')[0] || 'profile'

  const contentMap: Record<string, React.ReactNode> = {
    profile: <div className="space-y-4"><ProfileGoalForm /><AllergyConstraintsForm /></div>,
    goals: <div className="space-y-4"><ProfileGoalForm /><AllergyConstraintsForm /></div>,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">More</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink-hi">Settings, sync and app tools</h2>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface-1/70 p-2">
        <nav className="flex gap-2 overflow-x-auto p-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isDanger = label === 'Danger'
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex min-w-max items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
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
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4">{contentMap[activeSection]}</div>
    </div>
  )
}

const APP_VERSION = '0.6.11'
