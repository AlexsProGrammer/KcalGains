import defaultFoodReferenceData from '@/data/defaultFoodReference.json'
import type { AllergenTag, Food, Micronutrients } from '@/types'

type MicronutrientKey = keyof NonNullable<Food['micros']>

type MicronutrientRecord = {
  sodiumMg?: number
  potassiumMg?: number
  magnesiumMg?: number
  calciumMg?: number
  zincMg?: number
  ironMg?: number
  seleniumMcg?: number
  vitaminDMcg?: number
  vitaminB6Mg?: number
  vitaminB12Mcg?: number
  vitaminCMg?: number
}

type NutrientReferenceEntry = {
  name: string
  aliases?: string[]
  micros: MicronutrientRecord
  allergenTags?: AllergenTag[]
  costPer100g?: number
  price?: number
  currency?: string
  source?: string
  notes?: string
}

const nutrientReference = defaultFoodReferenceData as NutrientReferenceEntry[]

function finalizeMicronutrients(value: Partial<Record<MicronutrientKey, number>> | undefined): Micronutrients | undefined {
  if (!value) {
    return undefined
  }

  const normalized = {
    sodiumMg: value.sodiumMg,
    potassiumMg: value.potassiumMg,
    magnesiumMg: value.magnesiumMg,
    calciumMg: value.calciumMg,
    zincMg: value.zincMg,
    ironMg: value.ironMg,
    seleniumMcg: value.seleniumMcg,
    vitaminDMcg: value.vitaminDMcg,
    vitaminB6Mg: value.vitaminB6Mg,
    vitaminB12Mcg: value.vitaminB12Mcg,
    vitaminCMg: value.vitaminCMg,
  } as Partial<Micronutrients>

  return Object.values(normalized).some((entry) => entry !== undefined) ? (normalized as Micronutrients) : undefined
}

function normalizeFoodName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildTokenSet(value: string): Set<string> {
  return new Set(normalizeFoodName(value).split(' ').filter(Boolean))
}

function scoreMatch(input: string, candidate: string): number {
  const inputTokens = buildTokenSet(input)
  const candidateTokens = buildTokenSet(candidate)

  if (inputTokens.size === 0 || candidateTokens.size === 0) {
    return 0
  }

  let score = 0

  for (const token of inputTokens) {
    if (candidateTokens.has(token)) {
      score += 3
    } else if (candidate.includes(token)) {
      score += 1
    }
  }

  if (normalizeFoodName(input) === normalizeFoodName(candidate)) {
    score += 10
  }

  if (normalizeFoodName(input).includes(normalizeFoodName(candidate)) || normalizeFoodName(candidate).includes(normalizeFoodName(input))) {
    score += 4
  }

  return score
}

export function findBestMicronutrientMatch(foodName: string): NutrientReferenceEntry | undefined {
  const normalizedInput = normalizeFoodName(foodName)

  if (!normalizedInput) {
    return undefined
  }

  let bestEntry: NutrientReferenceEntry | undefined
  let bestScore = 0

  for (const entry of nutrientReference) {
    const candidateNames = [entry.name, ...(entry.aliases ?? [])]
    let candidateBestScore = 0

    for (const candidateName of candidateNames) {
      const score = scoreMatch(normalizedInput, candidateName)
      if (score > candidateBestScore) {
        candidateBestScore = score
      }
    }

    if (candidateBestScore > bestScore) {
      bestScore = candidateBestScore
      bestEntry = entry
    }
  }

  return bestScore >= 2 ? bestEntry : undefined
}

export function mergeMicronutrients(
  existing: Micronutrients | undefined,
  fallback: Partial<Micronutrients> | undefined,
): Micronutrients | undefined {
  if (!existing && !fallback) {
    return undefined
  }

  const merged = { ...(existing ?? {}) } as Partial<Micronutrients>

  for (const [key, value] of Object.entries(fallback ?? {})) {
    const micronutrientKey = key as MicronutrientKey
    const currentValue = merged[micronutrientKey]
    if (currentValue === undefined && value !== undefined) {
      merged[micronutrientKey] = value
    }
  }

  return finalizeMicronutrients(merged as Partial<Record<MicronutrientKey, number>>)
}

export function applyDefaultFoodReference(food: Food): Food {
  const match = findBestMicronutrientMatch(food.name)

  if (!match) {
    return food
  }

  const defaultMetadata = {
    allergenTags: match.allergenTags ?? [],
    costPer100g: match.costPer100g,
    price: match.price,
    currency: match.currency ?? 'EUR',
    source: match.source ?? 'default-food-reference',
    notes: match.notes,
  }

  const allergenTags = food.allergenTags && food.allergenTags.length > 0
    ? food.allergenTags
    : defaultMetadata.allergenTags

  return {
    ...food,
    allergenTags,
    costPer100g: food.costPer100g ?? defaultMetadata.costPer100g,
    price: food.price ?? defaultMetadata.price,
    currency: food.currency ?? defaultMetadata.currency ?? 'EUR',
    source: food.source ?? defaultMetadata.source ?? 'default-food-reference',
    notes: food.notes ?? defaultMetadata.notes,
    micros: mergeMicronutrients(food.micros, match.micros),
  }
}

export function enrichFoodMicros(food: Food): Food {
  const currentMicros = food.micros

  if (!currentMicros) {
    const match = findBestMicronutrientMatch(food.name)
    if (!match) {
      return food
    }

    const normalizedMicros = finalizeMicronutrients(match.micros as Partial<Record<MicronutrientKey, number>>)
    return applyDefaultFoodReference({ ...food, micros: normalizedMicros ?? undefined })
  }

  const match = findBestMicronutrientMatch(food.name)
  if (!match) {
    return food
  }

  return applyDefaultFoodReference({
    ...food,
    micros: mergeMicronutrients(currentMicros, match.micros),
  })
}
