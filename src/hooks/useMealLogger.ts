import { db } from '@/db'
import { MealSchema } from '@/schemas/meal.schema'
import type { BalancerResult } from '@/types/balancer.types'
import type { Meal } from '@/types'

export type MealType = Meal['mealType']

export async function commitBalancedMealToLog(
  result: BalancerResult,
  mealType: MealType,
  date: string,
): Promise<Meal> {
  const meal = MealSchema.parse({
    id: crypto.randomUUID(),
    date,
    mealType,
    items: result.solution
      .filter((item) => item.grams > 0)
      .map((item) => ({
        foodId: item.foodId,
        amountInGrams: item.grams,
        calories: item.computedCalories,
        protein: item.computedProtein,
        carbs: item.computedCarbs,
        fat: item.computedFat,
      })),
    totalCalories: result.totalMacros.calories,
    totalProtein: result.totalMacros.protein,
    totalCarbs: result.totalMacros.carbs,
    totalFat: result.totalMacros.fat,
  })

  await db.transaction('rw', db.meals, async () => {
    await db.meals.add(meal)
  })

  return meal
}

export function useMealLogger() {
  return { commitBalancedMealToLog }
}
