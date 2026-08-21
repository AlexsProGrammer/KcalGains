import type { Food } from '@/types'

export type MacroRates = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type MacroTotals = MacroRates

export function macroRatesPerGram(food: Pick<Food, 'calories' | 'protein' | 'carbs' | 'fat'>): MacroRates {
  return {
    calories: food.calories / 100,
    protein: food.protein / 100,
    carbs: food.carbs / 100,
    fat: food.fat / 100,
  }
}

export function calculateFoodMacros(food: Pick<Food, 'calories' | 'protein' | 'carbs' | 'fat'>, grams: number): MacroTotals {
  const rates = macroRatesPerGram(food)
  return {
    calories: rates.calories * grams,
    protein: rates.protein * grams,
    carbs: rates.carbs * grams,
    fat: rates.fat * grams,
  }
}

export function addMacroTotals(left: MacroTotals, right: MacroTotals): MacroTotals {
  return {
    calories: left.calories + right.calories,
    protein: left.protein + right.protein,
    carbs: left.carbs + right.carbs,
    fat: left.fat + right.fat,
  }
}
