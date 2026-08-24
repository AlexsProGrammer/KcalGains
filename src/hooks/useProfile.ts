import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { db } from '@/db'
import { updateProfile } from '@/db/profileRepository'
import { PROFILE_SINGLETON_ID, ProfileSchema } from '@/schemas/profile.schema'
import type { Profile } from '@/types'

const FALLBACK_PROFILE: Profile = ProfileSchema.parse({
  id: PROFILE_SINGLETON_ID,
  targetCalories: 2000,
  targetMacros: { protein: 150, carbs: 200, fat: 65 },
})

export function useProfile() {
  const stored = useLiveQuery(async () => (await db.profile.get(PROFILE_SINGLETON_ID)) ?? (await db.profile.toCollection().first()), [])

  const profile = useMemo(() => {
    const parsed = ProfileSchema.safeParse(stored)
    return parsed.success ? parsed.data : FALLBACK_PROFILE
  }, [stored])

  const saveProfile = useCallback(async (updates: Partial<Profile>) => updateProfile(updates), [])

  return { profile, isLoading: stored === undefined, saveProfile }
}
