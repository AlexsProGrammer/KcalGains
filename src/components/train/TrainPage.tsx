import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Clock3, Dumbbell, Flame, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DailyModeSelector } from '@/components/train/DailyModeSelector'
import { TrainingPlanGenerator } from '@/components/train/TrainingPlanGenerator'
import { WorkoutLoggerCard } from '@/components/workout/WorkoutLoggerCard'
import { db } from '@/db'
import { WorkoutSchema } from '@/schemas/workout.schema'
import type { Workout } from '@/types'

function normalizeWorkoutSets(workout: Record<string, any>) {
  const directSets = Array.isArray(workout?.sets) ? workout.sets : []

  if (directSets.length > 0) {
    return directSets
  }

  if (!Array.isArray(workout?.exercises)) {
    return []
  }

  return workout.exercises.flatMap((exercise: any) => {
    if (!exercise || !Array.isArray(exercise.sets)) {
      return []
    }

    return exercise.sets.map((set: any) => ({
      weight: Number(set?.weight ?? set?.weightKg ?? 0),
      reps: Number(set?.reps ?? 0),
      rpe: set?.rpe,
    }))
  })
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

export function TrainPage() {
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ date: string; type: Workout['type']; durationMinutes: string } | null>(null)
  const recentWorkouts = useLiveQuery(async () => {
    const logs = await db.workouts.toArray()
    return logs
      .map((workout) => {
        const normalizedSets = normalizeWorkoutSets(workout as Record<string, any>)
        return {
          ...workout,
          sets: normalizedSets,
          title: workout.title ?? 'Workout',
          type: workout.type ?? 'strength',
          date: workout.date ?? new Date().toISOString().slice(0, 10),
          durationMinutes: Number(workout.durationMinutes ?? 0),
        } as Workout
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
  }, [], []) as Workout[]

  const summary = useMemo(() => {
    const totalSets = recentWorkouts.reduce((sum, workout) => sum + (Array.isArray(workout.sets) ? workout.sets.length : 0), 0)
    const totalVolume = recentWorkouts.reduce((sum, workout) =>
      sum + (Array.isArray(workout.sets) ? workout.sets.reduce((setTotal, set) => setTotal + Number(set.weight ?? 0) * Number(set.reps ?? 0), 0) : 0), 0)

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

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="min-w-0">
          <CardHeader icon={<Dumbbell className="h-3.5 w-3.5" />} title="Sessions" className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-lg font-semibold text-ink-hi num">{summary.sessions}</CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader icon={<Flame className="h-3.5 w-3.5" />} title="Volume" className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-lg font-semibold text-ink-hi num">{summary.totalVolume}</CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader icon={<Clock3 className="h-3.5 w-3.5" />} title="Sets" className="gap-1.5 px-3 pt-3 text-[9px] uppercase tracking-[0.12em] text-ink-low" />
          <CardContent className="px-3 pb-3 pt-1 text-lg font-semibold text-ink-hi num">{summary.totalSets}</CardContent>
        </Card>
      </div>

      <DailyModeSelector />
      <TrainingPlanGenerator />

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
              const isEditing = editingWorkoutId === workout.id
              const sets = Array.isArray(workout.sets) ? workout.sets.length : 0
              const volume = Array.isArray(workout.sets)
                ? workout.sets.reduce((sum, set) => sum + Number(set.weight ?? 0) * Number(set.reps ?? 0), 0)
                : 0

              return (
                <div key={workout.id} className="rounded-xl border border-line bg-surface-0 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink-hi">{workout.title}</p>
                      <p className="text-[11px] text-ink-mid">{formatDisplayDate(workout.date)}</p>
                    </div>
                    <span className="num rounded-full bg-accent/10 px-2 py-1 text-xs text-accent-text">{sets} sets</span>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 space-y-3 rounded-lg border border-line bg-surface-1 p-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
                          Date
                          <input
                            type="date"
                            value={editDraft?.date ?? workout.date}
                            onChange={(event) => setEditDraft((current) => current ? { ...current, date: event.target.value } : current)}
                            className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi"
                          />
                        </label>
                        <label className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
                          Type
                          <select
                            value={editDraft?.type ?? workout.type}
                            onChange={(event) => setEditDraft((current) => current ? { ...current, type: event.target.value as Workout['type'] } : current)}
                            className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi"
                          >
                            <option value="strength">strength</option>
                            <option value="cardio">cardio</option>
                            <option value="other">other</option>
                          </select>
                        </label>
                        <label className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
                          Duration
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editDraft?.durationMinutes ?? String(workout.durationMinutes ?? '')}
                            onChange={(event) => setEditDraft((current) => current ? { ...current, durationMinutes: event.target.value } : current)}
                            className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi"
                          />
                        </label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => {
                          setEditingWorkoutId(null)
                          setEditDraft(null)
                        }}>Cancel</Button>
                        <Button type="button" size="sm" onClick={async () => {
                          if (!editDraft) return
                          const next = WorkoutSchema.parse({
                            ...workout,
                            date: editDraft.date,
                            type: editDraft.type,
                            durationMinutes: editDraft.durationMinutes ? Number(editDraft.durationMinutes) : 0,
                          })
                          await db.workouts.put(next)
                          setEditingWorkoutId(null)
                          setEditDraft(null)
                        }}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-mid">
                      <div className="flex flex-wrap gap-3">
                        <span>{workout.type}</span>
                        <span>{volume} kg · reps</span>
                        <span>{workout.durationMinutes ?? 0} min</span>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => {
                          setEditingWorkoutId(workout.id)
                          setEditDraft({
                            date: workout.date,
                            type: workout.type,
                            durationMinutes: String(workout.durationMinutes ?? ''),
                          })
                        }}>Edit</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void db.workouts.delete(workout.id)}>Delete</Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
