import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell, HeartPulse, MoonStar, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { type TrainingDayContext } from '@/types'

const TODAY = new Date().toISOString().slice(0, 10)
type QuickMode = Extract<TrainingDayContext['sportType'], 'strength' | 'mma' | 'cardio' | 'rest'>

const MODES: Array<{ key: QuickMode; label: string; icon: typeof Dumbbell }> = [
  { key: 'strength', label: 'Gym', icon: Dumbbell },
  { key: 'mma', label: 'MMA', icon: Trophy },
  { key: 'cardio', label: 'Cardio', icon: HeartPulse },
  { key: 'rest', label: 'Rest', icon: MoonStar },
]

const defaultContext = (mode: QuickMode): TrainingDayContext => ({
  id: `training-context-${TODAY}`,
  date: TODAY,
  sportType: mode,
  intensity: 'moderate',
  durationMinutes: mode === 'rest' ? 0 : 60,
  seasonPhase: 'offseason',
  createdAt: new Date().toISOString(),
})

export function DailyModeSelector() {
  const existing = useLiveQuery(() => db.trainingContext.where('date').equals(TODAY).first(), [TODAY])
  const [selected, setSelected] = useState<QuickMode>('strength')

  useEffect(() => {
    const sportType = existing?.sportType
    const current = sportType === 'strength' || sportType === 'mma' || sportType === 'cardio' || sportType === 'rest'
      ? sportType
      : 'strength'
    setSelected(current)
  }, [existing])

  const current = useMemo(() => existing ?? defaultContext(selected), [existing, selected])

  async function applyMode(mode: QuickMode) {
    const next = defaultContext(mode)
    await db.trainingContext.put(next)
    setSelected(mode)
  }

  return (
    <Card>
      <CardHeader icon={<Dumbbell />} title="Today’s training mode" />
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {MODES.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={selected === key ? 'tonal' : 'secondary'}
              onClick={() => void applyMode(key)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-surface-0 p-3 text-sm text-ink-mid">
          <div className="font-medium text-ink-hi">{current.sportType === 'rest' ? 'Rest day' : `Today: ${current.sportType}`}</div>
          <div className="mt-1 text-xs text-ink-mid">
            {current.durationMinutes} min · {current.intensity} intensity · {current.seasonPhase}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
