import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, Droplets, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { useSettings } from '@/hooks/useSettings'
import { createEmptyMicronutrientTotals, getMicronutrientProgress, MICRONUTRIENT_KEYS, mergeMicronutrientTotals, resolveMicronutrientTargets, type MicronutrientKey } from '@/services/micronutrientTargetService'
import type { Meal, Profile } from '@/types'

const labelMap: Record<MicronutrientKey, string> = {
  sodiumMg: 'Sodium',
  potassiumMg: 'Potassium',
  magnesiumMg: 'Magnesium',
  calciumMg: 'Calcium',
  zincMg: 'Zinc',
  ironMg: 'Iron',
  seleniumMcg: 'Selenium',
  vitaminDMcg: 'Vitamin D',
  vitaminB6Mg: 'Vitamin B6',
  vitaminB12Mcg: 'Vitamin B12',
  vitaminCMg: 'Vitamin C',
}

const unitMap: Record<MicronutrientKey, string> = {
  sodiumMg: 'mg',
  potassiumMg: 'mg',
  magnesiumMg: 'mg',
  calciumMg: 'mg',
  zincMg: 'mg',
  ironMg: 'mg',
  seleniumMcg: 'µg',
  vitaminDMcg: 'µg',
  vitaminB6Mg: 'mg',
  vitaminB12Mcg: 'µg',
  vitaminCMg: 'mg',
}

type MicronutrientRadarProps = {
  meals: Meal[]
}

export function MicronutrientRadar({ meals }: MicronutrientRadarProps) {
  const { settings } = useSettings()
  const profile = useLiveQuery(async () => {
    const stored = await db.profile.toCollection().first()
    return stored ?? null
  }, []) as Profile | null

  const totals = meals.reduce(
    (acc, meal) => mergeMicronutrientTotals(acc, meal.totalMicros ?? createEmptyMicronutrientTotals()),
    createEmptyMicronutrientTotals(),
  )

  const targets = resolveMicronutrientTargets(profile)
  const notable = MICRONUTRIENT_KEYS.filter((key) => targets[key] > 0).map((key) => ({
    key,
    label: labelMap[key],
    unit: unitMap[key],
    value: totals[key],
    target: targets[key],
    percent: getMicronutrientProgress(totals[key], targets[key]),
  })).sort((left, right) => right.percent - left.percent)

  const averageProgress = notable.length > 0 ? notable.reduce((sum, item) => sum + item.percent, 0) / notable.length : 0

  if (settings.micronutrientView === 'list') {
    return (
      <Card>
        <CardHeader icon={<Droplets />} title="Micronutrient overview" />
        <CardContent className="space-y-3">
          {notable.map((item) => (
            <div key={item.key} className="rounded-xl border border-line bg-surface-0 p-3">
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-ink-hi">{item.label}</span>
                <span className="num text-ink-mid">{item.value.toFixed(1)} / {item.target.toFixed(1)} {item.unit}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-low">
                <span>{Math.min(100, item.percent).toFixed(0)}% of target</span>
                <span>{item.percent >= 100 ? 'On target' : 'Below target'}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader icon={<Droplets />} title="Micronutrient radar" />
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-0 p-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-low">Daily target match</p>
            <p className="mt-1 text-xl font-semibold text-ink-hi">{averageProgress.toFixed(0)}%</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface-1 px-2 py-1 text-xs text-ink-mid">
            {averageProgress >= 80 ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
            {averageProgress >= 80 ? 'Strong coverage' : 'Needs a few gaps'}
          </div>
        </div>

        <div className="space-y-3">
          {notable.map((item) => (
            <div key={item.key} className="rounded-xl border border-line bg-surface-0 p-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-ink-hi">{item.label}</span>
                <span className="num text-ink-mid">{item.value.toFixed(1)} / {item.target.toFixed(1)} {item.unit}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300" style={{ width: `${Math.min(100, item.percent)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
