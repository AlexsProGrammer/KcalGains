import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { db } from '@/db'
import { getSettings, updateSettings } from '@/db/settingsRepository'
import { AppSettingsSchema, DEFAULT_APP_SETTINGS, SETTINGS_SINGLETON_ID } from '@/schemas/settings.schema'
import type { AppSettings } from '@/types'

export function useSettings() {
  const stored = useLiveQuery(() => db.settings.get(SETTINGS_SINGLETON_ID), [])

  const settings = useMemo(() => {
    const parsed = AppSettingsSchema.safeParse(stored)
    return parsed.success ? parsed.data : DEFAULT_APP_SETTINGS
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
