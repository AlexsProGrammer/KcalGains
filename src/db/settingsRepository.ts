import { db } from '@/db'
import { AppSettingsSchema, DEFAULT_APP_SETTINGS, SETTINGS_SINGLETON_ID } from '@/schemas/settings.schema'
import type { AppSettings } from '@/types'

export async function getSettings(): Promise<AppSettings> {
  const stored = await db.settings.get(SETTINGS_SINGLETON_ID)
  const parsed = AppSettingsSchema.safeParse(stored)
  return parsed.success ? parsed.data : DEFAULT_APP_SETTINGS
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const next = AppSettingsSchema.parse({ ...current, ...updates, id: SETTINGS_SINGLETON_ID, updatedAt: new Date() })

  await db.settings.put(next)
  return next
}
