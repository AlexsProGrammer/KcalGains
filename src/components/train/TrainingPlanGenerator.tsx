import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarRange, Check, Pencil, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { db } from '@/db'
import { saveWorkoutLog } from '@/db/workoutRepository'
import { useSettings } from '@/hooks/useSettings'
import { useWorkoutLogger } from '@/hooks/useWorkoutLogger'
import { TrainingPlanSchema } from '@/schemas/trainingPlan.schema'
import type { TrainingDayContext, TrainingPlan, WorkoutLog } from '@/types'

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
} as const

const DAY_KEYS = Object.keys(DAY_LABELS) as Array<keyof typeof DAY_LABELS>

export function getDateForDayKey(weekStart: string, dayKey: keyof typeof DAY_LABELS): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  const base = new Date(year, (month ?? 1) - 1, day ?? 1)
  const offset = DAY_KEYS.indexOf(dayKey)
  if (offset < 0) return weekStart
  base.setDate(base.getDate() + offset)
  return base.toISOString().slice(0, 10)
}

export async function syncTrainingPlanContexts(plan: TrainingPlan) {
  const weekStart = plan.weekStart ?? getCurrentWeekStart()

  for (const day of plan.days) {
    const date = getDateForDayKey(weekStart, day.dayKey)
    const existing = await db.trainingContext.where('date').equals(date).first()
    const sportType = (day.trainingMode ?? 'rest') as TrainingDayContext['sportType']
    const intensity = (sportType === 'rest' ? 'low' : 'moderate') as TrainingDayContext['intensity']
    const seasonPhase = (sportType === 'rest' ? 'recovery' : 'offseason') as TrainingDayContext['seasonPhase']
    const nextContext: TrainingDayContext = {
      id: `training-context-${date}`,
      date,
      sportType,
      intensity,
      durationMinutes: sportType === 'rest' ? 0 : 60,
      seasonPhase,
      customMode: existing?.customMode,
      createdAt: new Date().toISOString(),
    }

    if (existing && existing.customMode) {
      await db.trainingContext.put({ ...existing, id: `training-context-${date}`, date })
      continue
    }

    await db.trainingContext.put(nextContext)
  }
}

function getCurrentWeekStart(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().slice(0, 10)
}

function createEmptyDay(dayKey: keyof typeof DAY_LABELS): TrainingPlan['days'][number] {
  return {
    id: `${dayKey}-${crypto.randomUUID()}`,
    dayKey,
    label: DAY_LABELS[dayKey],
    trainingMode: 'rest',
    notes: '',
    exercises: [],
  }
}

function createEmptyPlan(title = 'New training plan', repeatWeeks = 1): TrainingPlan {
  return TrainingPlanSchema.parse({
    id: crypto.randomUUID(),
    title,
    repeatWeeks,
    weekStart: getCurrentWeekStart(),
    completedDayIds: [],
    days: DAY_KEYS.map((key) => createEmptyDay(key)),
  })
}

function createDefaultPlan(kind: '3x' | '5x'): TrainingPlan {
  const modeMap: Record<string, string> = {
    monday: 'strength',
    tuesday: kind === '3x' ? 'rest' : 'hypertrophy',
    wednesday: kind === '3x' ? 'strength' : 'rest',
    thursday: kind === '3x' ? 'rest' : 'strength',
    friday: kind === '3x' ? 'strength' : 'hypertrophy',
    saturday: kind === '3x' ? 'rest' : 'cardio',
    sunday: kind === '3x' ? 'rest' : 'rest',
  }

  return TrainingPlanSchema.parse({
    id: crypto.randomUUID(),
    title: kind === '3x' ? '3x / week strength' : '5x / week strength',
    repeatWeeks: 4,
    weekStart: getCurrentWeekStart(),
    completedDayIds: [],
    days: DAY_KEYS.map((key) => ({
      id: `${kind}-${key}-${crypto.randomUUID()}`,
      dayKey: key,
      label: DAY_LABELS[key],
      trainingMode: modeMap[key] ?? 'rest',
      notes: modeMap[key] === 'rest' ? 'Recovery / easy movement' : 'Primary focus session',
      exercises: [],
    })),
  })
}

