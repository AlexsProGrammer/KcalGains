import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { db } from '@/db'
import { DEFAULT_TRAINING_MODES, TrainingModePresetSchema } from '@/schemas/settings.schema'
import { ExerciseDefinitionSchema } from '@/schemas/workout.schema'
import { useSettings } from '@/hooks/useSettings'
import { useT } from '@/i18n'
import type { ExerciseDefinition } from '@/types'

type TrainingModeDraft = {
  id: string
  label: string
  sportType: string
  description: string
  intensity: 'low' | 'moderate' | 'high'
  durationMinutes: number
  seasonPhase: 'offseason' | 'competition_prep' | 'competition' | 'recovery'
  caloriesDelta: number
  proteinDelta: number
  carbsDelta: number
  fatDelta: number
  sodiumMgDelta: number
  potassiumMgDelta: number
  hydrationMl: number
  notes: string
}

type ExerciseDraft = {
  id: string
  name: string
  category: ExerciseDefinition['category']
  defaultRestSeconds: number
}

const emptyMode: TrainingModeDraft = {
  id: '',
  label: '',
  sportType: 'strength',
  description: '',
  intensity: 'moderate',
  durationMinutes: 60,
  seasonPhase: 'offseason',
  caloriesDelta: 0,
  proteinDelta: 0,
  carbsDelta: 0,
  fatDelta: 0,
  sodiumMgDelta: 0,
  potassiumMgDelta: 0,
  hydrationMl: 0,
  notes: '',
}

const emptyExercise: ExerciseDraft = {
  id: '',
  name: '',
  category: 'chest',
  defaultRestSeconds: 60,
}

function sportLabel(t: ReturnType<typeof useT>['t'], value: string): string {
  const map: Record<string, string> = {
    strength: t.more.sportStrength,
    hypertrophy: t.more.sportHypertrophy,
    cardio: t.more.sportCardio,
    mma: t.more.sportMma,
    combat_sport: t.more.sportCombat,
    endurance: t.more.sportEndurance,
    rest: t.more.sportRest,
  }
  return map[value] ?? value
}

function intensityLabel(t: ReturnType<typeof useT>['t'], value: string): string {
  const map: Record<string, string> = {
    low: t.more.intensityLow,
    moderate: t.more.intensityModerate,
    high: t.more.intensityHigh,
  }
  return map[value] ?? value
}

function phaseLabel(t: ReturnType<typeof useT>['t'], value: string): string {
  const map: Record<string, string> = {
    offseason: t.more.phaseOffseason,
    competition_prep: t.more.phaseCompetitionPrep,
    competition: t.more.phaseCompetition,
    recovery: t.more.phaseRecovery,
  }
  return map[value] ?? value
}

function categoryLabel(t: ReturnType<typeof useT>['t'], value: string): string {
  const map: Record<string, string> = {
    chest: t.more.catChest,
    back: t.more.catBack,
    legs: t.more.catLegs,
    shoulders: t.more.catShoulders,
    arms: t.more.catArms,
    core: t.more.catCore,
    cardio: t.more.catCardio,
  }
  return map[value] ?? value
}

