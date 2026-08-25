import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { computeAdaptiveTDEE } from '@/services/tdeeEngineService'
import { useWeightTrends } from '@/hooks/useWeightTrends'

export function TdeeStatsCard() {
  const { entries } = useWeightTrends()
  const logs = useLiveQuery(() => db.dailyLogs.toArray(), [], [])
  const result = computeAdaptiveTDEE(entries, logs)
  const calibrated = result.confidenceScore >= 1
  return <Card><CardHeader title="Adaptive TDEE" /><CardContent>{result.confidenceScore === 0 ? <><p className="text-lg font-semibold text-slate-200">Waiting for data</p><p className="mt-2 text-sm text-slate-500">Track weight and daily calories to calculate your personal TDEE.</p></> : <><p className="text-3xl font-bold text-slate-100">{result.calculatedTdee.toFixed(0)} <span className="text-sm font-normal text-slate-500">kcal/day</span></p><p className={`mt-2 text-sm ${result.trendDirection === 'falling' ? 'text-warning' : 'text-accent-text'}`}>{result.weeklyWeightDeltaKg >= 0 ? '+' : ''}{result.weeklyWeightDeltaKg.toFixed(2)} kg/week · {result.trendDirection}</p></>}<span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs ${calibrated ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{calibrated ? 'Calibrated' : `Calibrating: ${(result.confidenceScore * 14).toFixed(0)}/14 days`}</span></CardContent></Card>
}
