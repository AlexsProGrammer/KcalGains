import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { calculateWeightEMA } from '@/utils/emaCalculations'

export function useWeightTrends(smoothingFactor = 0.1) {
  const entries = useLiveQuery(() => db.weightLogs.orderBy('date').toArray(), [smoothingFactor], [])
  return { entries, trend: calculateWeightEMA(entries, smoothingFactor) }
}
