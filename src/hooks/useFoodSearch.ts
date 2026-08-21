import { useEffect, useState } from 'react'
import { cacheFoodFromOpenFoodFacts, fetchFromOpenFoodFacts, fetchProductByBarcode } from '@/services/openFoodFactsService'
import { initializeSearchIndex, searchFoods, type FoodSearchResult } from '@/services/searchIndexService'
import type { Food } from '@/types'

export function useFoodSearch(query: string, debounceMs = 150) {
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
      if (isActive) {
        setResults(searchFoods(query))
        setIsSearching(false)
      }
    }, debounceMs)

    return () => {
      isActive = false
      window.clearTimeout(timeout)
    }
  }, [debounceMs, isReady, query])

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
      setRemoteResults(foods)
      if (foods.length === 0) {
        setRemoteError('No remote foods matched that query.')
      }
      return foods
    } finally {
      setIsRemoteSearching(false)
    }
  }

  async function cacheRemoteFood(food: Food): Promise<Food> {
    const cachedFood = await cacheFoodFromOpenFoodFacts(food)
    setRemoteResults((currentResults) => currentResults.filter((result) => result.id !== food.id))
    setResults(searchFoods(query))
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
