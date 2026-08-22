import { Database, FileLock2, Gauge, Palette, ShieldCheck, Sparkles, Target, Wand2, Wrench } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { BackupManager } from '@/components/BackupManager'
import { StorageStatus } from '@/components/StorageStatus'
import { AiBridgeContainer } from '@/components/ai-bridge/AiBridgeContainer'
import { BalancerDevPanel } from '@/components/balancer/BalancerDevPanel'
import { DatabaseDebugger } from '@/components/DatabaseDebugger'
import { AppearanceSettings } from '@/components/settings/AppearanceSettings'
import { ModuleSettingsPanel } from '@/components/settings/ModuleSettingsPanel'
import { ProfileGoalForm } from '@/components/settings/ProfileGoalForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { clsx } from 'clsx'

const navItems = [
  { to: '/more/profile', label: 'Profile', icon: Target },
  { to: '/more/goals', label: 'Goals', icon: Gauge },
  { to: '/more/appearance', label: 'Appearance', icon: Palette },
  { to: '/more/modules', label: 'Modules', icon: ShieldCheck },
  { to: '/more/data', label: 'Data', icon: FileLock2 },
  { to: '/more/ai', label: 'AI', icon: Sparkles },
  { to: '/more/about', label: 'About', icon: Wand2 },
  ...(import.meta.env.DEV ? [{ to: '/more/developer', label: 'Developer', icon: Wrench }] : []),
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

export function MorePage() {
  const location = useLocation()
  const section = location.pathname.replace(/^\/more\//, '').split('/')[0] || 'profile'

  const contentMap = {
    profile: <ProfileGoalForm />,
    goals: <ProfileGoalForm />,
    appearance: <AppearanceSettings />,
    modules: <ModuleSettingsPanel />,
    data: (
      <div className="space-y-4">
        <StorageStatus />
        <BackupManager />
      </div>
    ),
    ai: <AiBridgeContainer />,
    about: <AboutCard />,
    developer: <DeveloperPanel />,
  } as const

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
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex min-w-max items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent/12 text-accent-text shadow-accent-glow' : 'text-ink-mid hover:bg-surface-2 hover:text-ink-hi',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-4">{contentMap[activeSection]}</div>
    </div>
  )
}

const APP_VERSION = '0.6.8'
