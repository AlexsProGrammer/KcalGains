import { Bot, ClipboardPaste, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PromptGeneratorModal } from '@/components/ai-bridge/PromptGeneratorModal'
import { AiPasteModal } from '@/components/ai-bridge/AiPasteModal'

export function AiBridgeContainer() {
  const [promptOpen, setPromptOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  return <><Card><CardHeader icon={<Bot />} title="AI meal bridge" /><CardContent><p className="text-sm text-slate-400">Generate a private prompt for Gemini or ChatGPT, then validate and save the JSON response locally.</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" onClick={() => setPromptOpen(true)}><Sparkles className="mr-2 h-4 w-4" />Generate prompt</Button><Button type="button" variant="secondary" onClick={() => setPasteOpen(true)}><ClipboardPaste className="mr-2 h-4 w-4" />Paste AI response</Button></div></CardContent></Card><PromptGeneratorModal open={promptOpen} onClose={() => setPromptOpen(false)} /><AiPasteModal open={pasteOpen} onClose={() => setPasteOpen(false)} /></>
}
