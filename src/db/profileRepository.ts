import { db } from '@/db'
import { PROFILE_SINGLETON_ID, ProfileSchema } from '@/schemas/profile.schema'
import type { Profile } from '@/types'

const FALLBACK_PROFILE: Profile = ProfileSchema.parse({
  id: PROFILE_SINGLETON_ID,
  targetCalories: 2000,
  targetMacros: { protein: 150, carbs: 200, fat: 65 },
})

export async function getProfile(): Promise<Profile> {
  const stored = (await db.profile.get(PROFILE_SINGLETON_ID)) ?? (await db.profile.toCollection().first())
  const parsed = ProfileSchema.safeParse(stored)
  return parsed.success ? parsed.data : FALLBACK_PROFILE
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
  const current = await getProfile()
  const next = ProfileSchema.parse({ ...current, ...updates, id: current.id })

  await db.profile.put(next)
  return next
}
