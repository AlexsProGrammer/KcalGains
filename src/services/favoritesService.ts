import type { Meal } from '@/types'

export type FavoriteMeal = {
  id: string
  label: string
  mealType: Meal['mealType']
  date: string
  items: Meal['items']
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalMicros: Meal['totalMicros']
  createdAt: string
}

const FAVORITES_KEY = 'kcalgains.favoriteMeals'

export function readFavoriteMeals(): FavoriteMeal[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) as FavoriteMeal[] : []
  } catch {
    return []
  }
}

export function writeFavoriteMeals(meals: FavoriteMeal[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(meals))
}

export function addFavoriteMeal(meal: Meal, label?: string): FavoriteMeal {
  const meals = readFavoriteMeals()
  const favorite: FavoriteMeal = {
    id: crypto.randomUUID(),
    label: label ?? `${meal.mealType} meal`,
    mealType: meal.mealType,
    date: meal.date,
    items: meal.items,
    totalCalories: meal.totalCalories,
    totalProtein: meal.totalProtein,
    totalCarbs: meal.totalCarbs,
    totalFat: meal.totalFat,
    totalMicros: meal.totalMicros,
    createdAt: new Date().toISOString(),
  }

  const next = [favorite, ...meals.filter((entry) => entry.id !== favorite.id)]
  writeFavoriteMeals(next)
  return favorite
}

export function removeFavoriteMeal(id: string) {
  const meals = readFavoriteMeals()
  writeFavoriteMeals(meals.filter((meal) => meal.id !== id))
}

export function useFavoriteMealInBalancer(meal: FavoriteMeal, targetMealType?: Meal['mealType']) {
  if (typeof window === 'undefined') return

  const payload = {
    targetMealType: targetMealType ?? meal.mealType,
    items: meal.items.map((item) => ({
      foodId: item.foodId,
      amountInGrams: item.amountInGrams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    })),
  }

  window.sessionStorage.setItem('kcalgains.balancerTemplate', JSON.stringify(payload))
}

export function readBalancerTemplateFromSession(): { targetMealType: Meal['mealType']; items: Meal['items'] } | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem('kcalgains.balancerTemplate')
    return raw ? JSON.parse(raw) as { targetMealType: Meal['mealType']; items: Meal['items'] } : null
  } catch {
    return null
  }
}

export function loadBalancerTemplateFromSession() {
  return readBalancerTemplateFromSession()
}
