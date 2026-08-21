import { Scale } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { WeightEntrySchema } from '@/schemas/weightLog.schema'

export function WeightLoggerCard() {
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function saveWeight(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    try {
      const date = new Date().toISOString().slice(0, 10)
      const entry = WeightEntrySchema.parse({ id: crypto.randomUUID(), date, weightKg: Number(weight), smoothedWeightKg: Number(weight), note: note.trim() || undefined })
      await db.weightLogs.put(entry)
      setWeight('')
      setNote('')
      setMessage(`Saved ${entry.weightKg.toFixed(1)} kg for ${date}.`)
    } catch {
      setError('Enter a body weight between 30 and 350 kg.')
    }
  }

  return <Card><CardHeader icon={<Scale />} title="Track weight" /><CardContent><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => void saveWeight(event)}><label className="flex-1"><span className="mb-1 block text-xs text-slate-400">Weight (kg)</span><input required type="number" min="30" max="350" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="80.0" className="min-h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100" /></label><label className="min-w-40 flex-1"><span className="mb-1 block text-xs text-slate-400">Note</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Morning" className="min-h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100" /></label><Button type="submit">Save weight</Button></form>{message ? <Alert className="mt-3" variant="success">{message}</Alert> : null}{error ? <Alert className="mt-3" variant="error">{error}</Alert> : null}</CardContent></Card>
}
