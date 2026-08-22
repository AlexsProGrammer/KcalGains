import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { db } from '@/db'
import { WeightEntrySchema } from '@/schemas/weightLog.schema'
import type { WeightEntry } from '@/types'

type WeightHistoryListProps = {
  viewMode: 'graph' | 'list'
}

const EMPTY_FORM = { date: new Date().toISOString().slice(0, 10), weightKg: '', note: '' }

export function WeightHistoryList({ viewMode }: WeightHistoryListProps) {
  const [draft, setDraft] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const entries = useLiveQuery(() => db.weightLogs.orderBy('date').reverse().toArray(), [])

  const sortedEntries = useMemo(
    () => [...(entries ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  )

  async function saveEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const parsed = WeightEntrySchema.parse({
        id: crypto.randomUUID(),
        date: draft.date,
        weightKg: Number(draft.weightKg),
        smoothedWeightKg: Number(draft.weightKg),
        note: draft.note.trim() || undefined,
      })

      await db.weightLogs.put(parsed)
      setDraft(EMPTY_FORM)
    } catch {
      setError('Use a valid date and a weight between 30 and 350 kg.')
    }
  }

  async function updateEntry(entry: WeightEntry, nextWeight: string, nextNote: string) {
    const value = Number(nextWeight)
    const parsed = WeightEntrySchema.parse({
      ...entry,
      weightKg: value,
      smoothedWeightKg: value,
      note: nextNote.trim() || undefined,
    })
    await db.weightLogs.put(parsed)
  }

  async function deleteEntry(id: string) {
    await db.weightLogs.delete(id)
  }

  if (viewMode === 'graph') {
    return null
  }

  return (
    <Card>
      <CardHeader title="Weight history" />
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => void saveEntry(event)}>
          <Field label="Date">
            <TextInput type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
          </Field>
          <Field label="Weight (kg)">
            <TextInput type="number" min="30" max="350" step="0.1" value={draft.weightKg} onChange={(event) => setDraft((current) => ({ ...current, weightKg: event.target.value }))} placeholder="80.0" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Add entry</Button>
          </div>
        </form>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="space-y-3">
          {sortedEntries.length === 0 ? <p className="text-sm text-slate-500">No weight entries yet.</p> : null}
          {sortedEntries.map((entry) => (
            <div key={entry.id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Field label="Date">
                  <TextInput type="date" defaultValue={entry.date} onBlur={(event) => {
                    const nextDate = event.target.value
                    if (!nextDate || nextDate === entry.date) return
                    void db.weightLogs.put({ ...entry, date: nextDate })
                  }} />
                </Field>

                <Field label="Weight kg">
                  <TextInput type="number" min="30" max="350" step="0.1" defaultValue={String(entry.weightKg)} onBlur={(event) => {
                    void updateEntry(entry, event.target.value, entry.note ?? '')
                  }} />
                </Field>

                <div className="flex items-end">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => void deleteEntry(entry.id)}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <Field label="Note">
                  <TextInput defaultValue={entry.note ?? ''} placeholder="Optional note" onBlur={(event) => {
                    void updateEntry(entry, String(entry.weightKg), event.target.value)
                  }} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
