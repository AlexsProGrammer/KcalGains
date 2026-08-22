import MiniSearch from 'minisearch'
import { db } from '@/db'
import type { Food } from '@/types'

export type FoodSearchResult = Pick<Food, 'id' | 'name' | 'brand' | 'calories' | 'protein' | 'carbs' | 'fat'> & {
  score: number
}

type SearchDocument = FoodSearchResult

const searchIndex = new MiniSearch<SearchDocument>({
  fields: ['name', 'brand'],
  storeFields: ['id', 'name', 'brand', 'calories', 'protein', 'carbs', 'fat'],
})

let isInitialized = false

function toSearchDocument(food: Food): SearchDocument {
  return {
    id: food.id,
    name: food.name,
    brand: food.brand,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    score: 0,
  }
}

export async function initializeSearchIndex(): Promise<void> {
  if (isInitialized) {
    return
  }

  const foods = await db.foods.toArray()
  searchIndex.removeAll()
  searchIndex.addAll(foods.map(toSearchDocument))

  db.foods.hook('creating', (_primaryKey, food) => {
    if (!searchIndex.has(food.id)) {
      searchIndex.add(toSearchDocument(food))
    }
  })
  db.foods.hook('updating', (changes, primaryKey, food) => {
    searchIndex.discard(String(primaryKey))
    searchIndex.add(toSearchDocument({ ...food, ...changes } as Food))
  })
  db.foods.hook('deleting', (primaryKey) => {
    searchIndex.discard(String(primaryKey))
  })

  isInitialized = true
}

export function searchFoods(query: string): FoodSearchResult[] {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return []
  }

  return searchIndex.search(normalizedQuery, {
    prefix: true,
    fuzzy: 0.2,
  }) as unknown as FoodSearchResult[]
}
