import { db } from '@/db'
import { BackupPayloadSchema } from '@/schemas/backup.schema'
import type { BackupPayload } from '@/types'
import type { z } from 'zod'

const BACKUP_VERSION = 1

type BackupTables = Pick<BackupPayload, 'foods' | 'meals' | 'workouts' | 'dailyLogs' | 'profile'>

export type BackupTableName = keyof BackupTables

export type BackupTableCounts = { [Key in BackupTableName]: number }

export type ImportMode = 'overwrite' | 'merge'

export type ImportTableSummary = { added: number; updated: number; skipped: number }

export type ImportSummary = { [Key in BackupTableName]: ImportTableSummary }

export type ImportDatabaseResult =
  | {
      success: true
      mode: ImportMode
      counts: BackupTableCounts
      summary: ImportSummary
    }
  | {
      success: false
      error: string
      issues?: z.ZodIssue[]
    }

const TABLE_NAMES: BackupTableName[] = ['foods', 'meals', 'workouts', 'dailyLogs', 'profile']

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

function emptySummary(): ImportSummary {
  return {
    foods: { added: 0, updated: 0, skipped: 0 },
    meals: { added: 0, updated: 0, skipped: 0 },
    workouts: { added: 0, updated: 0, skipped: 0 },
    dailyLogs: { added: 0, updated: 0, skipped: 0 },
    profile: { added: 0, updated: 0, skipped: 0 },
  }
}

function recordTimestamp(record: unknown): number | null {
  const value = record as { createdAt?: unknown; updatedAt?: unknown } | null
  const raw = value?.updatedAt ?? value?.createdAt
  if (raw == null) return null

  const time = raw instanceof Date ? raw.getTime() : new Date(String(raw)).getTime()
  return Number.isNaN(time) ? null : time
}

/** Records without any timestamp cannot be compared, so the incoming copy wins. */
function isIncomingNewer(incoming: unknown, existing: unknown): boolean {
  const incomingTime = recordTimestamp(incoming)
  const existingTime = recordTimestamp(existing)
  if (incomingTime === null || existingTime === null) return true
  return incomingTime >= existingTime
}

export async function importDatabaseFromJson(
  file: File,
  mode: ImportMode = 'overwrite',
): Promise<ImportDatabaseResult> {
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
  const summary = emptySummary()
  const tables = [db.foods, db.meals, db.workouts, db.dailyLogs, db.profile]

  try {
    await db.transaction('rw', tables, async () => {
      for (const [index, name] of TABLE_NAMES.entries()) {
        const table = tables[index]
        const incoming = payload[name] as { id: string }[]

        if (mode === 'overwrite') {
          await table.clear()
          await table.bulkAdd(incoming as never[])
          summary[name].added = incoming.length
          continue
        }

        const existing = new Map(
          (await table.toArray()).map((record) => [(record as { id: string }).id, record]),
        )
        const writes: unknown[] = []

        for (const record of incoming) {
          const current = existing.get(record.id)

          if (!current) {
            writes.push(record)
            summary[name].added += 1
          } else if (isIncomingNewer(record, current)) {
            writes.push(record)
            summary[name].updated += 1
          } else {
            summary[name].skipped += 1
          }
        }

        if (writes.length > 0) await table.bulkPut(writes as never[])
      }
    })
  } catch {
    return { success: false, error: 'The backup could not be written to browser storage.' }
  }

  return {
    success: true,
    mode,
    summary,
    counts: {
      foods: payload.foods.length,
      meals: payload.meals.length,
      workouts: payload.workouts.length,
      dailyLogs: payload.dailyLogs.length,
      profile: payload.profile.length,
    },
  }
}