function normalizeTrainingPlan(plan: Partial<TrainingPlan> | null | undefined): TrainingPlan {
  if (!plan) {
    return createEmptyPlan('Training plan')
  }

  const legacyEntries = Array.isArray((plan as any).entries) ? ((plan as any).entries as any[]) : []
  const rawDays = Array.isArray(plan.days)
    ? plan.days
    : legacyEntries.length > 0
      ? legacyEntries.map((entry: any, index: number) => ({
          id: entry.id ?? `legacy-day-${index}`,
          dayKey: DAY_KEYS[index] ?? 'monday',
          label: entry.label ?? DAY_LABELS[DAY_KEYS[index] ?? 'monday'],
          trainingMode: entry.trainingMode ?? entry.sportType ?? 'rest',
          notes: entry.notes ?? '',
          exercises: Array.isArray(entry.exercises) ? entry.exercises : [],
        }))
      : DAY_KEYS.map((key) => createEmptyDay(key))

  const seenDayIds = new Set<string>()
  const days = rawDays.map((day: any, index: number) => {
    const fallbackDayKey = DAY_KEYS[index % DAY_KEYS.length] ?? 'monday'
    const safeDayKey = (day.dayKey ?? fallbackDayKey) as keyof typeof DAY_LABELS
    const baseId = typeof day.id === 'string' && day.id.trim() ? day.id : `${plan.id ?? 'plan'}-${safeDayKey}-${index}`
    const id = seenDayIds.has(baseId) ? `${baseId}-${crypto.randomUUID()}` : baseId
    seenDayIds.add(id)

    const seenExerciseIds = new Set<string>()
    const exercises = Array.isArray(day.exercises)
      ? day.exercises.map((exercise: any, exerciseIndex: number) => {
          const exerciseBaseId = typeof exercise.id === 'string' && exercise.id.trim() ? exercise.id : `${id}-exercise-${exerciseIndex}`
          const exerciseId = seenExerciseIds.has(exerciseBaseId) ? `${exerciseBaseId}-${crypto.randomUUID()}` : exerciseBaseId
          seenExerciseIds.add(exerciseId)

          const seenSetIds = new Set<string>()
          const sets = Array.isArray(exercise.sets)
            ? exercise.sets.map((set: any, setIndex: number) => {
                const setBaseId = typeof set.id === 'string' && set.id.trim() ? set.id : `${exerciseId}-set-${setIndex}`
                const setId = seenSetIds.has(setBaseId) ? `${setBaseId}-${crypto.randomUUID()}` : setBaseId
                seenSetIds.add(setId)
                return { ...set, id: setId }
              })
            : []

          return { ...exercise, id: exerciseId, sets }
        })
      : []

    return {
      ...day,
      id,
      dayKey: safeDayKey,
      label: day.label ?? DAY_LABELS[safeDayKey],
      trainingMode: day.trainingMode ?? 'rest',
      notes: day.notes ?? '',
      exercises,
    }
  })

  return TrainingPlanSchema.parse({
    id: plan.id ?? crypto.randomUUID(),
    title: plan.title ?? 'Training plan',
    repeatWeeks: Number(plan.repeatWeeks ?? 1),
    weekStart: plan.weekStart ?? getCurrentWeekStart(),
    completedDayIds: Array.isArray(plan.completedDayIds) ? plan.completedDayIds : [],
    days,
  })
}

