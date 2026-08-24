import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Clock3, Dumbbell, Flame, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DailyModeSelector } from '@/components/train/DailyModeSelector'
import { TrainingPlanGenerator } from '@/components/train/TrainingPlanGenerator'
import { WorkoutLoggerCard } from '@/components/workout/WorkoutLoggerCard'
import { db } from '@/db'
import type { WorkoutLog } from '@/types'

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

export function TrainPage() {
  const recentWorkouts = useLiveQuery(async () => {
    const logs = await db.workouts.toArray()
    return logs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
  }, [], []) as WorkoutLog[]

  const summary = useMemo(() => {
    const totalSets = recentWorkouts.reduce((sum, workout) => sum + workout.exercises.reduce((exerciseTotal, exercise) => exerciseTotal + exercise.sets.length, 0), 0)
    const totalVolume = recentWorkouts.reduce((sum, workout) =>
      sum + workout.exercises.reduce((exerciseTotal, exercise) =>
        exerciseTotal + exercise.sets.reduce((setTotal, set) => setTotal + set.weightKg * set.reps, 0), 0), 0)

    return {
      totalSets,
      totalVolume,
      sessions: recentWorkouts.length,
    }
  }, [recentWorkouts])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">Train</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink-hi">Active session and recent volume</h2>
        </div>
      </div>

      <DailyModeSelector />
      <TrainingPlanGenerator />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader icon={<Dumbbell />} title="Sessions" />
          <CardContent className="text-2xl font-semibold text-ink-hi num">{summary.sessions}</CardContent>
        </Card>
        <Card>
          <CardHeader icon={<Flame />} title="Volume" />
          <CardContent className="text-2xl font-semibold text-ink-hi num">{summary.totalVolume}</CardContent>
        </Card>
        <Card>
          <CardHeader icon={<Clock3 />} title="Sets" />
          <CardContent className="text-2xl font-semibold text-ink-hi num">{summary.totalSets}</CardContent>
        </Card>
      </div>

      <WorkoutLoggerCard />

      <Card>
        <CardHeader icon={<TrendingUp />} title="Recent workouts" />
        <CardContent className="space-y-3">
          {recentWorkouts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
              No finished sessions yet. Complete your first workout to build a history.
            </div>
          ) : (
            recentWorkouts.map((workout) => {
              const sets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
              const volume = workout.exercises.reduce((sum, exercise) =>
                sum + exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + set.weightKg * set.reps, 0), 0)

              return (
                <div key={workout.id} className="rounded-xl border border-line bg-surface-0 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink-hi">{workout.title}</p>
                      <p className="text-[11px] text-ink-mid">{formatDisplayDate(workout.date)}</p>
                    </div>
                    <span className="num rounded-full bg-accent/10 px-2 py-1 text-xs text-accent-text">{sets} sets</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-mid">
                    <span>{workout.exercises.length} exercises</span>
                    <span>{volume} kg · reps</span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
