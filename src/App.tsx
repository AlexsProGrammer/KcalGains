import { Activity, Database, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BackupManager } from '@/components/BackupManager'
import { DatabaseDebugger } from '@/components/DatabaseDebugger'
import { StorageStatus } from '@/components/StorageStatus'
import { FoodManagement } from '@/components/food/FoodManagement'

function App() {
  return (
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
          <FoodManagement />
        </section>

        <section className="mt-4 max-w-2xl">
          <BackupManager />
        </section>

        <section className="mt-4 max-w-2xl">
          <DatabaseDebugger />
        </section>
      </div>
    </main>
  )
}

export default App
