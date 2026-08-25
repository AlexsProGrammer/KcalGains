import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { db } from '@/db'
import { WeightEntrySchema } from '@/schemas/weightLog.schema'

type WeightQuickAddModalProps = {
  open: boolean
  onClose: () => void
  defaultDate?: string
}

export function WeightQuickAddModal({ open, onClose, defaultDate }: WeightQuickAddModalProps) {
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10))
  const [weightKg, setWeightKg] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!open) return null

  async function handleSave() {
    setError(null)
    setSuccess(null)

    try {
      const value = Number(weightKg)
      const entry = WeightEntrySchema.parse({
        id: crypto.randomUUID(),
        date,
        weightKg: value,
        smoothedWeightKg: value,
        note: note.trim() || undefined,
      })

      await db.weightLogs.put(entry)
      setWeightKg('')
      setNote('')
      setSuccess(`Saved ${entry.weightKg.toFixed(1)} kg for ${entry.date}.`)
      onClose()
    } catch {
      setError('Enter a valid weight between 30 and 350 kg.')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-surface-0/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Log weight">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-1 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink-hi">Log weight</h3>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close weight log">
            ×
          </Button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-ink-mid">
            <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-ink-low">Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-10 w-full rounded-md border border-line bg-surface-0 px-3 text-ink-hi" />
          </label>

          <label className="block text-sm text-ink-mid">
            <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-ink-low">Weight (kg)</span>
            <input type="number" min="30" max="350" step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="80.0" className="min-h-10 w-full rounded-md border border-line bg-surface-0 px-3 text-ink-hi" />
          </label>

          <label className="block text-sm text-ink-mid">
            <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-ink-low">Note</span>
            <input type="text" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Morning" className="min-h-10 w-full rounded-md border border-line bg-surface-0 px-3 text-ink-hi" />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => void handleSave()}>Save weight</Button>
        </div>
      </div>
    </div>
  )
}
