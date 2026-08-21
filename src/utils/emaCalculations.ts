import type { WeightEntry } from '@/types'

export type WeightTrendPoint = {
  date: string
  weightKg: number
  smoothedWeightKg: number
}

const dayMilliseconds = 24 * 60 * 60 * 1000

function dateValue(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

function dateString(value: number): string {
  return new Date(value).toISOString().slice(0, 10)
}

export function calculateWeightEMA(entries: WeightEntry[], smoothingFactor = 0.1): WeightTrendPoint[] {
  if (entries.length === 0) return []
  const alpha = Math.min(1, Math.max(0.01, smoothingFactor))
  const sorted = [...entries].sort((left, right) => dateValue(left.date) - dateValue(right.date))
  const points: Array<{ date: string; weightKg: number }> = []

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index]
    const next = sorted[index + 1]
    const currentTime = dateValue(current.date)
    const nextTime = dateValue(next.date)
    const gap = Math.round((nextTime - currentTime) / dayMilliseconds)
    for (let day = 0; day < gap; day += 1) {
      const ratio = gap === 0 ? 0 : day / gap
      points.push({ date: dateString(currentTime + day * dayMilliseconds), weightKg: current.weightKg + (next.weightKg - current.weightKg) * ratio })
    }
  }
  const last = sorted[sorted.length - 1]
  points.push({ date: last.date, weightKg: last.weightKg })

  let ema = points[0].weightKg
  return points.map((point, index) => {
    ema = index === 0 ? point.weightKg : alpha * point.weightKg + (1 - alpha) * ema
    return { ...point, smoothedWeightKg: ema }
  })
}
