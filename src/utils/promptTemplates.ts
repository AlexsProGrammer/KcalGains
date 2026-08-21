import type { PromptContext } from '@/types'

export const AI_MEAL_RESPONSE_CONTRACT = {
  title: 'string',
  description: 'string (optional)',
  items: [{ name: 'string', grams: 'number', calories: 'number', protein: 'number', carbs: 'number', fat: 'number' }],
  totalCalories: 'number',
  totalProtein: 'number',
  totalCarbs: 'number',
  totalFat: 'number',
}

export function buildMealPrompt(context: PromptContext): string {
  const { remainingMacros } = context
  const pantry = context.pantryFoods.length > 0 ? context.pantryFoods.join(', ') : 'No pantry foods specified'
  const preferences = context.dietaryPreferences.length > 0 ? context.dietaryPreferences.join(', ') : 'No special preferences'

  return `You are a nutrition planning assistant. Create one ${context.mealType} meal using at most ${context.maxIngredients} ingredients.

Remaining macro targets:
- Calories: ${remainingMacros.calories}
- Protein: ${remainingMacros.protein} g
- Carbs: ${remainingMacros.carbs} g
- Fat: ${remainingMacros.fat} g

Available pantry foods: ${pantry}
Dietary preferences: ${preferences}

Calculate realistic amounts using 4 kcal/g for protein and carbohydrates and 9 kcal/g for fat. Prefer pantry foods and keep the meal practical.

Respond with ONLY one raw JSON object. Do not use Markdown fences, explanations, comments, or extra keys. Match this structure exactly:
${JSON.stringify(AI_MEAL_RESPONSE_CONTRACT, null, 2)}
`
}
