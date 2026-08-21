import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CustomFoodForm } from '@/components/food/CustomFoodForm'
import type { Food } from '@/types'

type FoodDetailModalProps = {
  food: Food | null
  onClose: () => void
  onSaved: (food: Food) => void
}

export function FoodDetailModal({ food, onClose, onSaved }: FoodDetailModalProps) {
  const [grams, setGrams] = useState(100)
  const [isEditing, setIsEditing] = useState(false)

  if (!food) return null
  const factor = grams / food.servingSize

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-labelledby="food-detail-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-wide text-emerald-400">{food.isCustom ? 'Local food' : 'Food detail'}</p><h2 id="food-detail-title" className="mt-1 text-xl font-semibold text-slate-100">{food.name}</h2></div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close food details"><X className="h-4 w-4" aria-hidden="true" /></Button>
        </div>
        {isEditing ? <div className="mt-5"><CustomFoodForm initialFood={food} onSaved={(savedFood) => { onSaved(savedFood); setIsEditing(false) }} onCancel={() => setIsEditing(false)} /></div> : <>
          {food.brand ? <p className="mt-1 text-sm text-slate-500">{food.brand}</p> : null}
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[['Calories', food.calories * factor, 'kcal'], ['Protein', food.protein * factor, 'g'], ['Carbs', food.carbs * factor, 'g'], ['Fat', food.fat * factor, 'g']].map(([label, value, unit]) => <div key={label} className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-100">{Number(value).toFixed(1)} {unit}</p></div>)}
          </div>
          <label className="mt-5 block text-sm text-slate-300">Amount: {grams}g<input type="range" min="1" max="500" value={grams} onChange={(event) => setGrams(Number(event.target.value))} className="mt-2 w-full accent-emerald-400" /></label>
          <div className="mt-5 flex gap-2"><Button type="button" onClick={() => setIsEditing(true)}>Edit</Button><Button type="button" variant="ghost" onClick={onClose}>Close</Button></div>
        </>}
      </div>
    </div>
  )
}
