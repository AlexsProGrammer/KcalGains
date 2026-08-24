import { Check, Copy, Download, FileJson, Sparkles, Upload } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { useBackup } from '@/hooks/useBackup'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput } from '@/components/ui/field'
import { copyToClipboard } from '@/services/clipboardService'
import { extractJsonFromText } from '@/services/aiResponseParserService'
import { DEFAULT_BACKUP_SELECTION, type BackupSelection, type ImportMode } from '@/services/backupService'
import { generateBackupImportPrompt } from '@/services/promptSynthesizerService'

const BACKUP_TABLE_LABELS: Record<keyof typeof DEFAULT_BACKUP_SELECTION, string> = {
  foods: 'Foods',
  meals: 'Meals',
  workouts: 'Workouts',
  dailyLogs: 'Daily logs',
  profile: 'Profile',
  settings: 'Settings',
  exerciseDefinitions: 'Exercise definitions',
  trainingContext: 'Training context',
  trainingPlans: 'Training plans',
}

export function BackupManager() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [selection, setSelection] = useState<BackupSelection>({ ...DEFAULT_BACKUP_SELECTION })
  const [sourceText, setSourceText] = useState('')
  const [responseText, setResponseText] = useState('')
  const [copied, setCopied] = useState(false)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const { error, exportBackup, importBackup, isLoading, successMessage, summary, validationIssues } = useBackup()

  function updateSelection(table: keyof typeof DEFAULT_BACKUP_SELECTION, nextValue: boolean) {
    setSelection((current) => ({ ...current, [table]: nextValue }))
  }

  async function handleFile(file: File | undefined) {
    if (file) {
      await importBackup(file, mode, selection)
    }
  }

  async function copyImportPrompt() {
    const success = await copyToClipboard(generateBackupImportPrompt(sourceText))
    setCopied(success)
  }

  async function importPastedResponse() {
    setPasteError(null)

    let json: string
    try {
      json = extractJsonFromText(responseText)
    } catch (extractError) {
      setPasteError(extractError instanceof Error ? extractError.message : 'No JSON found in the response.')
      return
    }

    const file = new File([json], 'ai-import.json', { type: 'application/json' })
    const result = await importBackup(file, mode, selection)
    if (result.success) setResponseText('')
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    void handleFile(event.dataTransfer.files[0])
  }

  return (
    <Card>
      <CardHeader icon={<FileJson />} title="Backup and restore" />
      <CardContent>
        <p>Keep a portable JSON copy of your local fitness data.</p>
        <Field
          className="mt-4 max-w-xs"
          label="Import mode"
          hint={mode === 'merge' ? 'Upserts by id; the newest copy of a record wins.' : 'Clears each table before writing the backup.'}
        >
          <SelectInput value={mode} onChange={(event) => setMode(event.target.value as ImportMode)}>
            <option value="merge">Merge (keep existing data)</option>
            <option value="overwrite">Overwrite (replace all data)</option>
          </SelectInput>
        </Field>
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Backup contents</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(BACKUP_TABLE_LABELS).map(([table, label]) => (
              <label key={table} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/60 px-2 py-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(selection[table as keyof typeof DEFAULT_BACKUP_SELECTION])}
                  onChange={(event) => updateSelection(table as keyof typeof DEFAULT_BACKUP_SELECTION, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={() => void exportBackup(selection)} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Export Backup (.json)
          </Button>
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Import Backup
          </Button>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>
        <div
          className={`mt-4 rounded-md border border-dashed px-4 py-5 text-center text-sm transition-colors ${isDragging ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-slate-700 text-slate-500'}`}
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          Drop a `.json` backup here
        </div>

        <div className="mt-5 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Import from tracked notes with AI
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Already tracking in a text file or table? Paste it below, copy the prompt into Gemini or ChatGPT, then bring the JSON reply back here.
          </p>

          <Field className="mt-3" label="Your tracked meals (optional)" hint="Left empty, the prompt still works — just paste your log into the chat yourself.">
            <textarea
              value={sourceText}
              onChange={(event) => {
                setSourceText(event.target.value)
                setCopied(false)
              }}
              placeholder={'2026-08-20 breakfast: 80g oats, 250ml milk, 1 banana\n2026-08-20 lunch: 150g chicken, 200g rice'}
              className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 outline-none focus:border-emerald-400"
            />
          </Field>

          <div className="mt-3 flex items-center gap-3">
            <Button type="button" size="sm" onClick={() => void copyImportPrompt()}>
              <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
              Copy import prompt
            </Button>
            {copied ? (
              <span className="flex items-center gap-1 text-xs text-emerald-300">
                <Check className="h-4 w-4" aria-hidden="true" />
                Copied
              </span>
            ) : null}
          </div>

          <Field className="mt-4" label="Paste the AI's JSON reply" hint="Markdown fences are stripped automatically.">
            <textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              placeholder='{ "version": 1, "exportedAt": "...", "foods": [...] }'
              className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none focus:border-emerald-400"
            />
          </Field>

          <Button
            className="mt-3"
            type="button"
            size="sm"
            variant="secondary"
            disabled={isLoading || responseText.trim().length === 0}
            onClick={() => void importPastedResponse()}
          >
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Import pasted JSON ({mode})
          </Button>

          {pasteError ? <Alert className="mt-3" variant="warning">{pasteError}</Alert> : null}
        </div>
        {successMessage ? <Alert className="mt-4" variant="success">{successMessage}</Alert> : null}
        {summary ? (
          <div className="mt-3 overflow-hidden rounded-md border border-slate-800">
            <div className="grid grid-cols-4 gap-2 border-b border-slate-800 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
              <span>Table</span>
              <span>Added</span>
              <span>Updated</span>
              <span>Skipped</span>
            </div>
            {Object.entries(summary).map(([table, counts]) => (
              <div key={table} className="grid grid-cols-4 gap-2 border-b border-slate-800 px-3 py-2 text-sm text-slate-300 last:border-0">
                <span>{table}</span>
                <span>{counts.added}</span>
                <span>{counts.updated}</span>
                <span>{counts.skipped}</span>
              </div>
            ))}
          </div>
        ) : null}
        {error ? (
          <Alert className="mt-4" variant="error" title="Backup error">
            <p>{error}</p>
            {validationIssues.length > 0 ? (
              <ul className="mt-2 list-disc pl-5">
                {validationIssues.map((issue, index) => (
                  <li key={`${issue.path.join('.')}-${index}`}>
                    {issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''}{issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
