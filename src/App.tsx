import { Activity } from 'lucide-react'
import { BackupManager } from '@/components/BackupManager'
import { DatabaseDebugger } from '@/components/DatabaseDebugger'
import { StorageStatus } from '@/components/StorageStatus'
import { FoodManagement } from '@/components/food/FoodManagement'
import { BalancerContainer } from '@/components/balancer/BalancerContainer'
import { AiBridgeContainer } from '@/components/ai-bridge/AiBridgeContainer'
import { WorkoutLoggerCard } from '@/components/workout/WorkoutLoggerCard'
import { WeightTrendChart } from '@/components/analytics/WeightTrendChart'
import { TdeeStatsCard } from '@/components/analytics/TdeeStatsCard'
import { BmiCard } from '@/components/analytics/BmiCard'
import { WeightLoggerCard } from '@/components/analytics/WeightLoggerCard'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { DailyModeSelector } from '@/components/train/DailyModeSelector'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { ReloadPrompt } from '@/components/pwa/ReloadPrompt'
import { ViewModeToggle } from '@/components/history/ViewModeToggle'
import { WeightHistoryList } from '@/components/history/WeightHistoryList'
import { MealHistoryList } from '@/components/history/MealHistoryList'
import { WorkoutHistoryList } from '@/components/history/WorkoutHistoryList'
import { FoodHistoryList } from '@/components/history/FoodHistoryList'
import { MacroTrendChart } from '@/components/analytics/MacroTrendChart'
import { MealBreakdownChart } from '@/components/analytics/MealBreakdownChart'
import { AutoMealPlanner } from '@/components/planner/AutoMealPlanner'
import { useSettings } from '@/hooks/useSettings'
import type { ViewMode } from '@/types'

function App() {
  const { settings, setSetting } = useSettings()
  const viewMode: ViewMode = settings.defaultView

  const handleViewChange = async (next: ViewMode) => {
    await setSetting('defaultView', next)
  }
  return (
    <>
      <main className="min-h-screen bg-surface-0 px-5 py-10 text-ink-hi">
      <div className="container max-w-5xl">
        <header className="mb-10 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-overline uppercase text-accent-text">KcalGains</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your progress, kept local.</h1>
            <p className="mt-3 max-w-xl text-ink-mid">The offline-first fitness and nutrition workspace is ready for its data layer.</p>
          </div>
          <Activity className="mt-1 hidden h-8 w-8 text-accent-text sm:block" aria-hidden="true" />
        </header>

        <section className="mt-4 max-w-md">
          <StorageStatus />
        </section>

        <section className="mt-4 max-w-2xl">
          <DailyModeSelector />
        </section>

        <section className="mt-4">
          <SettingsPanel />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <WorkoutLoggerCard />
          <div className="space-y-4">
            <BmiCard />
            <WeightLoggerCard />
            <TdeeStatsCard />
            {viewMode === 'graph' ? <WeightTrendChart /> : <WeightHistoryList viewMode={viewMode} />}
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <MacroTrendChart />
          <MealBreakdownChart />
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink-hi">History &amp; Records</h2>
            <ViewModeToggle value={viewMode} onChange={handleViewChange} />
          </div>
          <div className="grid gap-4">
            <MealHistoryList viewMode={viewMode} />
            <WorkoutHistoryList viewMode={viewMode} />
            <FoodHistoryList viewMode={viewMode} />
          </div>
        </section>

        <section className="mt-4 max-w-2xl">
          <AutoMealPlanner />
        </section>

        <section className="mt-4 max-w-2xl">
          <FoodManagement />
        </section>

        <section className="mt-4 max-w-2xl">
          <BalancerContainer />
        </section>

        <section className="mt-4 max-w-2xl">
          <AiBridgeContainer />
        </section>

        <section className="mt-4 max-w-2xl">
          <BackupManager />
        </section>

        <section className="mt-4 max-w-2xl">
          <DatabaseDebugger />
        </section>
      </div>
    </main>
      <ReloadPrompt />
      <InstallBanner />
      <OfflineIndicator />
    </>
  )
}

export default App
