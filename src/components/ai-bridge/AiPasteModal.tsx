import { ClipboardPaste, X } from 'lucide-react'
import { useState } from 'react'
import { readFromClipboard } from '@/services/clipboardService'
import { useAiIngestion } from '@/hooks/useAiIngestion'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { SchemaValidationAlert } from '@/components/ai-bridge/SchemaValidationAlert'
import { IngestionPreviewTable } from '@/components/ai-bridge/IngestionPreviewTable'

type Props = { open: boolean; onClose: () => void }
export function AiPasteModal({ open, onClose }: Props) {
  const ingestion = useAiIngestion()
  const [clipboardError, setClipboardError] = useState<string | null>(null)
  if (!open) return null
  async function paste() { try { setClipboardError(null); await ingestion.validate(await readFromClipboard()) } catch (error) { setClipboardError(error instanceof Error ? error.message : 'Clipboard access failed.') } }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-emerald-400">AI bridge</p><h2 className="text-lg font-semibold text-slate-100">Paste AI meal JSON</h2></div><Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close AI paste"><X className="h-4 w-4" /></Button></div><div className="mt-4 flex gap-2"><Button type="button" variant="secondary" onClick={() => void paste()}><ClipboardPaste className="mr-2 h-4 w-4" />Paste from clipboard</Button><span className="self-center text-xs text-slate-500">or paste manually below</span></div>{clipboardError ? <Alert className="mt-3" variant="warning">{clipboardError}</Alert> : null}<textarea value={ingestion.rawText} onChange={(event) => { ingestion.setRawText(event.target.value); void ingestion.validate(event.target.value) }} placeholder="Paste the JSON response here..." className="mt-4 min-h-40 w-full rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none focus:border-emerald-400" /><div className="mt-3"><SchemaValidationAlert errors={ingestion.errors} /></div>{ingestion.parsedMeal ? <div className="mt-4"><IngestionPreviewTable meal={ingestion.parsedMeal} links={ingestion.linkedFoods} isProcessing={ingestion.isProcessing} onChangeGrams={ingestion.updateItem} onCommit={() => void ingestion.commit()} /></div> : null}{ingestion.isCommitted ? <Alert className="mt-4" variant="success">Meal and new foods were saved locally.</Alert> : null}</div></div>
}
