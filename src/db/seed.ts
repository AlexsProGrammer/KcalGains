import seedFoods from '@/data/seedFoods.json'
import { FoodSchema } from '@/schemas/food.schema'
import type { FitnessTrackerDB } from '@/db/schema'
import { applyDefaultFoodReference } from '@/services/nutrientEnrichmentService'

const SeedFoodsSchema = FoodSchema.array()

export async function seedDatabaseIfEmpty(db: FitnessTrackerDB): Promise<number> {
  const foodCount = await db.foods.count()

  if (foodCount > 0) {
    return 0
  }

  const foods = SeedFoodsSchema.parse(seedFoods).map((food) => applyDefaultFoodReference(food))
  await db.foods.bulkAdd(foods)
  return foods.length
}

export async function hydrateDefaultFoodReferenceIntoDatabase(db: FitnessTrackerDB): Promise<number> {
  const allFoods = await db.foods.toArray()
  let updatedCount = 0

  for (const food of allFoods) {
    const hydratedFood = applyDefaultFoodReference(food)
    if (hydratedFood !== food) {
      await db.foods.put(hydratedFood)
      updatedCount += 1
    }
  }

  return updatedCount
}
