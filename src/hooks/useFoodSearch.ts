import { useEffect, useState } from 'react'
import { initializeSearchIndex, searchFoods, type FoodSearchResult } from '@/services/searchIndexService'

export function useFoodSearch(query: string, debounceMs = 150) {
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [isReady, setIsReady] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

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

  return { isReady, isSearching, results }
}
