import { db } from '@/db'
import { FoodSchema } from '@/schemas/food.schema'
import type { Food } from '@/types'

export type InsertFoodInput = Omit<Food, 'id' | 'createdAt'> & {
  id?: string
  createdAt?: Date | string
}

export async function getAllFoods(): Promise<Food[]> {
  return db.foods.toArray()
}

export async function getFoodById(id: string): Promise<Food | undefined> {
  return db.foods.get(id)
}

export async function getFoodByBarcode(barcode: string): Promise<Food | undefined> {
  return db.foods.where('barcode').equals(barcode).first()
}

export async function createFood(food: InsertFoodInput): Promise<string> {
  const parsedFood = FoodSchema.parse({
    ...food,
    id: food.id ?? crypto.randomUUID(),
    createdAt: food.createdAt ?? new Date(),
  })

  await db.foods.add(parsedFood)
  return parsedFood.id
}

export async function updateFood(id: string, updates: Partial<Food>): Promise<void> {
  const existingFood = await db.foods.get(id)

  if (!existingFood) {
    throw new Error(`Food ${id} was not found.`)
  }

  const updatedFood = FoodSchema.parse({ ...existingFood, ...updates, id })
  await db.foods.put(updatedFood)
}

export async function deleteFood(id: string): Promise<void> {
  await db.foods.delete(id)
}
