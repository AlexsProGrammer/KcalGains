import { Download, FileJson, Upload } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { useBackup } from '@/hooks/useBackup'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function BackupManager() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { error, exportBackup, importBackup, isLoading, successMessage, validationIssues } = useBackup()

  async function handleFile(file: File | undefined) {
    if (file) {
      await importBackup(file)
    }
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
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={() => void exportBackup()} disabled={isLoading}>
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
        {successMessage ? <Alert className="mt-4" variant="success">{successMessage}</Alert> : null}
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
