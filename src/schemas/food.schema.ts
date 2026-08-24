import { z } from 'zod'

export const AllergenTagSchema = z.enum(['gluten', 'lactose', 'nuts', 'soy', 'eggs', 'fish', 'fructose'])

const LEGACY_MICRONUTRIENT_ALIASES = {
  sodium: 'sodiumMg',
  potassium: 'potassiumMg',
  magnesium: 'magnesiumMg',
  calcium: 'calciumMg',
  zinc: 'zincMg',
  iron: 'ironMg',
  selenium: 'seleniumMcg',
  vitaminD: 'vitaminDMcg',
  vitaminB6: 'vitaminB6Mg',
  vitaminB12: 'vitaminB12Mcg',
  vitaminC: 'vitaminCMg',
} as const

export function normalizeMicronutrientFieldMap(value: Record<string, unknown> | undefined): Record<string, number | undefined> {
  if (!value) {
    return {}
  }

  const normalized: Record<string, number | undefined> = {}

  for (const [key, rawValue] of Object.entries(value)) {
    const candidate = typeof rawValue === 'number' ? rawValue : Number(rawValue)
    if (Number.isFinite(candidate) && candidate >= 0) {
      normalized[key] = candidate
    }
  }

  for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_MICRONUTRIENT_ALIASES)) {
    const legacyValue = normalized[legacyKey]
    const canonicalValue = normalized[canonicalKey]

    if (legacyValue !== undefined && canonicalValue === undefined) {
      normalized[canonicalKey] = legacyValue
    }
  }

  return normalized
}

export function normalizeFoodMicros(value: Record<string, unknown> | undefined): Partial<Record<keyof typeof LEGACY_MICRONUTRIENT_ALIASES | 'sodiumMg' | 'potassiumMg' | 'magnesiumMg' | 'calciumMg' | 'zincMg' | 'ironMg' | 'seleniumMcg' | 'vitaminDMcg' | 'vitaminB6Mg' | 'vitaminB12Mcg' | 'vitaminCMg', number>> {
  const normalized = normalizeMicronutrientFieldMap(value)

  return {
    sodiumMg: normalized.sodiumMg,
    potassiumMg: normalized.potassiumMg,
    magnesiumMg: normalized.magnesiumMg,
    calciumMg: normalized.calciumMg,
    zincMg: normalized.zincMg,
    ironMg: normalized.ironMg,
    seleniumMcg: normalized.seleniumMcg,
    vitaminDMcg: normalized.vitaminDMcg,
    vitaminB6Mg: normalized.vitaminB6Mg,
    vitaminB12Mcg: normalized.vitaminB12Mcg,
    vitaminCMg: normalized.vitaminCMg,
  }
}

export const MicronutrientSchema = z.object({
  sodiumMg: z.number().nonnegative().optional(),
  potassiumMg: z.number().nonnegative().optional(),
  magnesiumMg: z.number().nonnegative().optional(),
  calciumMg: z.number().nonnegative().optional(),
  zincMg: z.number().nonnegative().optional(),
  ironMg: z.number().nonnegative().optional(),
  seleniumMcg: z.number().nonnegative().optional(),
  vitaminDMcg: z.number().nonnegative().optional(),
  vitaminB6Mg: z.number().nonnegative().optional(),
  vitaminB12Mcg: z.number().nonnegative().optional(),
  vitaminCMg: z.number().nonnegative().optional(),
}).catchall(z.number().nonnegative().optional()).transform((value) => {
  const normalized = normalizeMicronutrientFieldMap(value)
  return {
    sodiumMg: normalized.sodiumMg,
    potassiumMg: normalized.potassiumMg,
    magnesiumMg: normalized.magnesiumMg,
    calciumMg: normalized.calciumMg,
    zincMg: normalized.zincMg,
    ironMg: normalized.ironMg,
    seleniumMcg: normalized.seleniumMcg,
    vitaminDMcg: normalized.vitaminDMcg,
    vitaminB6Mg: normalized.vitaminB6Mg,
    vitaminB12Mcg: normalized.vitaminB12Mcg,
    vitaminCMg: normalized.vitaminCMg,
  }
})

export const FoodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  servingSize: z.number().nonnegative(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().default(0),
  micros: MicronutrientSchema.optional(),
  allergenTags: z.array(AllergenTagSchema).default([]),
  costPer100g: z.number().nonnegative().optional(),
  isCustom: z.boolean(),
  createdAt: z.string().datetime().or(z.string()),
})
