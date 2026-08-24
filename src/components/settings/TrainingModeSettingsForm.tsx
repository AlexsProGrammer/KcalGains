import { useEffect, useMemo, useState } from 'react'
import { Dumbbell, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { DEFAULT_TRAINING_MODES, TrainingModePresetSchema } from '@/schemas/settings.schema'
import { useSettings } from '@/hooks/useSettings'

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
  const [draft, setDraft] = useState<TrainingModeDraft>(mode)

  useEffect(() => {
    if (open) setDraft(mode)
  }, [open, mode])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface-1 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-accent-text">Training preset</p>
            <h3 className="mt-1 text-xl font-semibold text-ink-hi">{mode.id ? 'Edit preset' : 'Add new preset'}</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close training mode editor">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Field label="Name">
            <TextInput value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Cycling heavy" />
          </Field>
          <Field label="Type">
            <SelectInput value={draft.sportType} onChange={(event) => setDraft((current) => ({ ...current, sportType: event.target.value }))}>
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="cardio">Cardio</option>
              <option value="mma">MMA</option>
              <option value="combat_sport">Combat</option>
              <option value="endurance">Endurance</option>
              <option value="rest">Rest</option>
            </SelectInput>
          </Field>
          <Field label="Intensity">
            <SelectInput value={draft.intensity} onChange={(event) => setDraft((current) => ({ ...current, intensity: event.target.value as TrainingModeDraft['intensity'] }))}>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </SelectInput>
          </Field>
          <Field label="Duration (min)">
            <TextInput type="number" min="0" step="5" value={draft.durationMinutes} onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: Number(event.target.value || 0) }))} />
          </Field>
          <Field label="Calories delta">
            <TextInput type="number" step="5" value={draft.caloriesDelta} onChange={(event) => setDraft((current) => ({ ...current, caloriesDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label="Carbs delta (g)">
            <TextInput type="number" step="5" value={draft.carbsDelta} onChange={(event) => setDraft((current) => ({ ...current, carbsDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label="Protein delta (g)">
            <TextInput type="number" step="5" value={draft.proteinDelta} onChange={(event) => setDraft((current) => ({ ...current, proteinDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label="Hydration (ml)">
            <TextInput type="number" step="50" value={draft.hydrationMl} onChange={(event) => setDraft((current) => ({ ...current, hydrationMl: Number(event.target.value || 0) }))} />
          </Field>
          <Field label="Sodium (mg)">
            <TextInput type="number" step="50" value={draft.sodiumMgDelta} onChange={(event) => setDraft((current) => ({ ...current, sodiumMgDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label="Potassium (mg)">
            <TextInput type="number" step="50" value={draft.potassiumMgDelta} onChange={(event) => setDraft((current) => ({ ...current, potassiumMgDelta: Number(event.target.value || 0) }))} />
          </Field>
          <Field label="Phase" className="md:col-span-2">
            <SelectInput value={draft.seasonPhase} onChange={(event) => setDraft((current) => ({ ...current, seasonPhase: event.target.value as TrainingModeDraft['seasonPhase'] }))}>
              <option value="offseason">Offseason</option>
              <option value="competition_prep">Competition prep</option>
              <option value="competition">Competition</option>
              <option value="recovery">Recovery</option>
            </SelectInput>
          </Field>
          <Field label="Description" className="md:col-span-2">
            <TextInput value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Short summary for the mode" />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onSave(draft)}>Save preset</Button>
        </div>
      </div>
    </div>
  )
}

export function TrainingModeSettingsForm() {
  const { settings, setSetting } = useSettings()
  const [modes, setModes] = useState(settings.trainingModes)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const modalMode = useMemo<TrainingModeDraft>(() => {
    const existing = modes.find((mode) => mode.id === editingId)
    return existing ? { ...existing } : { ...emptyMode, id: `custom-${Date.now()}` }
  }, [editingId, modes])

  useEffect(() => {
    setModes(settings.trainingModes)
  }, [settings.trainingModes])

  function handleSaveToSettings() {
    const parsed = modes.map((mode) => TrainingModePresetSchema.parse(mode))
    void setSetting('trainingModes', parsed)
    setMessage('Training modes saved.')
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
    setMessage(editingId ? 'Training preset updated.' : 'New training preset added.')
  }

  function removeMode(id: string) {
    setModes((current) => current.filter((mode) => mode.id !== id))
    setMessage('Training preset removed.')
  }

  function restoreDefaults() {
    setModes(DEFAULT_TRAINING_MODES)
    setMessage('Default training modes restored.')
  }

  return (
    <Card>
      <CardHeader icon={<Dumbbell />} title="Training modes" />
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-ink-mid">Configure the presets available in the training selector.</div>
          <Button type="button" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />Add new preset
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => openEditModal(mode.id)} aria-label={`Edit ${mode.label}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMode(mode.id)} aria-label={`Remove ${mode.label}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-ink-mid sm:grid-cols-2">
                <span>Type: {mode.sportType}</span>
                <span>Intensity: {mode.intensity}</span>
                <span>Duration: {mode.durationMinutes} min</span>
                <span>Phase: {mode.seasonPhase}</span>
                <span>Calories: {mode.caloriesDelta} kcal</span>
                <span>Carbs: {mode.carbsDelta} g</span>
                <span>Protein: {mode.proteinDelta} g</span>
                <span>Hydration: {mode.hydrationMl} ml</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={restoreDefaults}>Reset defaults</Button>
          <Button type="button" variant="secondary" onClick={() => void handleSaveToSettings()}>Save all changes</Button>
        </div>

        {message ? <Alert variant="success">{message}</Alert> : null}
      </CardContent>

      <TrainingModeModal open={modalOpen} mode={modalMode} onClose={closeModal} onSave={saveModal} />
    </Card>
  )
}
