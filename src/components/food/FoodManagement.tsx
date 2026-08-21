import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { BarcodeScannerModal } from '@/components/food/BarcodeScannerModal'
import { CustomFoodForm } from '@/components/food/CustomFoodForm'
import { FoodDetailModal } from '@/components/food/FoodDetailModal'
import { FoodSearchInput } from '@/components/food/FoodSearchInput'
import { FoodSearchResults } from '@/components/food/FoodSearchResults'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
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

  async function cacheRemoteFood(food: Food) {
    await search.cacheRemoteFood(food)
    setMessage(`${food.name} was added to the local library.`)
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
            {!search.isSearching && query.trim() ? <FoodSearchResults foods={localFoods ?? []} emptyMessage="No local food matched. Try Open Food Facts." onSelect={setSelectedFood} /> : null}
          </div>
          {search.remoteError ? <Alert className="mt-4" variant="warning">{search.remoteError}</Alert> : null}
          {search.remoteResults.length > 0 ? <div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Open Food Facts results</p><FoodSearchResults foods={search.remoteResults} onSelect={setSelectedFood} onCache={(food) => void cacheRemoteFood(food)} /></div> : null}
          {message ? <Alert className="mt-4" variant="success">{message}</Alert> : null}
          <div className="mt-5 border-t border-slate-800 pt-4">
            {!isCreating ? <button type="button" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300" onClick={() => setIsCreating(true)}>+ Add custom food</button> : <CustomFoodForm onSaved={(food) => { setIsCreating(false); setSelectedFood(food); setMessage(`${food.name} was added to the local library.`) }} onCancel={() => setIsCreating(false)} />}
          </div>
        </CardContent>
      </Card>
      <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} onSaved={(food) => { setSelectedFood(food); setMessage(`${food.name} was updated.`) }} />
      <BarcodeScannerModal open={isScannerOpen} onClose={() => setIsScannerOpen(false)} onFoodResolved={(food) => { setIsScannerOpen(false); setSelectedFood(food); setMessage(`${food.name} was resolved and cached.`) }} />
    </>
  )
}