export function TrainingPlanGenerator() {
  const { settings } = useSettings()
  const logger = useWorkoutLogger()
  const plans = useLiveQuery(async () => db.trainingPlans.toArray(), [], []) as TrainingPlan[]
  const exerciseLibrary = useLiveQuery(() => db.exerciseDefinitions.orderBy('name').toArray(), [], [])
  const todayContext = useLiveQuery(() => db.trainingContext.where('date').equals(new Date().toISOString().slice(0, 10)).first(), [], null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [draftPlan, setDraftPlan] = useState<TrainingPlan | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const defaultSeedRef = useRef(false)
  const wasEditingRef = useRef(false)

  const normalizedPlans = useMemo(() => (plans ?? []).map((plan) => normalizeTrainingPlan(plan as Partial<TrainingPlan>)), [plans])

  useEffect(() => {
    if (!draftPlan && normalizedPlans[0]) {
      setDraftPlan(normalizedPlans[0])
    }

    if (normalizedPlans.length === 0) {
      if (defaultSeedRef.current) return
      defaultSeedRef.current = true

      let cancelled = false
      void db.trainingPlans.count().then(async (count) => {
        if (cancelled || count > 0) return
        const defaults = [createDefaultPlan('3x'), createDefaultPlan('5x')]
        await db.trainingPlans.bulkPut(defaults)
        if (cancelled) return
        setSelectedPlanId(defaults[0].id)
        setDraftPlan(defaults[0])
      })

      return () => {
        cancelled = true
      }
    }

    if (!selectedPlanId || !normalizedPlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(normalizedPlans[0].id)
    }

    const current = normalizedPlans.find((plan) => plan.id === selectedPlanId) ?? normalizedPlans[0]
    if (current && (!draftPlan || draftPlan.id !== current.id)) {
      setDraftPlan(current)
    }
  }, [normalizedPlans, selectedPlanId, draftPlan])

  useEffect(() => {
    if (!draftPlan) return
    if (isEditing) {
      wasEditingRef.current = true
      return
    }

    if (wasEditingRef.current) {
      void savePlan(draftPlan)
    }
    wasEditingRef.current = false
  }, [isEditing, draftPlan])

  const selectedPlan = draftPlan ?? normalizedPlans[0] ?? null
  const activeDays = selectedPlan?.days ?? []

  const availableModes = useMemo(
    () => (settings.trainingModes ?? []).filter((mode) => (mode.sportType ?? '').toLowerCase() !== 'rest'),
    [settings.trainingModes],
  )

  function updatePlan(updater: (plan: TrainingPlan) => TrainingPlan) {
    if (!draftPlan) return
    setDraftPlan((current) => (current ? updater(current) : current))
  }

  function updateDay(dayId: string, updater: (day: TrainingPlan['days'][number]) => TrainingPlan['days'][number]) {
    updatePlan((plan) => ({ ...plan, days: plan.days.map((day) => (day.id === dayId ? updater(day) : day)) }))
  }

  async function savePlan(plan: TrainingPlan) {
    const parsed = TrainingPlanSchema.parse(plan)
    await db.trainingPlans.put(parsed)
    await syncTrainingPlanContexts(parsed)
    setDraftPlan(parsed)
    setMessage('Training profile saved.')
  }

  async function addNewPlan() {
    const next = createEmptyPlan(`Plan ${normalizedPlans.length + 1}`)
    setSelectedPlanId(next.id)
    setDraftPlan(next)
    await db.trainingPlans.put(next)
    setMessage('New manual training profile created.')
  }

  function addExerciseToDay(dayId: string, exerciseId: string) {
    if (!draftPlan || !exerciseId) return
    const exercise = exerciseLibrary.find((item) => item.id === exerciseId)
    if (!exercise) return

    updateDay(dayId, (day) => ({
      ...day,
      exercises: [
        ...day.exercises,
        {
          id: crypto.randomUUID(),
          exerciseId: exercise.id,
          name: exercise.name,
          notes: '',
          sets: [{ id: crypto.randomUUID(), reps: 0, weightKg: 0, rpe: 8, note: '' }],
        },
      ],
    }))
  }

  function removeExerciseFromDay(dayId: string, exerciseId: string) {
    updateDay(dayId, (day) => ({ ...day, exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId) }))
  }

  function updateExercise(dayId: string, exerciseId: string, updater: (exercise: TrainingPlan['days'][number]['exercises'][number]) => TrainingPlan['days'][number]['exercises'][number]) {
    updateDay(dayId, (day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise)),
    }))
  }

  function addSetToExercise(dayId: string, exerciseId: string) {
    updateExercise(dayId, exerciseId, (exercise) => ({ ...exercise, sets: [...exercise.sets, { id: crypto.randomUUID(), reps: 0, weightKg: 0, rpe: 8, note: '' }] }))
  }

  function updateSet(dayId: string, exerciseId: string, setId: string, updates: Partial<TrainingPlan['days'][number]['exercises'][number]['sets'][number]>) {
    updateExercise(dayId, exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...updates } : set)),
    }))
  }

  function removeSet(dayId: string, exerciseId: string, setId: string) {
    updateExercise(dayId, exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((set) => set.id !== setId),
    }))
  }

  async function duplicatePlan() {
    if (!draftPlan) return
    const duplicate = normalizeTrainingPlan({
      ...draftPlan,
      id: crypto.randomUUID(),
      title: `${draftPlan.title} copy`,
      completedDayIds: [],
    })
    setSelectedPlanId(duplicate.id)
    setDraftPlan(duplicate)
    await db.trainingPlans.put(duplicate)
    setMessage('Training profile duplicated.')
  }

  async function removePlan(planId: string) {
    if (!planId) return
    await db.trainingPlans.delete(planId)
    setSelectedPlanId('')
    setDraftPlan(null)
    setMessage('Training profile deleted.')
  }

  async function toggleDayCompletion(dayId: string) {
    if (!draftPlan) return
    const isCompleted = draftPlan.completedDayIds.includes(dayId)
    const completedDayIds = isCompleted ? draftPlan.completedDayIds.filter((id) => id !== dayId) : [...draftPlan.completedDayIds, dayId]
    const next = { ...draftPlan, completedDayIds }
    setDraftPlan(next)
    await db.trainingPlans.put(next)
    setMessage(`${isCompleted ? 'Day unchecked.' : 'Day marked complete.'}`)
  }

  function resetPlanCompletion() {
    if (!draftPlan) return
    const next = { ...draftPlan, completedDayIds: [] }
    setDraftPlan(next)
    void db.trainingPlans.put(next)
    setMessage('Profile reset. All day checkmarks were cleared.')
  }

  async function saveCurrentPlan() {
    if (!draftPlan) return
    await savePlan(draftPlan)
  }

  function buildWorkoutExercisesFromDay(day: TrainingPlan['days'][number]) {
    return day.exercises.map((exercise) => ({
      exerciseId: `${day.id}-${exercise.id}`,
      exerciseName: exercise.name,
      notes: exercise.notes,
      sets: exercise.sets.map((set, index) => ({
        setId: `${day.id}-${exercise.id}-${set.id}`,
        setNumber: index + 1,
        type: 'normal' as const,
        weightKg: Number(set.weightKg || 0),
        reps: Number(set.reps || 0),
        rpe: set.rpe,
        isCompleted: false,
      })),
    }))
  }

  function loadDayIntoWorkoutLogger(day: TrainingPlan['days'][number]) {
    const nextExercises = buildWorkoutExercisesFromDay(day)
    const nextWorkout = logger.appendExercises(nextExercises)
    const finalWorkout = {
      ...nextWorkout,
      title: `${day.label} · ${draftPlan?.title ?? 'Training plan'}`,
    }
    logger.updateWorkout(finalWorkout)
    setSelectedDayId(day.id)
    setMessage(`${day.label} added to the current workout.`)
  }

  async function finishDayWorkoutLogger(day: TrainingPlan['days'][number]) {
    if (day.exercises.length === 0) {
      setMessage(`${day.label} has no exercises to log.`)
      return
    }

    const nextExercises = buildWorkoutExercisesFromDay(day)
    const finalWorkout: WorkoutLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      startTime: new Date(),
      endTime: new Date(),
      title: `${day.label} · ${draftPlan?.title ?? 'Training plan'}`,
      exercises: nextExercises,
    }

    await saveWorkoutLog(finalWorkout)
    setSelectedDayId(day.id)
    setMessage(`${day.label} was saved as a recent workout.`)
  }

  async function setDayAsToday(day: TrainingPlan['days'][number]) {
    const today = new Date().toISOString().slice(0, 10)
    await db.trainingContext.put({
      id: `training-context-${today}`,
      date: today,
      sportType: day.trainingMode,
      intensity: day.trainingMode === 'rest' ? 'low' : 'moderate',
      durationMinutes: day.trainingMode === 'rest' ? 0 : 60,
      seasonPhase: day.trainingMode === 'rest' ? 'recovery' : 'offseason',
      createdAt: new Date().toISOString(),
    })
    setMessage(`${day.label} is now the active training mode for today.`)
  }

  return (
    <Card>
      <CardHeader icon={<CalendarRange />} title="Manual training profiles" />
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SelectInput value={selectedPlan?.id ?? ''} onChange={(event) => setSelectedPlanId(event.target.value)} className="max-w-xs">
              {(normalizedPlans ?? []).map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.title}</option>
              ))}
            </SelectInput>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={isEditing ? 'tonal' : 'secondary'}
              className={isEditing ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/20' : ''}
              onClick={() => setIsEditing((value) => !value)}
              aria-pressed={isEditing}
            >
              <Pencil className="mr-2 h-4 w-4" />Edit mode
            </Button>
            <Button type="button" variant="secondary" onClick={() => void addNewPlan()}>
              <Plus className="mr-2 h-4 w-4" />New profile
            </Button>
          </div>
        </div>

        {selectedPlan ? (
          <div className="space-y-4">
            {isEditing ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-0 p-3">
                <TextInput value={selectedPlan.title} onChange={(event) => updatePlan((plan) => ({ ...plan, title: event.target.value }))} className="max-w-md" placeholder="Training profile name" />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={resetPlanCompletion}>
                    <RotateCcw className="mr-2 h-4 w-4" />Reset
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => void duplicatePlan()}>
                    <Plus className="mr-2 h-4 w-4" />Duplicate
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => void saveCurrentPlan()}>
                    <Save className="mr-2 h-4 w-4" />Save
                  </Button>
                  <Button type="button" variant="danger" onClick={() => void removePlan(selectedPlan.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />Delete
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Repeat weeks">
                <SelectInput value={String(selectedPlan.repeatWeeks)} onChange={(event) => updatePlan((plan) => ({ ...plan, repeatWeeks: Number(event.target.value) }))} disabled={!isEditing}>
                  <option value="1">1 week</option>
                  <option value="2">2 weeks</option>
                  <option value="3">3 weeks</option>
                  <option value="4">4 weeks</option>
                  <option value="999">Infinite</option>
                </SelectInput>
              </Field>
              <Field label="Week start">
                <TextInput type="date" value={selectedPlan.weekStart ?? getCurrentWeekStart()} onChange={(event) => updatePlan((plan) => ({ ...plan, weekStart: event.target.value }))} readOnly={!isEditing} />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeDays.map((day) => {
                const isSelected = selectedDayId === day.id
                const isComplete = selectedPlan.completedDayIds.includes(day.id)

                return (
                  <div key={day.id} className={`rounded-xl border p-3 ${isSelected ? 'border-accent/60 bg-accent/5' : 'border-line bg-surface-0'} ${isEditing ? 'space-y-3' : 'space-y-2'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-ink-hi">{day.label}</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDayId(day.id)
                            void setDayAsToday(day)
                          }}
                          className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${selectedDayId === day.id ? 'border-accent bg-accent/10 text-accent-text' : 'border-line text-ink-mid'}`}
                        >
                          Today
                        </button>
                        <button type="button" onClick={() => void toggleDayCompletion(day.id)} className={`flex h-7 w-7 items-center justify-center rounded-full border ${isComplete ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-line text-ink-low'}`} aria-label={isComplete ? `Mark ${day.label} as incomplete` : `Mark ${day.label} as complete`}>
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {isEditing ? (
                        <>
                          <SelectInput value={day.trainingMode} onChange={(event) => updateDay(day.id, (current) => ({ ...current, trainingMode: event.target.value }))}>
                            <option value="rest">Rest</option>
                            {availableModes.map((mode) => (
                              <option key={mode.id} value={mode.sportType}>{mode.label}</option>
                            ))}
                          </SelectInput>
                          <TextInput value={day.notes ?? ''} onChange={(event) => updateDay(day.id, (current) => ({ ...current, notes: event.target.value }))} placeholder="Session notes" />
                        </>
                      ) : (
                        <>
                          <div className="rounded-md bg-surface-1 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-mid">{day.trainingMode === 'rest' ? 'Rest' : day.trainingMode}</div>
                          <div className="text-[11px] text-ink-mid">{day.notes || 'No session notes'}</div>
                        </>
                      )}
                    </div>

                    {day.exercises.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-[minmax(0,2.4fr)_0.9fr_0.9fr_0.9fr_0.8fr] gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-low">
                          <span>Exercise</span>
                          <span>Set</span>
                          <span>Reps</span>
                          <span>Kg</span>
                          <span>RPE</span>
                        </div>

                        {day.exercises.map((exercise) => (
                          <div key={`${day.id}-${exercise.id}`} className={`rounded-lg border border-line bg-surface-1 p-2 ${isEditing ? 'space-y-2' : 'space-y-1'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className={isEditing ? 'text-sm font-medium text-ink-hi' : 'text-[12px] font-medium text-ink-hi'}>{exercise.name}</span>
                              {isEditing ? (
                                <button type="button" onClick={() => removeExerciseFromDay(day.id, exercise.id)} className="text-ink-low hover:text-rose-300" aria-label={`Remove ${exercise.name}`}>
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>

                            {exercise.notes || isEditing ? (
                              <TextInput value={exercise.notes ?? ''} onChange={(event) => updateExercise(day.id, exercise.id, (current) => ({ ...current, notes: event.target.value }))} placeholder="Exercise notes" className="h-7 px-2 text-[10px]" readOnly={!isEditing} />
                            ) : null}

                            {exercise.sets.length === 0 ? (
                              <div className="text-[11px] text-ink-mid">No sets yet.</div>
                            ) : (
                              <div className="space-y-2">
                                {exercise.sets.map((set, index) => (
                                  <div key={`${day.id}-${exercise.id}-${set.id}`} className="grid grid-cols-[minmax(0,2.4fr)_0.9fr_0.9fr_0.9fr_0.8fr] gap-2">
                                    <div className="text-[10px] text-ink-mid">{isEditing ? exercise.name : `${index + 1}`}</div>
                                    <div className="text-[10px] text-ink-mid">{index + 1}</div>
                                    {isEditing ? (
                                      <>
                                        <TextInput type="number" min="0" step="1" value={set.reps} onChange={(event) => updateSet(day.id, exercise.id, set.id, { reps: Number(event.target.value || 0) })} className="h-7 px-2 text-[10px]" />
                                        <TextInput type="number" min="0" step="0.5" value={set.weightKg} onChange={(event) => updateSet(day.id, exercise.id, set.id, { weightKg: Number(event.target.value || 0) })} className="h-7 px-2 text-[10px]" />
                                        <TextInput type="number" min="1" max="10" step="1" value={set.rpe ?? 8} onChange={(event) => updateSet(day.id, exercise.id, set.id, { rpe: Number(event.target.value || 8) })} className="h-7 px-2 text-[10px]" />
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-[10px] text-ink-mid">{set.reps ?? 0}</div>
                                        <div className="text-[10px] text-ink-mid">{set.weightKg ?? 0}</div>
                                        <div className="text-[10px] text-ink-mid">{set.rpe ?? 8}</div>
                                      </>
                                    )}
                                    {isEditing ? (
                                      <button type="button" onClick={() => removeSet(day.id, exercise.id, set.id)} className="text-ink-low hover:text-rose-300" aria-label="Remove set">
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}

                            {isEditing ? (
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="secondary" size="sm" onClick={() => addSetToExercise(day.id, exercise.id)}>Add set</Button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {isEditing ? (
                      <div className="space-y-2">
                        <SelectInput
                          value=""
                          onChange={(event) => {
                            const selected = event.target.value
                            if (selected) {
                              addExerciseToDay(day.id, selected)
                              event.target.value = ''
                            }
                          }}
                        >
                          <option value="">Add exercise...</option>
                          {(exerciseLibrary ?? []).map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                          ))}
                        </SelectInput>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => loadDayIntoWorkoutLogger(day)}>
                            Use in logger
                          </Button>
                          <Button type="button" variant="primary" size="sm" onClick={() => void finishDayWorkoutLogger(day)}>
                            Finish workout
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => loadDayIntoWorkoutLogger(day)}>
                          Add to logger
                        </Button>
                        <Button type="button" variant="primary" size="sm" onClick={() => void finishDayWorkoutLogger(day)}>
                          Finish workout
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
            No training profile yet. Create one to build a manual weekly schedule.
          </div>
        )}

        {message ? <Alert variant="success">{message}</Alert> : null}
      </CardContent>
    </Card>
  )
}
