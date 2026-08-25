import { describe, expect, it } from 'vitest'
import { mergePlannedMeals, type PlannedMeal } from '@/services/mealPlannerService'

function makeMeal(mealType: PlannedMeal['mealType'], calories: number, locked = false): PlannedMeal {
  return {
    mealType,
    foods: [],
    result: {
      status: 'feasible',
      totalCost: 0,
      totalMacros: {
        calories,
        protein: 10,
        carbs: 12,
        fat: 8,
      },
      solution: [],
      deviation: {
        deltaCalories: 0,
        deltaProtein: 0,
        deltaCarbs: 0,
        deltaFat: 0,
      },
    },
    targets: {
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 15,
    },
    score: 1,
    locked,
  }
}

describe('mergePlannedMeals', () => {
  it('keeps locked meals stable while regenerating unlocked entries', () => {
    const current = [makeMeal('breakfast', 250, true), makeMeal('lunch', 300, false)]
    const next = [makeMeal('breakfast', 180, false), makeMeal('lunch', 420, false)]

    const merged = mergePlannedMeals(current, next)

    expect(merged[0].result.totalMacros.calories).toBe(250)
    expect(merged[1].result.totalMacros.calories).toBe(420)
    expect(merged[0].locked).toBe(true)
    expect(merged[1].locked).toBe(false)
  })
})
