import { Activity, Scale } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useBodyMetrics } from '@/hooks/useBodyMetrics'

export function BmiCard() {
  const metrics = useBodyMetrics()

  return (
    <Card>
      <CardHeader icon={<Scale />} title="Body metrics" />
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-slate-100">{metrics.bmi.toFixed(1)}</p>
            <p className="text-sm text-slate-400">BMI · {metrics.bmiLabel}</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
            {metrics.recommendedIntake.toFixed(0)} kcal/day
          </span>
        </div>

        <div className="grid gap-2 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300 sm:grid-cols-2">
          <div>
            <p className="text-slate-400">Weight</p>
            <p className="font-semibold text-slate-100">{metrics.weightKg.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-slate-400">Ideal range</p>
            <p className="font-semibold text-slate-100">{metrics.idealRange.minKg.toFixed(1)}–{metrics.idealRange.maxKg.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-slate-400">BMR</p>
            <p className="font-semibold text-slate-100">{metrics.bmr.toFixed(0)} kcal</p>
          </div>
          <div>
            <p className="text-slate-400">TDEE</p>
            <p className="font-semibold text-slate-100">{metrics.tdee.toFixed(0)} kcal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Activity className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          Goal: {metrics.profile.goal} · {metrics.profile.activityLevel}
        </div>
      </CardContent>
    </Card>
  )
}
