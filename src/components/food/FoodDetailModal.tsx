import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CustomFoodForm } from '@/components/food/CustomFoodForm'
import { useT } from '@/i18n'
import type { Food } from '@/types'

type FoodDetailModalProps = {
  food: Food | null
  onClose: () => void
  onSaved: (food: Food) => void
  onDelete?: (food: Food) => void
}

export function FoodDetailModal({ food, onClose, onSaved, onDelete }: FoodDetailModalProps) {
  const { t } = useT()
  const [grams, setGrams] = useState(100)
  const [isEditing, setIsEditing] = useState(false)

  if (!food) return null
  const factor = grams / food.servingSize
  const currency = food.currency ?? 'EUR'
  const nutrientEntries = [
    { label: t.common.calories, value: food.calories * factor, unit: t.common.kcal },
    { label: t.common.protein, value: food.protein * factor, unit: t.common.grams },
    { label: t.common.carbs, value: food.carbs * factor, unit: t.common.grams },
    { label: t.common.fat, value: food.fat * factor, unit: t.common.grams },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-labelledby="food-detail-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-wide text-emerald-400">{food.isCustom ? t.food.localFood : t.food.foodDetail}</p><h2 id="food-detail-title" className="mt-1 text-xl font-semibold text-slate-100">{food.name}</h2></div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label={t.common.close}><X className="h-4 w-4" aria-hidden="true" /></Button>
        </div>
        {isEditing ? <div className="mt-5"><CustomFoodForm initialFood={food} onSaved={(savedFood) => { onSaved(savedFood); setIsEditing(false) }} onCancel={() => setIsEditing(false)} /></div> : <>
          {food.brand ? <p className="mt-1 text-sm text-slate-500">{food.brand}</p> : null}
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {nutrientEntries.map(({ label, value, unit }) => <div key={label} className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-100">{Number(value).toFixed(1)} {unit}</p></div>)}
          </div>
          {(food.price !== undefined || food.costPer100g !== undefined || food.notes || (food.allergenTags && food.allergenTags.length > 0)) ? (
            <div className="mt-5 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t.food.metadata}</p>
              <div className="mt-2 space-y-2">
                {food.price !== undefined ? <p>{t.common.price}: {food.price.toFixed(2)} {currency}</p> : null}
                {food.costPer100g !== undefined ? <p>{t.common.costPer100g}: {food.costPer100g.toFixed(2)} {currency}</p> : null}
                {food.notes ? <p>{t.common.notes}: {food.notes}</p> : null}
                {food.allergenTags && food.allergenTags.length > 0 ? <p>{t.common.allergens}: {food.allergenTags.join(', ')}</p> : null}
              </div>
            </div>
          ) : null}
          <label className="mt-5 block text-sm text-slate-300">{t.food.amountLabel.replace('{grams}', String(grams))}<input type="range" min="1" max="500" value={grams} onChange={(event) => setGrams(Number(event.target.value))} className="mt-2 w-full accent-emerald-400" /></label>
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => setIsEditing(true)}>{t.common.edit}</Button>
              <Button type="button" variant="ghost" onClick={onClose}>{t.common.close}</Button>
            </div>
            {onDelete ? (
              <button
                type="button"
                className="ml-auto text-sm font-medium text-red-500 underline decoration-red-500/70 underline-offset-4 transition-colors hover:text-red-400"
                onClick={() => {
                  if (window.confirm(t.food.deleteConfirm.replace('{name}', food.name))) {
                    onDelete(food)
                  }
                }}
              >
                {t.food.deleteFromDb}
              </button>
            ) : null}
          </div>
        </>}
      </div>
    </div>
  )
}
