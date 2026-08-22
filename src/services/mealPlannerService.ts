import { autoBalanceMeal, macroDeviationMagnitude } from '@/services/lpSolverService'
import { groupByRole, type ClassifiedFood, type MacroRole } from '@/services/foodClassifierService'
import type { BalancerInput, BalancerResult, MacroTarget } from '@/types/balancer.types'
import type { Food, Meal } from '@/types'

export type MealType = Meal['mealType']

export type MealTargets = Pick<MacroTarget, 'calories' | 'protein' | 'carbs' | 'fat'>

export type PlannedMeal = {
  mealType: MealType
  foods: Food[]
  result: BalancerResult
  targets: MealTargets
  score: number
}

export type PlanDayResult = {
  meals: PlannedMeal[]
  totals: MealTargets
  unplanned: MealType[]
}

/** Fraction of the daily target allocated to each meal; keys must sum to 1. */
export const MEAL_SPLIT: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
}

const MEAL_TEMPLATES: Record<MealType, MacroRole[]> = {
  breakfast: ['protein', 'carb', 'fat'],
  lunch: ['protein', 'carb', 'vegetable', 'fat'],
  dinner: ['protein', 'carb', 'vegetable', 'fat'],
  snack: ['protein', 'carb'],
}

const MAX_INGREDIENTS = 5
const CANDIDATES_PER_TEMPLATE = 6

export function splitTargetsForMeal(daily: MealTargets, mealType: MealType): MealTargets {
  const share = MEAL_SPLIT[mealType]
  return {
    calories: Math.round(daily.calories * share),
    protein: Math.round(daily.protein * share),
    carbs: Math.round(daily.carbs * share),
    fat: Math.round(daily.fat * share),
  }
}

function pickRandom<T>(items: T[], count: number, random: () => number): T[] {
  const pool = [...items]
  const picked: T[] = []

  while (pool.length > 0 && picked.length < count) {
    picked.push(...pool.splice(Math.floor(random() * pool.length), 1))
  }

  return picked
}

function buildCandidateFoods(
  groups: Record<MacroRole, ClassifiedFood[]>,
  template: MacroRole[],
  random: () => number,
): Food[] {
  const selected: Food[] = []
  const seen = new Set<string>()

  for (const role of template) {
    const available = groups[role].filter((entry) => !seen.has(entry.food.id))
    if (available.length === 0) continue

    const [chosen] = pickRandom(available, 1, random)
    seen.add(chosen.food.id)
    selected.push(chosen.food)
  }

  if (selected.length < 2) {
    const fallback = groups.mixed.filter((entry) => !seen.has(entry.food.id))
    for (const entry of pickRandom(fallback, 2 - selected.length, random)) {
      seen.add(entry.food.id)
      selected.push(entry.food)
    }
  }

  return selected.slice(0, MAX_INGREDIENTS)
}

function balanceCandidate(foods: Food[], targets: MealTargets): BalancerResult | null {
  if (foods.length === 0) return null

  const input: BalancerInput = {
    targets: { ...targets, priority: 'balanced' },
    ingredients: foods.map((food) => ({ foodId: food.id, minGrams: 0, maxGrams: 400 })),
  }

  const catalog = new Map(foods.map((food) => [food.id, food]))
  return autoBalanceMeal(input, catalog)
}

export function suggestMeal(
  foods: Food[],
  dailyTargets: MealTargets,
  mealType: MealType,
  random: () => number = Math.random,
): PlannedMeal | null {
  if (foods.length < 2) return null

  const groups = groupByRole(foods)
  const targets = splitTargetsForMeal(dailyTargets, mealType)
  const template = MEAL_TEMPLATES[mealType]

  let best: PlannedMeal | null = null

  for (let attempt = 0; attempt < CANDIDATES_PER_TEMPLATE; attempt += 1) {
    const candidate = buildCandidateFoods(groups, template, random)
    const result = balanceCandidate(candidate, targets)
    if (!result || result.status === 'infeasible') continue

    const score = macroDeviationMagnitude(result)
    if (!best || score < best.score) {
      best = { mealType, foods: candidate, result, targets, score }
    }
  }

  return best
}

export function planDay(
  foods: Food[],
  dailyTargets: MealTargets,
  mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'],
  random: () => number = Math.random,
): PlanDayResult {
  const meals: PlannedMeal[] = []
  const unplanned: MealType[] = []

  for (const mealType of mealTypes) {
    const planned = suggestMeal(foods, dailyTargets, mealType, random)
    if (planned) meals.push(planned)
    else unplanned.push(mealType)
  }

  const totals = meals.reduce<MealTargets>(
    (sum, meal) => ({
      calories: sum.calories + meal.result.totalMacros.calories,
      protein: sum.protein + meal.result.totalMacros.protein,
      carbs: sum.carbs + meal.result.totalMacros.carbs,
      fat: sum.fat + meal.result.totalMacros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return { meals, totals, unplanned }
}
