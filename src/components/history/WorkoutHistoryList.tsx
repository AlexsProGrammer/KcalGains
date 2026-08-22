import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { db } from '@/db'
import { ExerciseDefinitionSchema, WorkoutSchema } from '@/schemas/workout.schema'
import type { Workout, ExerciseDefinition } from '@/types'

type WorkoutHistoryListProps = {
  viewMode: 'graph' | 'list'
}

const EMPTY_FORM = { date: new Date().toISOString().slice(0, 10), type: 'strength', durationMinutes: '' }

export function WorkoutHistoryList({ viewMode }: WorkoutHistoryListProps) {
  const [draft, setDraft] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const workouts = useLiveQuery(() => db.workouts.orderBy('date').reverse().toArray(), [])
  const exerciseTypes = useLiveQuery(() => db.exerciseDefinitions.toArray(), [], [])

  const sortedWorkouts = useMemo(
    () => [...(workouts ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [workouts],
  )

  async function addWorkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const parsed = WorkoutSchema.parse({
        id: crypto.randomUUID(),
        date: draft.date,
        type: draft.type,
        durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : undefined,
        notes: undefined,
        sets: [],
      })

      await db.workouts.put(parsed)
      setDraft(EMPTY_FORM)
    } catch {
      setError('Enter a valid date and workout type.')
    }
  }

  async function updateWorkout(workout: Workout, patch: Partial<Workout>) {
    const next = WorkoutSchema.parse({ ...workout, ...patch })
    await db.workouts.put(next)
  }

  async function deleteWorkout(id: string) {
    await db.workouts.delete(id)
  }

  if (viewMode === 'graph') {
    return null
  }

  const workoutTypes = Array.from(new Set(['strength', 'cardio', 'flexibility', 'sports', 'rest']))

  return (
    <Card>
      <CardHeader title="Workout history" />
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => void addWorkout(event)}>
          <Field label="Date">
            <TextInput type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
          </Field>
          <Field label="Type">
            <SelectInput value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
              {workoutTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectInput>
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Add workout</Button>
          </div>
        </form>

        <Field label="Duration (minutes)">
          <TextInput type="number" min="0" step="1" value={draft.durationMinutes} onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: event.target.value }))} placeholder="30" />
        </Field>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="space-y-3">
          {sortedWorkouts.length === 0 ? <p className="text-sm text-slate-500">No workouts logged yet.</p> : null}
          {sortedWorkouts.map((workout) => (
            <div key={workout.id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <Field label="Date">
                  <TextInput type="date" defaultValue={workout.date} onBlur={(event) => {
                    const nextDate = event.target.value
                    if (!nextDate || nextDate === workout.date) return
                    void updateWorkout(workout, { date: nextDate })
                  }} />
                </Field>

                <Field label="Type">
                  <SelectInput defaultValue={workout.type} onBlur={(event) => {
                    void updateWorkout(workout, { type: event.target.value })
                  }}>
                    {workoutTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Duration (min)">
                  <TextInput type="number" min="0" step="1" defaultValue={workout.durationMinutes ? String(workout.durationMinutes) : ''} onBlur={(event) => {
                    const nextDuration = event.target.value ? Number(event.target.value) : undefined
                    void updateWorkout(workout, { durationMinutes: nextDuration })
                  }} />
                </Field>

                <div className="flex items-end">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => void deleteWorkout(workout.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
