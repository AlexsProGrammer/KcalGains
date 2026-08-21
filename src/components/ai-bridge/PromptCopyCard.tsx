import { Check, Copy } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type Props = { prompt: string; copied: boolean; isCopying: boolean; error: string | null; onCopy: () => void }
export function PromptCopyCard({ prompt, copied, isCopying, error, onCopy }: Props) {
  return <div className="space-y-3"><textarea readOnly value={prompt} className="min-h-48 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-300" /><div className="flex items-center gap-3"><Button type="button" onClick={onCopy} disabled={isCopying}><Copy className="mr-2 h-4 w-4" />{isCopying ? 'Copying...' : 'Copy Prompt for Gemini/ChatGPT'}</Button>{copied ? <span className="flex items-center gap-1 text-xs text-emerald-300"><Check className="h-4 w-4" />Copied</span> : null}</div>{error ? <Alert variant="warning">{error}</Alert> : null}<p className="text-xs text-slate-500">1. Paste into Gemini or ChatGPT. 2. Copy the JSON reply. 3. Paste it back here.</p></div>
}