function TrainingModeModal({
  open,
  mode,
  onClose,
  onSave,
}: {
  open: boolean
  mode: TrainingModeDraft
  onClose: () => void
  onSave: (mode: TrainingModeDraft) => void
}) {
  const { t } = useT()
  const [draft, setDraft] = useState<TrainingModeDraft>(mode)

  useEffect(() => {
    if (open) setDraft(mode)
  }, [open, mode])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-surface-0/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-line bg-surface-1 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-accent-text">{t.more.trainingPreset}</p>
            <h3 className="mt-1 text-xl font-semibold text-ink-hi">{mode.id ? t.more.editPreset : t.more.addPreset}</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t.more.closeModeEditor}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Field label={t.more.name}>
            <TextInput value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Cycling heavy" />
          </Field>
          <Field label={t.more.type}>
            <SelectInput value={draft.sportType} onChange={(event) => setDraft((current) => ({ ...current, sportType: event.target.value }))}>
              {(['strength', 'hypertrophy', 'cardio', 'mma', 'combat_sport', 'endurance', 'rest'] as string[]).map((value) => (
                <option key={value} value={value}>{sportLabel(t, value)}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t.more.intensity}>
            <SelectInput value={draft.intensity} onChange={(event) => setDraft((current) => ({ ...current, intensity: event.target.value as TrainingModeDraft['intensity'] }))}>
              <option value="low">{t.more.intensityLow}</option>
              <option value="moderate">{t.more.intensityModerate}</option>
              <option value="high">{t.more.intensityHigh}</option>
            </SelectInput>
          </Field>
          <Field label={t.more.durationMin}>
            <TextInput type="number" min="0" step="5" value={draft.durationMinutes} onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: Number(event.target.value || 0) }))} />
          </Field>
          <Field label={t.more.caloriesDelta}>
            <TextInput type="number" step="5" value={draft.caloriesDelta} onChange={(event) => setDraft((current) => ({ ...current, caloriesDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label={t.more.carbsDelta}>
            <TextInput type="number" step="5" value={draft.carbsDelta} onChange={(event) => setDraft((current) => ({ ...current, carbsDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label={t.more.proteinDelta}>
            <TextInput type="number" step="5" value={draft.proteinDelta} onChange={(event) => setDraft((current) => ({ ...current, proteinDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label={t.more.hydration}>
            <TextInput type="number" step="50" value={draft.hydrationMl} onChange={(event) => setDraft((current) => ({ ...current, hydrationMl: Number(event.target.value || 0) }))} />
          </Field>
          <Field label={t.more.sodium}>
            <TextInput type="number" step="50" value={draft.sodiumMgDelta} onChange={(event) => setDraft((current) => ({ ...current, sodiumMgDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label={t.more.potassium}>
            <TextInput type="number" step="50" value={draft.potassiumMgDelta} onChange={(event) => setDraft((current) => ({ ...current, potassiumMgDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label={t.more.phase} className="md:col-span-2">
            <SelectInput value={draft.seasonPhase} onChange={(event) => setDraft((current) => ({ ...current, seasonPhase: event.target.value as TrainingModeDraft['seasonPhase'] }))}>
              {(['offseason', 'competition_prep', 'competition', 'recovery'] as string[]).map((value) => (
                <option key={value} value={value}>{phaseLabel(t, value)}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t.more.modeDescription} className="md:col-span-2">
            <TextInput value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder={t.more.modeDescriptionPlaceholder} />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>{t.more.cancel}</Button>
          <Button type="button" onClick={() => onSave(draft)}>{t.more.savePreset}</Button>
        </div>
      </div>
    </div>
  )
}

function ExerciseModal({
  open,
  exercise,
  onClose,
  onSave,
}: {
  open: boolean
  exercise: ExerciseDraft
  onClose: () => void
  onSave: (exercise: ExerciseDraft) => void
}) {
  const { t } = useT()
  const [draft, setDraft] = useState<ExerciseDraft>(exercise)

  useEffect(() => {
    if (open) setDraft(exercise)
  }, [open, exercise])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-surface-0/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface-1 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-accent-text">{t.more.workoutExercise}</p>
            <h3 className="mt-1 text-xl font-semibold text-ink-hi">{exercise.id ? t.more.editExercise : t.more.addExercise}</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t.more.closeAiPaste}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Field label={t.more.name} className="md:col-span-2">
            <TextInput value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Bench press" />
          </Field>
          <Field label={t.more.category}>
            <SelectInput value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as ExerciseDefinition['category'] }))}>
              {(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'] as string[]).map((value) => (
                <option key={value} value={value}>{categoryLabel(t, value)}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t.more.restSeconds}>
            <TextInput type="number" min="0" step="15" value={draft.defaultRestSeconds} onChange={(event) => setDraft((current) => ({ ...current, defaultRestSeconds: Number(event.target.value || 0) }))} />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>{t.more.cancel}</Button>
          <Button type="button" onClick={() => onSave(draft)}>{t.more.saveExercise}</Button>
        </div>
      </div>
    </div>
  )
}

export function TrainingModeSettingsForm() {
  const { t } = useT()
  const { settings, setSetting } = useSettings()
  const exerciseDefinitions = useLiveQuery(() => db.exerciseDefinitions.orderBy('name').toArray(), [], [])
  const [modes, setModes] = useState(settings.trainingModes)
  const [modalOpen, setModalOpen] = useState(false)
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const modalMode = useMemo<TrainingModeDraft>(() => {
    const existing = modes.find((mode) => mode.id === editingId)
    return existing ? { ...existing } : { ...emptyMode, id: `custom-${Date.now()}` }
  }, [editingId, modes])

  const exerciseModalData = useMemo<ExerciseDraft>(() => {
    const existing = exerciseDefinitions.find((exercise) => exercise.id === editingExerciseId)
    return existing ? { id: existing.id, name: existing.name, category: existing.category, defaultRestSeconds: existing.defaultRestSeconds } : { ...emptyExercise, id: `custom-exercise-${Date.now()}` }
  }, [editingExerciseId, exerciseDefinitions])

  useEffect(() => {
    setModes(settings.trainingModes)
  }, [settings.trainingModes])

  function handleSaveToSettings() {
    const parsed = modes.map((mode) => TrainingModePresetSchema.parse(mode))
    void setSetting('trainingModes', parsed)
    setMessage(t.more.trainingSaved)
  }

  function openAddModal() {
    setEditingId(null)
    setModalOpen(true)
  }

  function openEditModal(id: string) {
    setEditingId(id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
  }

  function saveModal(mode: TrainingModeDraft) {
    const parsed = TrainingModePresetSchema.parse({
      ...mode,
      id: mode.id || `custom-${Date.now()}`,
      label: mode.label || 'Custom mode',
      sportType: mode.sportType || 'strength',
      description: mode.description || mode.notes || 'Custom training mode',
      notes: mode.notes || mode.description || '',
    })

    setModes((current) => {
      if (editingId) {
        return current.map((item) => item.id === editingId ? parsed : item)
      }
      return [...current, parsed]
    })

    closeModal()
    setMessage(editingId ? t.more.presetUpdated : t.more.presetAdded)
  }

  function removeMode(id: string) {
    setModes((current) => current.filter((mode) => mode.id !== id))
    setMessage(t.more.presetRemoved)
  }

  function restoreDefaults() {
    setModes(DEFAULT_TRAINING_MODES)
    setMessage(t.more.defaultsRestored)
  }

  async function saveExercise(exercise: ExerciseDraft) {
    const parsed = ExerciseDefinitionSchema.parse({
      id: exercise.id || crypto.randomUUID(),
      name: exercise.name.trim() || 'Custom exercise',
      category: exercise.category,
      defaultRestSeconds: Number(exercise.defaultRestSeconds || 60),
    })
    await db.exerciseDefinitions.put(parsed)
    setExerciseModalOpen(false)
    setEditingExerciseId(null)
    setMessage(editingExerciseId ? t.more.exerciseUpdated : t.more.exerciseAdded)
  }

  async function removeExercise(id: string) {
    await db.exerciseDefinitions.delete(id)
    setMessage(t.more.exerciseRemoved)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader icon={<Dumbbell />} title={t.more.trainingTitle} />
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-ink-mid">{t.more.trainingDesc}</div>
            <Button type="button" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />{t.more.addPreset}
            </Button>
          </div>

          <div className="space-y-3">
            {modes.map((mode) => (
              <div key={mode.id} className="rounded-xl border border-line bg-surface-0 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-ink-hi">{mode.label}</div>
                    <div className="text-xs text-ink-mid">{mode.description || mode.notes || 'Custom training mode'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEditModal(mode.id)} aria-label={t.more.editAria.replace('{name}', mode.label)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeMode(mode.id)} aria-label={t.more.removeAria.replace('{name}', mode.label)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-ink-mid sm:grid-cols-2">
                  <span>{t.more.rowType.replace('{value}', sportLabel(t, mode.sportType))}</span>
                  <span>{t.more.rowIntensity.replace('{value}', intensityLabel(t, mode.intensity))}</span>
                  <span>{t.more.rowDuration.replace('{value}', String(mode.durationMinutes))}</span>
                  <span>{t.more.rowPhase.replace('{value}', phaseLabel(t, mode.seasonPhase))}</span>
                  <span>{t.more.rowCalories.replace('{value}', String(mode.caloriesDelta))}</span>
                  <span>{t.more.rowCarbs.replace('{value}', String(mode.carbsDelta))}</span>
                  <span>{t.more.rowProtein.replace('{value}', String(mode.proteinDelta))}</span>
                  <span>{t.more.rowHydration.replace('{value}', String(mode.hydrationMl))}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={restoreDefaults}>{t.more.resetDefaults}</Button>
            <Button type="button" variant="secondary" onClick={() => void handleSaveToSettings()}>{t.more.saveAllChanges}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader icon={<Dumbbell />} title={t.more.workoutExercises} />
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium text-ink-hi">{t.more.exerciseLibrary}</div>
              <div className="text-xs text-ink-mid">{t.more.exerciseLibraryDesc}</div>
            </div>
            <Button type="button" onClick={() => { setEditingExerciseId(null); setExerciseModalOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" />{t.more.addExercise}
            </Button>
          </div>

          <div className="space-y-2">
            {(exerciseDefinitions ?? []).map((exercise) => (
              <div key={exercise.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-1 p-3">
                <div>
                  <div className="font-medium text-ink-hi">{exercise.name}</div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-ink-mid">{categoryLabel(t, exercise.category)} · {t.more.restLabel.replace('{value}', String(exercise.defaultRestSeconds))}</div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingExerciseId(exercise.id); setExerciseModalOpen(true) }} aria-label={t.more.editAria.replace('{name}', exercise.name)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void removeExercise(exercise.id)} aria-label={t.more.removeAria.replace('{name}', exercise.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(exerciseDefinitions ?? []).length === 0 ? <div className="rounded-lg border border-dashed border-line bg-surface-1 p-4 text-sm text-ink-mid">{t.more.noCustomExercises}</div> : null}
          </div>
        </CardContent>
      </Card>

      {message ? <Alert variant="success">{message}</Alert> : null}

      <TrainingModeModal open={modalOpen} mode={modalMode} onClose={closeModal} onSave={saveModal} />
      <ExerciseModal open={exerciseModalOpen} exercise={exerciseModalData} onClose={() => { setExerciseModalOpen(false); setEditingExerciseId(null) }} onSave={saveExercise} />
    </div>
  )
}