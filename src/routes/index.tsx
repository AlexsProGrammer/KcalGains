import { Component, Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/app-shell/AppShell'
import { MorePage } from '@/components/more/MorePage'
import { TodayPage } from '@/components/today/TodayPage'
import { NutritionPage } from '@/components/nutrition/NutritionPage'
import { TrainPage } from '@/components/train/TrainPage'
import { ProgressPage } from '@/components/progress/ProgressPage'
import { Button } from '@/components/ui/button'

const App = lazy(() => import('@/App'))

class RouteErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface-1 p-6 text-center">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">Something went wrong</p>
            <h2 className="text-xl font-semibold text-ink-hi">This page could not be loaded</h2>
            <p className="mt-2 text-sm text-ink-mid">Try going back or refreshing the page.</p>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function RoutePage({ element }: { element: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-[40vh] animate-pulse rounded-xl bg-surface-1" />}>
      <RouteErrorBoundary>{element}</RouteErrorBoundary>
    </Suspense>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<RoutePage element={<TodayPage />} />} />
        <Route path="/nutrition" element={<RoutePage element={<NutritionPage />} />} />
        <Route path="/train" element={<RoutePage element={<TrainPage />} />} />
        <Route path="/progress" element={<RoutePage element={<ProgressPage />} />} />
        <Route path="/more" element={<Navigate to="/more/profile" replace />} />
        <Route path="/more/:section" element={<RoutePage element={<MorePage />} />} />
        <Route path="/onboarding" element={<RoutePage element={<App />} />} />
      </Route>
    </Routes>
  )
}
