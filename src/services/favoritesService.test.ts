import { beforeEach, describe, expect, it } from 'vitest'
import { readBalancerTemplateFromSession } from '@/services/favoritesService'

function installSessionStorageMock() {
  const store = new Map<string, string>()

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, String(value))
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
    },
    configurable: true,
  })

  Object.defineProperty(globalThis, 'window', {
    value: { sessionStorage: globalThis.sessionStorage },
    configurable: true,
  })
}

describe('readBalancerTemplateFromSession', () => {
  beforeEach(() => {
    installSessionStorageMock()
  })

  it('reads a meal template with food grams and target meal type', () => {
    globalThis.sessionStorage.setItem(
      'kcalgains.balancerTemplate',
      JSON.stringify({
        targetMealType: 'lunch',
        items: [
          {
            foodId: 'food-1',
            amountInGrams: 180,
            calories: 240,
            protein: 28,
            carbs: 16,
            fat: 9,
          },
        ],
      }),
    )

    expect(readBalancerTemplateFromSession()).toEqual({
      targetMealType: 'lunch',
      items: [
        {
          foodId: 'food-1',
          amountInGrams: 180,
          calories: 240,
          protein: 28,
          carbs: 16,
          fat: 9,
        },
      ],
    })
  })
})
