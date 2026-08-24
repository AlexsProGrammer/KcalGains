import type { Food, Profile } from '@/types'

export type FoodFilterResult<T extends Food = Food> = {
  filtered: T[]
  hiddenCount: number
}

export function filterFoodsByProfile<T extends Food>(foods: T[], profile?: Partial<Profile> | null): FoodFilterResult<T> {
  const allergens = new Set(profile?.allergens ?? [])
  const dietaryPattern = profile?.dietaryPattern ?? 'standard'

  const filtered = foods.filter((food) => {
    const hasAllergenConflict = (food.allergenTags ?? []).some((tag) => allergens.has(tag))
    if (hasAllergenConflict) return false

    switch (dietaryPattern) {
      case 'ketogenic':
        return (food.carbs ?? 0) <= 8
      case 'diabetic_friendly':
        return (food.carbs ?? 0) <= 25 && !food.allergenTags.includes('fructose') && !food.allergenTags.includes('lactose')
      case 'low_fodmap':
        return !food.allergenTags.includes('fructose') && !food.allergenTags.includes('lactose') && !food.allergenTags.includes('gluten')
      default:
        return true
    }
  })

  return {
    filtered,
    hiddenCount: Math.max(foods.length - filtered.length, 0),
  }
}
