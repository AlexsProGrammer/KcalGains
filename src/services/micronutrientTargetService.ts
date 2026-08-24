import type { Food, Profile } from '@/types'
import { normalizeFoodMicros } from '@/schemas/food.schema'

export const MICRONUTRIENT_KEYS = [
  'sodiumMg',
  'potassiumMg',
  'magnesiumMg',
  'calciumMg',
  'zincMg',
  'ironMg',
  'seleniumMcg',
  'vitaminDMcg',
  'vitaminB6Mg',
  'vitaminB12Mcg',
  'vitaminCMg',
] as const

export type MicronutrientKey = (typeof MICRONUTRIENT_KEYS)[number]
export type MicronutrientTotals = Record<MicronutrientKey, number>
export type MicronutrientTargets = Record<MicronutrientKey, number>

const DEFAULT_MALE_TARGETS: MicronutrientTargets = {
  sodiumMg: 2000,
  potassiumMg: 3500,
  magnesiumMg: 350,
  calciumMg: 1000,
  zincMg: 11,
  ironMg: 10,
  seleniumMcg: 55,
  vitaminDMcg: 20,
  vitaminB6Mg: 1.3,
  vitaminB12Mcg: 2.4,
  vitaminCMg: 90,
}

const DEFAULT_FEMALE_TARGETS: MicronutrientTargets = {
  sodiumMg: 2000,
  potassiumMg: 3500,
  magnesiumMg: 300,
  calciumMg: 1000,
  zincMg: 8,
  ironMg: 15,
  seleniumMcg: 55,
  vitaminDMcg: 20,
  vitaminB6Mg: 1.3,
  vitaminB12Mcg: 2.4,
  vitaminCMg: 75,
}

export function createEmptyMicronutrientTotals(): MicronutrientTotals {
  return Object.fromEntries(MICRONUTRIENT_KEYS.map((key) => [key, 0])) as MicronutrientTotals
}

export function mergeMicronutrientTotals(left: Partial<MicronutrientTotals>, right: Partial<MicronutrientTotals>): MicronutrientTotals {
  const next = createEmptyMicronutrientTotals()

  for (const key of MICRONUTRIENT_KEYS) {
    next[key] = (left[key] ?? 0) + (right[key] ?? 0)
  }

  return next
}

export function getMicronutrientValueFromFood(food: Pick<Food, 'micros'> | null | undefined, key: MicronutrientKey): number {
  const source = normalizeFoodMicros(food?.micros as Record<string, unknown> | undefined)
  return source[key] ?? 0
}

export function calculateMealMicrosFromItems(
  items: Array<{ amountInGrams: number; food?: Pick<Food, 'micros'> | null }>,
): MicronutrientTotals {
  const totals = createEmptyMicronutrientTotals()

  for (const item of items) {
    const factor = item.amountInGrams / 100
    const micros = normalizeFoodMicros(item.food?.micros as Record<string, unknown> | undefined)
    for (const key of MICRONUTRIENT_KEYS) {
      totals[key] += (micros[key] ?? 0) * factor
    }
  }

  return totals
}

export function resolveMicronutrientTargets(profile?: Partial<Profile> | null): MicronutrientTargets {
  const sex = profile?.sex ?? 'male'
  const base = sex === 'female' ? DEFAULT_FEMALE_TARGETS : DEFAULT_MALE_TARGETS
  const age = profile?.birthYear ? Math.max(18, new Date().getFullYear() - profile.birthYear) : 35

  if (age >= 65) {
    return {
      ...base,
      vitaminDMcg: Math.max(15, base.vitaminDMcg * 0.8),
      calciumMg: Math.max(800, base.calciumMg * 0.9),
    }
  }

  return base
}

export function getMicronutrientProgress(value: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0
  return Math.min(100, (value / target) * 100)
}
