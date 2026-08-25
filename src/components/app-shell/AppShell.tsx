import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, UtensilsCrossed, Dumbbell, TrendingUp, MoreHorizontal, Plus, Github } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import { OnboardingPage } from '@/components/onboarding/OnboardingPage'
import { clsx } from 'clsx'
import { QuickActionSheet } from '@/components/app-shell/QuickActionSheet'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { ReloadPrompt } from '@/components/pwa/ReloadPrompt'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSettings } from '@/hooks/useSettings'
import { useStoragePersistence } from '@/hooks/useStoragePersistence'
import { useT } from '@/i18n'
import { db } from '@/db'

const ONBOARDING_STATE_KEY = 'kcalgains.onboardingState'

const navItems = [
  { to: '/today', key: 'today', icon: Home },
  { to: '/nutrition', key: 'nutrition', icon: UtensilsCrossed },
  { to: '/train', key: 'train', icon: Dumbbell },
  { to: '/progress', key: 'progress', icon: TrendingUp },
  { to: '/more', key: 'more', icon: MoreHorizontal },
]

function readPersistedOnboardingState() {
  if (typeof window === 'undefined') return null

  const localValue = window.localStorage.getItem(ONBOARDING_STATE_KEY)
  const sessionValue = window.sessionStorage.getItem(ONBOARDING_STATE_KEY)

  return localValue ?? sessionValue ?? null
}

export function AppShell() {
  const location = useLocation()
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const { settings, isLoading } = useSettings()
  const { isPersisted } = useStoragePersistence()
  const { t } = useT()
  const reduceMotion = useReducedMotion()
  const today = new Date().toISOString().slice(0, 10)
  const todayTrainingContext = useLiveQuery(() => db.trainingContext.where('date').equals(today).first(), [today], null)
  const trainingModeLabel = useMemo(() => {
    const sportType = todayTrainingContext?.sportType ?? 'rest'
    const preset = settings.trainingModes.find((mode) => mode.sportType === sportType)
    return preset?.label ?? (sportType === 'rest' ? 'Rest day' : sportType)
  }, [settings.trainingModes, todayTrainingContext])

  const forceOnboarding =
    typeof window !== 'undefined' &&
    (window.localStorage.getItem('kcalgains.forceOnboarding') === 'true' || window.sessionStorage.getItem('kcalgains.forceOnboarding') === 'true')

  const persistedOnboardingState = readPersistedOnboardingState()
  const onboardingHandled =
    settings.onboardingCompleted ||
    settings.onboardingDismissed ||
    persistedOnboardingState === 'completed' ||
    persistedOnboardingState === 'dismissed'

  useEffect(() => {
    if (forceOnboarding) {
      const timeout = window.setTimeout(() => {
        window.localStorage.removeItem('kcalgains.forceOnboarding')
        window.sessionStorage.removeItem('kcalgains.forceOnboarding')
      }, 750)

      return () => window.clearTimeout(timeout)
    }

    return undefined
  }, [forceOnboarding])

  const shouldShowOnboarding =
    !isLoading &&
    !location.pathname.startsWith('/onboarding') &&
    !onboardingHandled &&
    (forceOnboarding || (!settings.onboardingDismissed && !settings.onboardingCompleted && persistedOnboardingState !== 'dismissed' && persistedOnboardingState !== 'completed'))

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  const currentTitle = useMemo(() => {
    const match = navItems.find((item) => item.to === location.pathname)
    if (match) return t.nav[match.key as keyof typeof t.nav]
    if (location.pathname.startsWith('/more')) return t.nav.more
    if (location.pathname === '/onboarding') return t.nav.onboarding
    return t.nav.today
  }, [location.pathname, t])

  return (
    <div className="min-h-screen bg-surface-0 text-ink-hi">
      <div>
        <div className="flex min-h-screen">
          <aside className="hidden w-72 shrink-0 border-r border-line bg-surface-1/70 backdrop-blur-xl lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:flex-col lg:pt-6">
            <div className="px-5 pb-6">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-text">{t.appName}</div>
              <h1 className="text-xl font-semibold text-ink-hi">{t.shell.performanceTracker}</h1>
            </div>

            <nav className="space-y-2 px-3">
              {navItems.map(({ to, key, icon: Icon }) => (
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
                  {t.nav[key as keyof typeof t.nav]}
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 lg:ml-72">
            <header className="sticky top-0 z-20 border-b border-line bg-surface-0/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">{t.shell.overview}</p>
                  <h2 className="text-lg font-semibold text-ink-hi">{currentTitle}</h2>
                </div>

                <div className="flex items-center gap-3">
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

                  <div className="rounded-xl border border-line bg-surface-1 px-3 py-2 text-center shadow-sm">
                    <div className="text-[9px] uppercase tracking-[0.16em] text-ink-low">{t.common.today}</div>
                    <div className="mt-1 text-sm font-medium text-ink-hi">{trainingModeLabel}</div>
                  </div>
                </div>
              </div>
            </header>

            <main className="mx-auto min-w-0 max-w-7xl px-3 pb-28 pt-3 sm:px-6 lg:px-8 lg:pb-10 lg:pt-4">
              {isPersisted === false ? (
                <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Browser storage is not persistent yet. Your local data may not survive browser restarts until storage persistence is enabled.
                </div>
              ) : null}

              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                  className="min-h-[calc(100vh-8rem)] min-w-0"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        {!shouldShowOnboarding ? (
          <>
            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-1/95 p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-xl lg:hidden">
              <div className="grid grid-cols-5 gap-1.5">
                {navItems.map(({ to, key, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      clsx(
                        'flex touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors',
                        isActive ? 'bg-accent/12 text-accent-text' : 'text-ink-mid',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {t.nav[key as keyof typeof t.nav]}
                  </NavLink>
                ))}
              </div>
            </nav>

            <Button
              className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 h-14 w-14 rounded-full shadow-accent-glow lg:bottom-6"
              onClick={() => setQuickActionOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </>
        ) : null}
      </div>

      {shouldShowOnboarding ? <OnboardingPage modalMode /> : null}

      <QuickActionSheet open={quickActionOpen} onClose={() => setQuickActionOpen(false)} />
      <ReloadPrompt />
      <InstallBanner />
      <OfflineIndicator />
    </div>
  )
}
