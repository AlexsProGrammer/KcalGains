import { db } from '@/db'
import { AppSettingsSchema, DEFAULT_APP_SETTINGS, SETTINGS_SINGLETON_ID } from '@/schemas/settings.schema'
import type { AppSettings } from '@/types'

export async function getSettings(): Promise<AppSettings> {
  const stored = await db.settings.get(SETTINGS_SINGLETON_ID)
  const parsed = AppSettingsSchema.safeParse(stored)

  if (parsed.success) {
    return parsed.data
  }

  return {
    ...DEFAULT_APP_SETTINGS,
    ...(stored ?? {}),
    id: SETTINGS_SINGLETON_ID,
  }
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const next = AppSettingsSchema.parse({
    ...DEFAULT_APP_SETTINGS,
    ...current,
    ...updates,
    id: SETTINGS_SINGLETON_ID,
    updatedAt: new Date(),
  })

  await db.settings.put(next)
  return next
}

export async function clearOnboardingState(): Promise<AppSettings> {
  return updateSettings({
    onboardingCompleted: false,
    onboardingDismissed: false,
  })
}
