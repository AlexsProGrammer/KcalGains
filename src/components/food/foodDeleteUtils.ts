import type { Food } from '@/types'

export function canDeleteFoodFromLibrary(food: Food): boolean {
  return Boolean(food.isCustom || food.source === 'manual' || food.source === 'openfoodfacts')
}
