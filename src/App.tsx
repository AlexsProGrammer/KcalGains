import { Activity, Database, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { DynamicTargetBanner } from '@/components/dashboard/DynamicTargetBanner'
import { WeightLoggerCard } from '@/components/analytics/WeightLoggerCard'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { ReloadPrompt } from '@/components/pwa/ReloadPrompt'
import { ViewModeToggle } from '@/components/history/ViewModeToggle'
import { WeightHistoryList } from '@/components/history/WeightHistoryList'
import { MealHistoryList } from '@/components/history/MealHistoryList'
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
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100">
      <div className="container max-w-5xl">
        <header className="mb-10 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">KcalGains</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your progress, kept local.</h1>
            <p className="mt-3 max-w-xl text-slate-400">The offline-first fitness and nutrition workspace is ready for its data layer.</p>
          </div>
          <Activity className="mt-1 hidden h-8 w-8 text-emerald-400 sm:block" aria-hidden="true" />
        </header>

        <Alert variant="success" title="Local workspace initialized">
          Your data will stay in this browser. No remote assets or tracking endpoints are configured.
        </Alert>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader icon={<Database />} title="Offline first" />
            <CardContent>IndexedDB will become the source of truth for your logs.</CardContent>
          </Card>
          <Card>
            <CardHeader icon={<ShieldCheck />} title="Private by design" />
            <CardContent>Fonts and application assets are bundled locally.</CardContent>
          </Card>
          <Card>
            <CardHeader title="Phase 1" />
            <CardContent><Button size="sm">Foundation ready</Button></CardContent>
          </Card>
        </section>

        <section className="mt-4 max-w-md">
          <StorageStatus />
        </section>

        <section className="mt-4 max-w-2xl">
          <DynamicTargetBanner />
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

        <section className="mt-4 max-w-2xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-100">History</h2>
            <ViewModeToggle value={viewMode} onChange={handleViewChange} />
          </div>
          <MealHistoryList viewMode={viewMode} />
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
