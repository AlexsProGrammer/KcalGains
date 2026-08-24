import { useState } from 'react'
import type { z } from 'zod'
import {
  exportDatabaseToJson,
  importDatabaseFromJson,
  type BackupSelection,
  type ImportDatabaseResult,
  type ImportMode,
  type ImportSummary,
} from '@/services/backupService'

export function useBackup() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationIssues, setValidationIssues] = useState<z.ZodIssue[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  async function exportBackup(selection?: BackupSelection | null) {
    setIsLoading(true)
    setError(null)
    setValidationIssues([])
    setSuccessMessage(null)
    setSummary(null)

    try {
      const payload = await exportDatabaseToJson(selection)
      const selectedTables = Object.entries(selection ?? {}).filter(([, enabled]) => enabled).map(([name]) => name)
      const summaryText = selectedTables.length > 0
        ? `${selectedTables.length} table${selectedTables.length === 1 ? '' : 's'} selected`
        : 'all tables'
      setSuccessMessage(`Backup exported (${summaryText}).`)
    } catch {
      setError('The backup could not be exported.')
    } finally {
      setIsLoading(false)
    }
  }

  async function importBackup(file: File, mode: ImportMode = 'overwrite', selection?: BackupSelection | null): Promise<ImportDatabaseResult> {
    setIsLoading(true)
    setError(null)
    setValidationIssues([])
    setSuccessMessage(null)
    setSummary(null)

    try {
      const result = await importDatabaseFromJson(file, mode, selection)

      if (result.success) {
        setSummary(result.summary)
        setSuccessMessage(`Backup imported in ${result.mode} mode.`)
      } else {
        setError(result.error)
        setValidationIssues(result.issues ?? [])
      }

      return result
    } catch {
      const result: ImportDatabaseResult = { success: false, error: 'The backup could not be imported.' }
      setError(result.error)
      return result
    } finally {
      setIsLoading(false)
    }
  }

  return { error, exportBackup, importBackup, isLoading, successMessage, summary, validationIssues }
}
