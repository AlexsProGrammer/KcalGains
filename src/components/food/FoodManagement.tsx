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
import { useT } from '@/i18n'
import type { Food } from '@/types'

export function FoodManagement() {
  const { t } = useT()
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
    setMessage(t.food.saved.replace('{name}', food.name))
  }

  async function handleDeleteFood(food: Food) {
    await deleteFood(food.id)
    setSelectedFood(null)
    setMessage(t.food.deleted.replace('{name}', food.name))
  }

  return (
    <>
      <Card>
        <CardHeader title={t.food.library} />
        <CardContent>
          <FoodSearchInput
            query={query}
            onQueryChange={(value) => { setQuery(value); setMessage(null) }}
            onRemoteSearch={() => void search.searchRemote()}
            onScan={() => setIsScannerOpen(true)}
            isRemoteSearching={search.isRemoteSearching}
          />
          <div className="mt-4">
            {search.isSearching ? <p className="py-4 text-sm text-slate-500">{t.common.searchingLocal}</p> : null}
            {!search.isSearching && query.trim() ? <FoodSearchResults foods={localFoods ?? []} emptyMessage={t.food.noResults} onSelect={setSelectedFood} onDelete={handleDeleteFood} /> : null}
          </div>
          {query.trim() ? <p className="mt-3 text-xs text-slate-500">{t.food.hiddenCount.replace('{count}', String(hiddenCount))}</p> : null}
          {search.remoteError ? <Alert className="mt-4" variant="warning">{search.remoteError}</Alert> : null}
          {search.remoteResults.length > 0 ? <div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.food.resultsTitle}</p><FoodSearchResults foods={search.remoteResults} onSelect={setSelectedFood} onCache={(food) => void cacheRemoteFood(food)} /></div> : null}
          {message ? <Alert className="mt-4" variant="success">{message}</Alert> : null}
          <div className="mt-5 border-t border-slate-800 pt-4">
            {!isCreating ? <button type="button" className="text-sm font-semibold text-accent-text hover:text-accent" onClick={() => setIsCreating(true)}>+ {t.common.addCustomFood}</button> : <CustomFoodForm onSaved={(food) => { setIsCreating(false); setSelectedFood(food); setMessage(t.food.saved.replace('{name}', food.name)) }} onCancel={() => setIsCreating(false)} />}
          </div>
        </CardContent>
      </Card>
      <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} onSaved={(food) => { setSelectedFood(food); setMessage(t.food.updated.replace('{name}', food.name)) }} onDelete={(food) => { void handleDeleteFood(food) }} />
      <BarcodeScannerModal open={isScannerOpen} onClose={() => setIsScannerOpen(false)} onFoodResolved={(food) => { setIsScannerOpen(false); setSelectedFood(food); setMessage(t.food.resolved.replace('{name}', food.name)) }} />
    </>
  )
}
