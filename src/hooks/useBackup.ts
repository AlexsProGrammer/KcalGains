import { useState } from 'react'
import type { z } from 'zod'
import { exportDatabaseToJson, importDatabaseFromJson, type ImportDatabaseResult } from '@/services/backupService'

export function useBackup() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationIssues, setValidationIssues] = useState<z.ZodIssue[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function exportBackup() {
    setIsLoading(true)
    setError(null)
    setValidationIssues([])
    setSuccessMessage(null)

    try {
      const payload = await exportDatabaseToJson()
      setSuccessMessage(`Backup exported with ${payload.foods.length} foods and ${payload.meals.length} meals.`)
    } catch {
      setError('The backup could not be exported.')
    } finally {
      setIsLoading(false)
    }
  }

  async function importBackup(file: File): Promise<ImportDatabaseResult> {
    setIsLoading(true)
    setError(null)
    setValidationIssues([])
    setSuccessMessage(null)

    try {
      const result = await importDatabaseFromJson(file)

      if (result.success) {
        setSuccessMessage('Backup imported successfully.')
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

  return { error, exportBackup, importBackup, isLoading, successMessage, validationIssues }
}
