import { db } from '@/db'
import { FoodSchema } from '@/schemas/food.schema'
import { initializeSearchIndex } from '@/services/searchIndexService'
import type { Food } from '@/types'

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product'
const USER_AGENT = 'KcalGains - PWA - Version 0.5.1'

type RawProduct = {
  code?: unknown
  product_name?: unknown
  product_name_en?: unknown
  brands?: unknown
  nutriments?: unknown
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function numberValue(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getNutrient(nutriments: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    if (nutriments[key] !== null && nutriments[key] !== undefined) {
      return numberValue(nutriments[key])
    }
  }

  return 0
}

export function parseOpenFoodFactsProduct(rawProduct: unknown, fallbackBarcode?: string): Food | undefined {
  const product = asRecord(rawProduct) as RawProduct
  const nutriments = asRecord(product.nutriments)
  const barcode = textValue(product.code) ?? fallbackBarcode
  const name = textValue(product.product_name) ?? textValue(product.product_name_en)

  if (!name) {
    return undefined
  }

  return FoodSchema.parse({
    id: barcode ? `off-${barcode}` : `off-${crypto.randomUUID()}`,
    name,
    brand: textValue(product.brands),
    barcode,
    servingSize: 100,
    calories: getNutrient(nutriments, 'energy-kcal_100g', 'energy-kcal'),
    protein: getNutrient(nutriments, 'proteins_100g'),
    carbs: getNutrient(nutriments, 'carbohydrates_100g', 'carbohydrates'),
    fat: getNutrient(nutriments, 'fat_100g'),
    fiber: getNutrient(nutriments, 'fiber_100g', 'fiber'),
    micros: {
      sodium: getNutrient(nutriments, 'sodium_100g'),
      potassium: getNutrient(nutriments, 'potassium_100g'),
      magnesium: getNutrient(nutriments, 'magnesium_100g'),
      zinc: getNutrient(nutriments, 'zinc_100g'),
    },
    isCustom: false,
    createdAt: new Date().toISOString(),
  })
}

export async function fetchFromOpenFoodFacts(query: string): Promise<Food[]> {
  const normalizedQuery = query.trim()

  if (!normalizedQuery || typeof navigator !== 'undefined' && !navigator.onLine) {
    return []
  }

  const url = new URL(SEARCH_URL)
  url.search = new URLSearchParams({
    search_terms: normalizedQuery,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
  }).toString()

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      return []
    }

    const payload = asRecord(await response.json())
    const products = Array.isArray(payload.products) ? payload.products : []
    return products.flatMap((product) => {
      const parsed = parseOpenFoodFactsProduct(product)
      return parsed ? [parsed] : []
    })
  } catch {
    return []
  }
}

export async function fetchProductByBarcode(barcode: string): Promise<Food | undefined> {
  const normalizedBarcode = barcode.trim()

  if (!normalizedBarcode || typeof navigator !== 'undefined' && !navigator.onLine) {
    return undefined
  }

  try {
    const response = await fetch(`${PRODUCT_URL}/${encodeURIComponent(normalizedBarcode)}.json`, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      return undefined
    }

    const payload = asRecord(await response.json())
    return parseOpenFoodFactsProduct(payload.product, normalizedBarcode)
  } catch {
    return undefined
  }
}

export async function cacheFoodFromOpenFoodFacts(food: Food): Promise<Food> {
  await initializeSearchIndex()
  await db.foods.put({ ...food, isCustom: false })
  return food
}
