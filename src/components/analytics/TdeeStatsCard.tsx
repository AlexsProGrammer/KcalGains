import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { useT } from '@/i18n'
import { computeAdaptiveTDEE } from '@/services/tdeeEngineService'
import { useWeightTrends } from '@/hooks/useWeightTrends'

export function TdeeStatsCard() {
  const { t } = useT()
  const { entries } = useWeightTrends()
  const logs = useLiveQuery(() => db.dailyLogs.toArray(), [], [])
  const result = computeAdaptiveTDEE(entries, logs)
  const calibrated = result.confidenceScore >= 1
  return <Card><CardHeader title={t.progress.adaptiveTdee} /><CardContent>{result.confidenceScore === 0 ? <><p className="text-lg font-semibold text-slate-200">{t.progress.waitingForData}</p><p className="mt-2 text-sm text-slate-500">{t.progress.trackWeight}</p></> : <><p className="text-3xl font-bold text-slate-100">{result.calculatedTdee.toFixed(0)} <span className="text-sm font-normal text-slate-500">{t.progress.kcalPerDay.replace('{value}', '').trim()}</span></p><p className={`mt-2 text-sm ${result.trendDirection === 'falling' ? 'text-warning' : 'text-accent-text'}`}>{result.weeklyWeightDeltaKg >= 0 ? '+' : ''}{result.weeklyWeightDeltaKg.toFixed(2)} kg/week · {result.trendDirection}</p></>}<span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs ${calibrated ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{calibrated ? t.progress.calibrated : t.progress.calibrating.replace('{days}', (result.confidenceScore * 14).toFixed(0))}</span></CardContent></Card>
}