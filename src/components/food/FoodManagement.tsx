import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { BarcodeScannerModal } from '@/components/food/BarcodeScannerModal'
import { CustomFoodForm } from '@/components/food/CustomFoodForm'
import { FoodDetailModal } from '@/components/food/FoodDetailModal'
import { FoodSearchInput } from '@/components/food/FoodSearchInput'
import { FoodSearchResults } from '@/components/food/FoodSearchResults'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { deleteFood } from '@/db/foodRepository'
import { useFoodSearch } from '@/hooks/useFoodSearch'
import type { Food } from '@/types'

export function FoodManagement() {
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const search = useFoodSearch(query)

  const localFoods = useLiveQuery(async () => {
    if (!query.trim()) return []
    return db.foods.where('id').anyOf(search.results.map((result) => result.id)).toArray()
  }, [query, search.results], [])

  const hiddenCount = useMemo(() => {
    if (!query.trim()) return 0
    const ids = search.results.map((result) => result.id)
    return Math.max((localFoods?.length ?? 0) - ids.length, 0)
  }, [localFoods, query, search.results])

  async function cacheRemoteFood(food: Food) {
    await search.cacheRemoteFood(food)
    setMessage(`${food.name} was added to the local library.`)
  }

  async function handleDeleteFood(food: Food) {
    await deleteFood(food.id)
    setSelectedFood(null)
    setMessage(`${food.name} was deleted from the local library.`)
  }

  return (
    <>
      <Card>
        <CardHeader title="Food library" />
        <CardContent>
          <FoodSearchInput
            query={query}
            onQueryChange={(value) => { setQuery(value); setMessage(null) }}
            onRemoteSearch={() => void search.searchRemote()}
            onScan={() => setIsScannerOpen(true)}
            isRemoteSearching={search.isRemoteSearching}
          />
          <div className="mt-4">
            {search.isSearching ? <p className="py-4 text-sm text-slate-500">Searching local foods...</p> : null}
            {!search.isSearching && query.trim() ? <FoodSearchResults foods={localFoods ?? []} emptyMessage="No local food matched. Try Open Food Facts." onSelect={setSelectedFood} onDelete={handleDeleteFood} /> : null}
          </div>
          {query.trim() ? <p className="mt-3 text-xs text-slate-500">{hiddenCount} foods hidden by your allergy/profile constraints.</p> : null}
          {search.remoteError ? <Alert className="mt-4" variant="warning">{search.remoteError}</Alert> : null}
          {search.remoteResults.length > 0 ? <div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Open Food Facts results</p><FoodSearchResults foods={search.remoteResults} onSelect={setSelectedFood} onCache={(food) => void cacheRemoteFood(food)} /></div> : null}
          {message ? <Alert className="mt-4" variant="success">{message}</Alert> : null}
          <div className="mt-5 border-t border-slate-800 pt-4">
            {!isCreating ? <button type="button" className="text-sm font-semibold text-accent-text hover:text-accent" onClick={() => setIsCreating(true)}>+ Add custom food</button> : <CustomFoodForm onSaved={(food) => { setIsCreating(false); setSelectedFood(food); setMessage(`${food.name} was added to the local library.`) }} onCancel={() => setIsCreating(false)} />}
          </div>
        </CardContent>
      </Card>
      <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} onSaved={(food) => { setSelectedFood(food); setMessage(`${food.name} was updated.`) }} onDelete={(food) => { void handleDeleteFood(food) }} />
      <BarcodeScannerModal open={isScannerOpen} onClose={() => setIsScannerOpen(false)} onFoodResolved={(food) => { setIsScannerOpen(false); setSelectedFood(food); setMessage(`${food.name} was resolved and cached.`) }} />
    </>
  )
}
