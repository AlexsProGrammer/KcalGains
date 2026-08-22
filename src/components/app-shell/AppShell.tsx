import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, UtensilsCrossed, Dumbbell, TrendingUp, MoreHorizontal, Plus } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { clsx } from 'clsx'
import { QuickActionSheet } from '@/components/app-shell/QuickActionSheet'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { ReloadPrompt } from '@/components/pwa/ReloadPrompt'
import { useT } from '@/i18n'

const navItems = [
  { to: '/today', label: 'Today', icon: Home },
  { to: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { to: '/train', label: 'Train', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/more', label: 'More', icon: MoreHorizontal },
]

export function AppShell() {
  const location = useLocation()
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const { t } = useT()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  const currentTitle = useMemo(() => {
    const match = navItems.find((item) => item.to === location.pathname)
    if (match) return t.nav[match.to.replace('/', '') as keyof typeof t.nav] ?? match.label
    if (location.pathname.startsWith('/more')) return t.nav.more
    if (location.pathname === '/onboarding') return t.nav.onboarding
    return t.nav.today
  }, [location.pathname, t])

  return (
    <div className="min-h-screen bg-surface-0 text-ink-hi">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-line bg-surface-1/70 backdrop-blur-xl lg:flex lg:flex-col lg:pt-6">
          <div className="px-5 pb-6">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-text">{t.appName}</div>
            <h1 className="text-xl font-semibold text-ink-hi">{t.shell.performanceTracker}</h1>
          </div>

          <nav className="space-y-2 px-3">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-accent/12 text-accent-text shadow-accent-glow' : 'text-ink-mid hover:bg-surface-2 hover:text-ink-hi',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto p-3">
            <Button className="w-full justify-center" onClick={() => window.location.assign('/onboarding')}>
              <Plus className="h-4 w-4" />
              {t.shell.startSetup}
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-line bg-surface-0/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">{t.shell.overview}</p>
                <h2 className="text-lg font-semibold text-ink-hi">{currentTitle}</h2>
              </div>

              <Button variant="secondary" size="sm" onClick={() => window.location.assign('/onboarding')}>
                {t.shell.setup}
              </Button>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="min-h-[calc(100vh-8rem)]"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-1/95 p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'bg-accent/12 text-accent-text' : 'text-ink-mid',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <Button
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 h-14 w-14 rounded-full shadow-accent-glow lg:bottom-6"
        onClick={() => setQuickActionOpen(true)}
      >
        <Plus className="h-5 w-5" />
      </Button>

      <QuickActionSheet open={quickActionOpen} onClose={() => setQuickActionOpen(false)} />
      <ReloadPrompt />
      <InstallBanner />
      <OfflineIndicator />
    </div>
  )
}
