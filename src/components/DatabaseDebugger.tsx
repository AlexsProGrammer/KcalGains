import { db } from '@/db'
import { exportDatabaseToJson, importDatabaseFromJson } from '@/services/backupService'
import type { Food, Meal } from '@/types'

export async function runBackupRoundTripCheck(): Promise<boolean> {
  await Promise.all([
    db.foods.clear(),
    db.meals.clear(),
    db.workouts.clear(),
    db.dailyLogs.clear(),
    db.profile.clear(),
  ])

  const foods: Food[] = Array.from({ length: 10 }, (_, index) => ({
    id: `backup-check-food-${index + 1}`,
    name: `Backup check food ${index + 1}`,
    servingSize: 100,
    calories: 100 + index,
    protein: 10,
    carbs: 10,
    fat: 5,
    isCustom: true,
    createdAt: new Date(),
  }))
  const meals: Meal[] = [1, 2].map((index) => ({
    id: `backup-check-meal-${index}`,
    date: '2026-08-21',
    mealType: index === 1 ? 'breakfast' : 'lunch',
    items: [{
      foodId: foods[index - 1].id,
      amountInGrams: 100,
      calories: foods[index - 1].calories,
      protein: foods[index - 1].protein,
      carbs: foods[index - 1].carbs,
      fat: foods[index - 1].fat,
    }],
    totalCalories: foods[index - 1].calories,
    totalProtein: foods[index - 1].protein,
    totalCarbs: foods[index - 1].carbs,
    totalFat: foods[index - 1].fat,
  }))

  await db.foods.bulkAdd(foods)
  await db.meals.bulkAdd(meals)

  const payload = await exportDatabaseToJson()
  await Promise.all([
    db.foods.clear(),
    db.meals.clear(),
    db.workouts.clear(),
    db.dailyLogs.clear(),
    db.profile.clear(),
  ])

  const result = await importDatabaseFromJson(new File([JSON.stringify(payload)], 'backup-check.json', { type: 'application/json' }))

  if (!result.success) {
    return false
  }

  const [foodCount, mealCount] = await Promise.all([db.foods.count(), db.meals.count()])
  return foodCount === 10 && mealCount === 2 && result.counts.foods === 10 && result.counts.meals === 2
}