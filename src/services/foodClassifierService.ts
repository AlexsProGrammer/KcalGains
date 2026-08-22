import type { Food } from '@/types'

export type MacroRole = 'protein' | 'carb' | 'fat' | 'vegetable' | 'mixed'

export type ClassifiedFood = {
  food: Food
  role: MacroRole
  /** Share of energy contributed by each macro, summing to ~1 for foods with calories. */
  energyShare: { protein: number; carbs: number; fat: number }
  caloriesPer100g: number
}

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const

/** Below this energy density a food is treated as a volume filler rather than a macro source. */
const VEGETABLE_MAX_KCAL_PER_100G = 60
const DOMINANT_SHARE = 0.5

function per100g(food: Food, grams: number): number {
  const serving = food.servingSize > 0 ? food.servingSize : 100
  return (grams / serving) * 100
}

export function classifyFood(food: Food): ClassifiedFood {
  const protein = per100g(food, food.protein)
  const carbs = per100g(food, food.carbs)
  const fat = per100g(food, food.fat)
  const caloriesPer100g = per100g(food, food.calories)

  const proteinKcal = protein * KCAL_PER_GRAM.protein
  const carbKcal = carbs * KCAL_PER_GRAM.carbs
  const fatKcal = fat * KCAL_PER_GRAM.fat
  const totalKcal = proteinKcal + carbKcal + fatKcal

  const energyShare =
    totalKcal > 0
      ? { protein: proteinKcal / totalKcal, carbs: carbKcal / totalKcal, fat: fatKcal / totalKcal }
      : { protein: 0, carbs: 0, fat: 0 }

  return { food, role: resolveRole(energyShare, caloriesPer100g), energyShare, caloriesPer100g }
}

function resolveRole(
  energyShare: ClassifiedFood['energyShare'],
  caloriesPer100g: number,
): MacroRole {
  if (caloriesPer100g > 0 && caloriesPer100g <= VEGETABLE_MAX_KCAL_PER_100G) return 'vegetable'

  const entries = [
    ['protein', energyShare.protein],
    ['carb', energyShare.carbs],
    ['fat', energyShare.fat],
  ] as const

  const [role, share] = entries.reduce((best, current) => (current[1] > best[1] ? current : best))
  return share >= DOMINANT_SHARE ? role : 'mixed'
}

export function classifyFoods(foods: Food[]): ClassifiedFood[] {
  return foods.map(classifyFood)
}

export function groupByRole(foods: Food[]): Record<MacroRole, ClassifiedFood[]> {
  const groups: Record<MacroRole, ClassifiedFood[]> = {
    protein: [],
    carb: [],
    fat: [],
    vegetable: [],
    mixed: [],
  }

  for (const classified of classifyFoods(foods)) {
    groups[classified.role].push(classified)
  }

  return groups
}
