import { Activity, Scale } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useT } from '@/i18n'
import { useBodyMetrics } from '@/hooks/useBodyMetrics'

export function BmiCard() {
  const { t } = useT()
  const metrics = useBodyMetrics()

  return (
    <Card>
      <CardHeader icon={<Scale />} title={t.progress.bodyMetrics} />
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-slate-100">{metrics.bmi.toFixed(1)}</p>
            <p className="text-sm text-slate-400">{t.progress.bmi} · {metrics.bmiLabel}</p>
          </div>
          <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent-text">
            {t.progress.kcalPerDay.replace('{value}', metrics.recommendedIntake.toFixed(0))}
          </span>
        </div>

        <div className="grid gap-2 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300 sm:grid-cols-2">
          <div>
            <p className="text-slate-400">{t.progress.weight}</p>
            <p className="font-semibold text-slate-100">{metrics.weightKg.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-slate-400">{t.progress.idealRange}</p>
            <p className="font-semibold text-slate-100">{metrics.idealRange.minKg.toFixed(1)}–{metrics.idealRange.maxKg.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-slate-400">{t.progress.bmr}</p>
            <p className="font-semibold text-slate-100">{metrics.bmr.toFixed(0)} kcal</p>
          </div>
          <div>
            <p className="text-slate-400">{t.progress.tdee}</p>
            <p className="font-semibold text-slate-100">{metrics.tdee.toFixed(0)} kcal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Activity className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
          {t.progress.goal.replace('{goal}', metrics.profile.goal).replace('{activity}', metrics.profile.activityLevel)}
        </div>
      </CardContent>
    </Card>
  )
}
