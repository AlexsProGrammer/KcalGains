import { db } from '@/db'
import { BackupPayloadSchema } from '@/schemas/backup.schema'
import type { BackupPayload } from '@/types'
import type { z } from 'zod'

const BACKUP_VERSION = 1

type BackupTables = Pick<BackupPayload, 'foods' | 'meals' | 'workouts' | 'dailyLogs' | 'profile'>

type BackupTableCounts = { [Key in keyof BackupTables]: number }

export type ImportDatabaseResult =
  | {
      success: true
      counts: BackupTableCounts
    }
  | {
      success: false
      error: string
      issues?: z.ZodIssue[]
    }

function downloadBackup(payload: BackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStamp = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `kcalgains-backup-${dateStamp}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportDatabaseToJson(): Promise<BackupPayload> {
  const [foods, meals, workouts, dailyLogs, profile] = await Promise.all([
    db.foods.toArray(),
    db.meals.toArray(),
    db.workouts.toArray(),
    db.dailyLogs.toArray(),
    db.profile.toArray(),
  ])

  const payload = BackupPayloadSchema.parse({
    version: BACKUP_VERSION,
    exportedAt: new Date(),
    foods,
    meals,
    workouts,
    dailyLogs,
    profile,
  })

  downloadBackup(payload)
  return payload
}

export async function importDatabaseFromJson(file: File): Promise<ImportDatabaseResult> {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(await file.text())
  } catch {
    return { success: false, error: 'The selected file is not valid JSON.' }
  }

  const validation = BackupPayloadSchema.safeParse(parsedJson)

  if (!validation.success) {
    return {
      success: false,
      error: 'The backup does not match the expected KcalGains format.',
      issues: validation.error.issues,
    }
  }

  const payload = validation.data

  try {
    await db.transaction('rw', [db.foods, db.meals, db.workouts, db.dailyLogs, db.profile], async () => {
      await Promise.all([
        db.foods.clear(),
        db.meals.clear(),
        db.workouts.clear(),
        db.dailyLogs.clear(),
        db.profile.clear(),
      ])
      await Promise.all([
        db.foods.bulkAdd(payload.foods),
        db.meals.bulkAdd(payload.meals),
        db.workouts.bulkAdd(payload.workouts),
        db.dailyLogs.bulkAdd(payload.dailyLogs),
        db.profile.bulkAdd(payload.profile),
      ])
    })
  } catch {
    return { success: false, error: 'The backup could not be written to browser storage.' }
  }

  return {
    success: true,
    counts: {
      foods: payload.foods.length,
      meals: payload.meals.length,
      workouts: payload.workouts.length,
      dailyLogs: payload.dailyLogs.length,
      profile: payload.profile.length,
    },
  }
}
