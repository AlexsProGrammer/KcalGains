import { Dumbbell, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useWorkoutLogger } from '@/hooks/useWorkoutLogger'
import { ExercisePickerModal } from '@/components/workout/ExercisePickerModal'
import { ExerciseSetTable } from '@/components/workout/ExerciseSetTable'
import { RestTimerOverlay } from '@/components/workout/RestTimerOverlay'
import { useT } from '@/i18n'
import type { ExerciseDefinition } from '@/types'

export function WorkoutLoggerCard() {
  const { t } = useT()
  const logger = useWorkoutLogger()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  async function finish() { await logger.finishWorkout(); setMessage(t.train.saved) }
  return <><Card><CardHeader icon={<Dumbbell />} title={t.train.workoutLogger} /><CardContent><div className="flex items-center justify-between gap-3"><input value={logger.workout.title} onChange={(event) => logger.updateWorkout({ title: event.target.value })} aria-label={t.train.titleLabel} placeholder={t.train.titleLabel} className="min-h-9 min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100" /><Button type="button" size="sm" onClick={() => setPickerOpen(true)}><Plus className="mr-2 h-4 w-4" />{t.train.exercise}</Button></div><div className="mt-4 space-y-5">{logger.workout.exercises.map((exercise) => <section key={exercise.exerciseId} className="rounded-md border border-slate-800 p-3"><div className="flex items-center justify-between"><h3 className="font-medium text-slate-100">{exercise.exerciseName}</h3><button type="button" onClick={() => logger.removeExercise(exercise.exerciseId)} className="text-slate-500 hover:text-rose-300" aria-label={t.train.remove.replace('{name}', exercise.exerciseName)}><Trash2 className="h-4 w-4" /></button></div><ExerciseSetTable exerciseId={exercise.exerciseId} sets={exercise.sets} onAdd={() => logger.addSet(exercise.exerciseId)} onUpdate={(setId, updates) => logger.updateSet(exercise.exerciseId, setId, updates)} onToggle={(setId) => logger.toggleSetCompleted(exercise.exerciseId, setId)} onRemove={(setId) => logger.removeSet(exercise.exerciseId, setId)} /></section>)}</div>{logger.workout.exercises.length > 0 ? <Button type="button" className="mt-5" onClick={() => void finish()}><Save className="mr-2 h-4 w-4" />{t.train.finishWorkout}</Button> : <p className="mt-4 text-sm text-slate-600">{t.train.emptyState}</p>}{message ? <Alert className="mt-4" variant="success">{message}</Alert> : null}</CardContent></Card><ExercisePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(exercise: ExerciseDefinition) => logger.addExercise(exercise.id, exercise.name)} /><RestTimerOverlay seconds={logger.restSeconds} /></>
}
