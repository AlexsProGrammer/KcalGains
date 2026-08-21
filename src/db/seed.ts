import seedFoods from '@/data/seedFoods.json'
import { FoodSchema } from '@/schemas/food.schema'
import type { FitnessTrackerDB } from '@/db/schema'

const SeedFoodsSchema = FoodSchema.array()

export async function seedDatabaseIfEmpty(db: FitnessTrackerDB): Promise<number> {
  const foodCount = await db.foods.count()

  if (foodCount > 0) {
    return 0
  }

  const foods = SeedFoodsSchema.parse(seedFoods)
  await db.foods.bulkAdd(foods)
  return foods.length
}
