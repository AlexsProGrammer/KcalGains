import { AiMealResponseSchema } from '@/schemas/aiResponse.schema'
import { FoodSchema } from '@/schemas/food.schema'
import type { AiMealResponse, Food } from '@/types'
import type { FitnessTrackerDB } from '@/db/schema'

export type ParsedAiResponse =
  | { success: true; data: AiMealResponse }
  | { success: false; errors: string[] }

export type LinkedAiFood = {
  item: AiMealResponse['items'][number]
  foodId?: string
  newFood?: Food
}

export function extractJsonFromText(rawText: string): string {
  const withoutFences = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '')
  const start = withoutFences.indexOf('{')
  if (start < 0) throw new Error('No JSON object found in the AI response.')

  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < withoutFences.length; index += 1) {
    const character = withoutFences[index]
    if (escaped) { escaped = false; continue }
    if (character === '\\' && inString) { escaped = true; continue }
    if (character === '"') { inString = !inString; continue }
    if (inString) continue
    if (character === '{') depth += 1
    if (character === '}') {
      depth -= 1
      if (depth === 0) return withoutFences.slice(start, index + 1).replace(/,\s*([}\]])/g, '$1')
    }
  }

  throw new Error('The AI response contains an incomplete JSON object.')
}

export function parseAndValidateAiResponse(rawText: string): ParsedAiResponse {
  try {
    const parsed = JSON.parse(extractJsonFromText(rawText))
    const validation = AiMealResponseSchema.safeParse(parsed)
    if (!validation.success) return { success: false, errors: validation.error.issues.map((issue) => `${issue.path.join('.') || 'response'}: ${issue.message}`) }
    return { success: true, data: validation.data }
  } catch (error) {
    return { success: false, errors: [error instanceof Error ? error.message : 'The AI response could not be parsed.'] }
  }
}

export async function resolveAndLinkFoods(aiMeal: AiMealResponse, database: FitnessTrackerDB): Promise<LinkedAiFood[]> {
  const catalog = await database.foods.toArray()
  return aiMeal.items.map((item) => {
    const normalizedName = item.name.trim().toLocaleLowerCase()
    const existing = catalog.find((food) => food.name.trim().toLocaleLowerCase() === normalizedName)
    if (existing) return { item, foodId: existing.id }

    const newFood = FoodSchema.parse({
      id: `ai-${crypto.randomUUID()}`,
      name: item.name.trim(),
      servingSize: 100,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: 0,
      isCustom: true,
      createdAt: new Date(),
    })
    return { item, foodId: newFood.id, newFood }
  })
}
