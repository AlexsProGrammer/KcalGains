import { useEffect, useState } from 'react'
import { db } from '@/db'
import { useProfile } from '@/hooks/useProfile'
import { filterFoodsByProfile } from '@/services/foodFilterService'
import { cacheFoodFromOpenFoodFacts, fetchFromOpenFoodFacts, fetchProductByBarcode } from '@/services/openFoodFactsService'
import { initializeSearchIndex, searchFoods, type FoodSearchResult } from '@/services/searchIndexService'
import type { Food } from '@/types'

export function useFoodSearch(query: string, debounceMs = 150) {
  const { profile } = useProfile()
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [isReady, setIsReady] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isRemoteSearching, setIsRemoteSearching] = useState(false)
  const [remoteResults, setRemoteResults] = useState<Food[]>([])
  const [remoteError, setRemoteError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    void initializeSearchIndex().then(() => {
      if (isActive) {
        setIsReady(true)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true
    setIsSearching(true)

    if (!isReady) {
      setResults([])
      setIsSearching(false)
      return () => {
        isActive = false
      }
    }

    const timeout = window.setTimeout(() => {
      if (!isActive) return

      const allResults = searchFoods(query)
      if (allResults.length === 0) {
        setResults([])
        setIsSearching(false)
        return
      }

      void (async () => {
        try {
          const candidateIds = allResults.map((result) => result.id)
          const matchedFoods = await db.foods.where('id').anyOf(candidateIds).toArray()
          const filtered = filterFoodsByProfile(matchedFoods, profile)
          const visibleIds = new Set(filtered.filtered.map((food) => food.id))

          if (isActive) {
            setResults(allResults.filter((result) => visibleIds.has(result.id)))
          }
        } finally {
          if (isActive) {
            setIsSearching(false)
          }
        }
      })()
    }, debounceMs)

    return () => {
      isActive = false
      window.clearTimeout(timeout)
    }
  }, [debounceMs, isReady, profile, query])

  async function searchRemote(searchQuery = query): Promise<Food[]> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setRemoteError('Remote search is unavailable while offline.')
      setRemoteResults([])
      return []
    }

    setIsRemoteSearching(true)
    setRemoteError(null)

    try {
      const normalizedQuery = searchQuery.trim()
      const barcodeMatch = /^\d{8,14}$/.test(normalizedQuery)
      const barcodeFood = barcodeMatch ? await fetchProductByBarcode(normalizedQuery) : undefined
      const foods = barcodeMatch
        ? barcodeFood ? [barcodeFood] : []
        : await fetchFromOpenFoodFacts(normalizedQuery)
      const filtered = filterFoodsByProfile(foods, profile)
      setRemoteResults(filtered.filtered)
      if (filtered.filtered.length === 0) {
        setRemoteError(filtered.hiddenCount > 0 ? `${filtered.hiddenCount} foods were hidden by your current health constraints.` : 'No remote foods matched that query.')
      }
      return filtered.filtered
    } finally {
      setIsRemoteSearching(false)
    }
  }

  async function cacheRemoteFood(food: Food): Promise<Food> {
    const cachedFood = await cacheFoodFromOpenFoodFacts(food)
    setRemoteResults((currentResults) => currentResults.filter((result) => result.id !== food.id))

    const allResults = searchFoods(query)
    const candidateIds = allResults.map((result) => result.id)
    const matchedFoods = candidateIds.length > 0 ? await db.foods.where('id').anyOf(candidateIds).toArray() : []
    const visibleIds = new Set(filterFoodsByProfile(matchedFoods, profile).filtered.map((entry) => entry.id))
    setResults(allResults.filter((result) => visibleIds.has(result.id)))

    return cachedFood
  }

  return {
    cacheRemoteFood,
    isReady,
    isRemoteSearching,
    isSearching,
    remoteError,
    remoteResults,
    results,
    searchRemote,
  }
}
