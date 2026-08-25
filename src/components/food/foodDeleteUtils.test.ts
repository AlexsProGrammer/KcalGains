import { describe, expect, it } from 'vitest'
import { canDeleteFoodFromLibrary } from '@/components/food/foodDeleteUtils'
import type { Food } from '@/types'

describe('canDeleteFoodFromLibrary', () => {
  it('allows deletion for locally created foods', () => {
    const food: Food = {
      id: 'custom-1',
      name: 'My oats',
      servingSize: 100,
      calories: 400,
      protein: 15,
      carbs: 60,
      fat: 8,
      fiber: 5,
      allergenTags: [],
      isCustom: true,
      source: 'manual',
      createdAt: new Date().toISOString(),
    }

    expect(canDeleteFoodFromLibrary(food)).toBe(true)
  })

  it('allows deletion for cached Open Food Facts foods in the library', () => {
    const food: Food = {
      id: 'off-1234567890',
      name: 'Haferflocken',
      servingSize: 100,
      calories: 372,
      protein: 13.5,
      carbs: 58.7,
      fat: 7,
      fiber: 10,
      allergenTags: ['gluten'],
      isCustom: false,
      source: 'openfoodfacts',
      createdAt: new Date().toISOString(),
    }

    expect(canDeleteFoodFromLibrary(food)).toBe(true)
  })

  it('blocks deletion for unpersisted remote results', () => {
    const food: Food = {
      id: 'external-999',
      name: 'Example food',
      servingSize: 100,
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 10,
      fiber: 0,
      allergenTags: [],
      isCustom: false,
      createdAt: new Date().toISOString(),
    }

    expect(canDeleteFoodFromLibrary(food)).toBe(false)
  })
})
