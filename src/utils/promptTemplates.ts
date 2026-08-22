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

Respond with exactly one \`\`\`json fenced code block and nothing else — no prose before or after it, no comments, no extra keys. Match this structure exactly:

\`\`\`json
${JSON.stringify(AI_MEAL_RESPONSE_CONTRACT, null, 2)}
\`\`\`
`
}

export const AI_BACKUP_PAYLOAD_CONTRACT = {
  version: 1,
  exportedAt: 'string (ISO 8601 datetime)',
  foods: [
    {
      id: 'string (stable unique id, reuse the same id for the same food)',
      name: 'string',
      servingSize: 'number (grams the macros below refer to, usually 100)',
      calories: 'number',
      protein: 'number',
      carbs: 'number',
      fat: 'number',
      fiber: 'number',
      isCustom: 'boolean',
      createdAt: 'string (ISO 8601 datetime)',
    },
  ],
  meals: [
    {
      id: 'string',
      date: 'string (YYYY-MM-DD)',
      mealType: 'breakfast | lunch | dinner | snack',
      items: [
        {
          foodId: 'string (must match an id in foods)',
          amountInGrams: 'number (greater than 0)',
          calories: 'number',
          protein: 'number',
          carbs: 'number',
          fat: 'number',
        },
      ],
      totalCalories: 'number',
      totalProtein: 'number',
      totalCarbs: 'number',
      totalFat: 'number',
    },
  ],
  workouts: '[] (leave empty unless workouts are described)',
  dailyLogs: '[] (leave empty)',
  profile: '[] (leave empty)',
}

export function buildBackupImportPrompt(sourceText: string): string {
  const notes = sourceText.trim() || '(paste your tracked meals or chat transcript here)'

  return `You are a data conversion assistant. Convert the food log below into a single KcalGains backup JSON document.

Source log:
"""
${notes}
"""

Rules:
- Create one entry in "foods" per distinct ingredient, with macros per "servingSize" grams (use 100 unless the log states otherwise).
- Reuse the same food "id" whenever the same ingredient appears again; never duplicate a food.
- Every meal item's "foodId" must match an id present in "foods".
- Scale each item's calories, protein, carbs and fat to its "amountInGrams".
- Each meal's totals must equal the sum of its items, rounded to one decimal.
- Use 4 kcal/g for protein and carbohydrates and 9 kcal/g for fat.
- Estimate reasonable values for anything the log leaves out, and omit entries you cannot estimate.
- Use ISO 8601 for "exportedAt" and "createdAt", and YYYY-MM-DD for meal dates.

Respond with exactly one \`\`\`json fenced code block and nothing else — no prose before or after it, no comments, no extra keys. Match this structure exactly:

\`\`\`json
${JSON.stringify(AI_BACKUP_PAYLOAD_CONTRACT, null, 2)}
\`\`\`
`
}
