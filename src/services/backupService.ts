import { db } from '@/db'
import { BackupPayloadSchema } from '@/schemas/backup.schema'
import type { BackupPayload } from '@/types'
import type { z } from 'zod'

const BACKUP_VERSION = 1

export const BACKUP_TABLE_ORDER = [
  'foods',
  'meals',
  'workouts',
  'dailyLogs',
  'profile',
  'settings',
  'exerciseDefinitions',
  'trainingContext',
  'trainingPlans',
] as const

export type BackupTableName = (typeof BACKUP_TABLE_ORDER)[number]

type BackupTables = Pick<BackupPayload, BackupTableName>

export type BackupSelection = Partial<Record<BackupTableName, boolean>>

export const DEFAULT_BACKUP_SELECTION: Record<BackupTableName, boolean> = {
  foods: true,
  meals: true,
  workouts: true,
  dailyLogs: true,
  profile: true,
  settings: true,
  exerciseDefinitions: true,
  trainingContext: true,
  trainingPlans: true,
}

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

const TABLE_NAMES: BackupTableName[] = [...BACKUP_TABLE_ORDER]

export function normalizeBackupSelection(selection?: BackupSelection | null): Record<BackupTableName, boolean> {
  const base = { ...DEFAULT_BACKUP_SELECTION }
  if (!selection) return base

  for (const tableName of TABLE_NAMES) {
    if (Object.prototype.hasOwnProperty.call(selection, tableName)) {
      base[tableName] = Boolean(selection[tableName])
    }
  }

  return base
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

function normalizeBackupRecord(record: unknown): unknown {
  if (record == null || typeof record !== 'object') return record

  const candidate = record as Record<string, unknown>

  if (Array.isArray(candidate.sets) && candidate.exercises == null && candidate.type != null) {
    return {
      ...candidate,
      title: candidate.title ?? 'Workout',
      durationMinutes: Number.isFinite(Number(candidate.durationMinutes)) ? Number(candidate.durationMinutes) : 0,
      caloriesBurned: Number.isFinite(Number(candidate.caloriesBurned)) ? Number(candidate.caloriesBurned) : 0,
      sets: candidate.sets.map((set: unknown) => {
        if (set == null || typeof set !== 'object') return set
        const setCandidate = set as Record<string, unknown>
        return {
          ...setCandidate,
          reps: Number.isFinite(Number(setCandidate.reps)) ? Number(setCandidate.reps) : 0,
          weight: Number.isFinite(Number(setCandidate.weight)) ? Number(setCandidate.weight) : 0,
          weightKg: Number.isFinite(Number(setCandidate.weightKg)) ? Number(setCandidate.weightKg) : Number.isFinite(Number(setCandidate.weight)) ? Number(setCandidate.weight) : 0,
          rpe: setCandidate.rpe == null ? undefined : Number(setCandidate.rpe),
        }
      }),
    }
  }

  if (Array.isArray(candidate.exercises)) {
    return {
      ...candidate,
      startTime: candidate.startTime instanceof Date ? candidate.startTime.toISOString() : candidate.startTime,
      endTime: candidate.endTime instanceof Date ? candidate.endTime.toISOString() : candidate.endTime,
      exercises: candidate.exercises.map((exercise: unknown) => {
        if (exercise == null || typeof exercise !== 'object') return exercise
        const exerciseCandidate = exercise as Record<string, unknown>
        return {
          ...exerciseCandidate,
          sets: Array.isArray(exerciseCandidate.sets) ? exerciseCandidate.sets.map((set: unknown) => {
            if (set == null || typeof set !== 'object') return set
            const setCandidate = set as Record<string, unknown>
            return {
              ...setCandidate,
              weightKg: Number.isFinite(Number(setCandidate.weightKg)) ? Number(setCandidate.weightKg) : 0,
              reps: Number.isFinite(Number(setCandidate.reps)) ? Number(setCandidate.reps) : 0,
              rpe: setCandidate.rpe == null ? undefined : Number(setCandidate.rpe),
            }
          }) : [],
        }
      }),
    }
  }

  return record
}

export async function exportDatabaseToJson(selection?: BackupSelection | null): Promise<BackupPayload> {
  const shouldInclude = normalizeBackupSelection(selection)
  const tablePromiseMap: Record<BackupTableName, Promise<unknown[]>> = {
    foods: db.foods.toArray(),
    meals: db.meals.toArray(),
    workouts: db.workouts.toArray(),
    dailyLogs: db.dailyLogs.toArray(),
    profile: db.profile.toArray(),
    settings: db.settings.toArray(),
    exerciseDefinitions: db.exerciseDefinitions.toArray(),
    trainingContext: db.trainingContext.toArray(),
    trainingPlans: db.trainingPlans.toArray(),
  }

  const resolved = await Promise.all(
    TABLE_NAMES.map(async (tableName) => [tableName, shouldInclude[tableName] ? await tablePromiseMap[tableName] : []] as const),
  )

  const payload = BackupPayloadSchema.parse({
    version: BACKUP_VERSION,
    exportedAt: new Date(),
    foods: (resolved.find(([key]) => key === 'foods')?.[1] ?? []).map(normalizeBackupRecord),
    meals: (resolved.find(([key]) => key === 'meals')?.[1] ?? []).map(normalizeBackupRecord),
    workouts: (resolved.find(([key]) => key === 'workouts')?.[1] ?? []).map(normalizeBackupRecord),
    dailyLogs: (resolved.find(([key]) => key === 'dailyLogs')?.[1] ?? []).map(normalizeBackupRecord),
    profile: (resolved.find(([key]) => key === 'profile')?.[1] ?? []).map(normalizeBackupRecord),
    settings: (resolved.find(([key]) => key === 'settings')?.[1] ?? []).map(normalizeBackupRecord),
    exerciseDefinitions: (resolved.find(([key]) => key === 'exerciseDefinitions')?.[1] ?? []).map(normalizeBackupRecord),
    trainingContext: (resolved.find(([key]) => key === 'trainingContext')?.[1] ?? []).map(normalizeBackupRecord),
    trainingPlans: (resolved.find(([key]) => key === 'trainingPlans')?.[1] ?? []).map(normalizeBackupRecord),
  })

  downloadBackup(payload)
  return payload
}

function normalizeImportedBackupJson(input: unknown): unknown {
  if (!input || typeof input !== 'object') return null

  const payload = input as Record<string, unknown>
  const nextPayload: Record<string, unknown> = { ...payload }

  for (const tableName of ['foods', 'meals', 'workouts', 'dailyLogs', 'profile', 'settings', 'exerciseDefinitions', 'trainingContext', 'trainingPlans'] as const) {
    const value = payload[tableName]
    if (!Array.isArray(value)) {
      nextPayload[tableName] = []
      continue
    }

    nextPayload[tableName] = value.map((entry) => normalizeBackupRecord(entry))
  }

  return nextPayload
}

function emptySummary(): ImportSummary {
  return {
    foods: { added: 0, updated: 0, skipped: 0 },
    meals: { added: 0, updated: 0, skipped: 0 },
    workouts: { added: 0, updated: 0, skipped: 0 },
    dailyLogs: { added: 0, updated: 0, skipped: 0 },
    profile: { added: 0, updated: 0, skipped: 0 },
    settings: { added: 0, updated: 0, skipped: 0 },
    exerciseDefinitions: { added: 0, updated: 0, skipped: 0 },
    trainingContext: { added: 0, updated: 0, skipped: 0 },
    trainingPlans: { added: 0, updated: 0, skipped: 0 },
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
  selection?: BackupSelection | null,
): Promise<ImportDatabaseResult> {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(await file.text())
  } catch {
    return { success: false, error: 'The selected file is not valid JSON.' }
  }

  const validation = BackupPayloadSchema.safeParse(parsedJson)

  if (!validation.success) {
    const normalized = normalizeImportedBackupJson(parsedJson)
    if (!normalized) {
      return {
        success: false,
        error: 'The backup does not match the expected KcalGains format.',
        issues: validation.error.issues,
      }
    }

    const retry = BackupPayloadSchema.safeParse(normalized)
    if (!retry.success) {
      return {
        success: false,
        error: 'The backup does not match the expected KcalGains format.',
        issues: retry.error.issues,
      }
    }

    parsedJson = retry.data
  }

  const payload = BackupPayloadSchema.parse(parsedJson)
  const shouldInclude = normalizeBackupSelection(selection)
  const summary = emptySummary()
  const tables = [db.foods, db.meals, db.workouts, db.dailyLogs, db.profile, db.settings, db.exerciseDefinitions, db.trainingContext, db.trainingPlans]
  const selectedTables = TABLE_NAMES.filter((name) => shouldInclude[name])

  if (selectedTables.length === 0) {
    return { success: false, error: 'Select at least one table to import.' }
  }

  try {
    await db.transaction('rw', tables, async () => {
      for (const [index, name] of TABLE_NAMES.entries()) {
        if (!shouldInclude[name]) continue

        const table = tables[index]
        const incoming = (payload[name] ?? []) as { id: string }[]

        if (mode === 'overwrite') {
          await table.clear()
          if (incoming.length > 0) {
            await (table as any).bulkAdd(incoming)
          }
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

        if (writes.length > 0) await (table as any).bulkPut(writes)
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
      foods: shouldInclude.foods ? payload.foods.length : 0,
      meals: shouldInclude.meals ? payload.meals.length : 0,
      workouts: shouldInclude.workouts ? payload.workouts.length : 0,
      dailyLogs: shouldInclude.dailyLogs ? payload.dailyLogs.length : 0,
      profile: shouldInclude.profile ? payload.profile.length : 0,
      settings: shouldInclude.settings ? payload.settings.length : 0,
      exerciseDefinitions: shouldInclude.exerciseDefinitions ? payload.exerciseDefinitions.length : 0,
      trainingContext: shouldInclude.trainingContext ? payload.trainingContext.length : 0,
      trainingPlans: shouldInclude.trainingPlans ? payload.trainingPlans.length : 0,
    },
  }
}
