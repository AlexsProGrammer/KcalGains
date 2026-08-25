import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { db } from '@/db'
import { getSettings, updateSettings } from '@/db/settingsRepository'
import { AppSettingsSchema, DEFAULT_APP_SETTINGS, SETTINGS_SINGLETON_ID } from '@/schemas/settings.schema'
import type { AppSettings } from '@/types'

export function useSettings() {
  const stored = useLiveQuery(() => db.settings.get(SETTINGS_SINGLETON_ID), [])
  const hasBootstrapped = useRef(false)

  useEffect(() => {
    if (hasBootstrapped.current) {
      return
    }

    hasBootstrapped.current = true

    void (async () => {
      const existing = await db.settings.get(SETTINGS_SINGLETON_ID)
      if (!existing) {
        await db.settings.put(DEFAULT_APP_SETTINGS)
        return
      }

      const parsed = AppSettingsSchema.safeParse(existing)
      if (!parsed.success) {
        await db.settings.put(
          AppSettingsSchema.parse({
            ...DEFAULT_APP_SETTINGS,
            ...existing,
            id: SETTINGS_SINGLETON_ID,
            updatedAt: new Date(),
          }),
        )
      }
    })()
  }, [])

  const settings = useMemo(() => {
    if (stored === undefined) {
      return DEFAULT_APP_SETTINGS
    }

    const parsed = AppSettingsSchema.safeParse(stored)
    if (parsed.success) {
      return parsed.data
    }

    return AppSettingsSchema.parse({
      ...DEFAULT_APP_SETTINGS,
      ...stored,
      id: SETTINGS_SINGLETON_ID,
      updatedAt: new Date(),
    })
  }, [stored])

  const setSetting = useCallback(async <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    await updateSettings({ [key]: value } as Partial<AppSettings>)
  }, [])

  return {
    settings,
    isLoading: stored === undefined && !AppSettingsSchema.safeParse(stored).success,
    setSetting,
    updateSettings,
    getSettings,
  }
}
