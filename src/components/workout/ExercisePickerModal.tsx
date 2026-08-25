import { Search, X } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '@/db'
import { useT } from '@/i18n'
import { Button } from '@/components/ui/button'
import type { ExerciseDefinition } from '@/types'

type Props = { open: boolean; onClose: () => void; onSelect: (exercise: ExerciseDefinition) => void }
export function ExercisePickerModal({ open, onClose, onSelect }: Props) {
  const { t } = useT()
  const [query, setQuery] = useState('')
  const exercises = useLiveQuery(() => db.exerciseDefinitions.orderBy('name').toArray(), [], [])
  if (!open) return null
  const filtered = exercises.filter((exercise) => `${exercise.name} ${exercise.category}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"><div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-100">{t.train.chooseExercise}</h2><Button type="button" size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div><div className="relative mt-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.train.searchMovement} className="min-h-10 w-full rounded border border-slate-700 bg-slate-950 pl-10 text-sm text-slate-100" /></div><div className="mt-3 space-y-1">{filtered.map((exercise) => <button key={exercise.id} type="button" onClick={() => { onSelect(exercise); onClose() }} className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"><span>{exercise.name}</span><span className="text-xs uppercase text-slate-500">{exercise.category}</span></button>)}</div></div></div>
}
