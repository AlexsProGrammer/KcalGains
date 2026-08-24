import { useEffect, useMemo, useState } from 'react'
import { BalancerInputSchema } from '@/schemas/balancer.schema'
import { autoBalanceMeal, solveMealBalance } from '@/services/lpSolverService'
import type { BalancerResult, IngredientConstraint, MacroTarget } from '@/types/balancer.types'
import type { Food } from '@/types'

export type MealBalancerState = {
  targets: MacroTarget
  selectedFoods: Food[]
  constraints: IngredientConstraint[]
  result: BalancerResult | undefined
  isCalculating: boolean
  addFood: (food: Food, constraint?: Partial<IngredientConstraint>) => void
  removeFood: (foodId: string) => void
  updateConstraint: (foodId: string, updates: Partial<Omit<IngredientConstraint, 'foodId'>>) => void
  setTargets: (updates: Partial<MacroTarget>) => void
  recalculate: () => void
  autoBalance: (proteinFocus?: number) => void
}

const defaultTargets: MacroTarget = {
  calories: 500,
  protein: 40,
  carbs: 50,
  fat: 15,
  priority: 'balanced',
  maxBudget: 15,
}

export function useMealBalancer(initialTargets: Partial<MacroTarget> = {}): MealBalancerState {
  const [targets, setTargetState] = useState<MacroTarget>({
    ...defaultTargets,
    ...initialTargets,
    maxBudget: initialTargets.maxBudget ?? defaultTargets.maxBudget,
  })
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([])
  const [constraints, setConstraints] = useState<IngredientConstraint[]>([])
  const [result, setResult] = useState<BalancerResult>()
  const [isCalculating, setIsCalculating] = useState(false)

  const foodCatalog = useMemo(() => new Map(selectedFoods.map((food) => [food.id, food])), [selectedFoods])

  function setTargets(updates: Partial<MacroTarget>) {
    setTargetState((current) => ({ ...current, ...updates }))
  }

  function addFood(food: Food, constraint: Partial<IngredientConstraint> = {}) {
    setSelectedFoods((current) => current.some((item) => item.id === food.id) ? current : [...current, food])
    setConstraints((current) => current.some((item) => item.foodId === food.id)
      ? current
      : [...current, { foodId: food.id, minGrams: 0, maxGrams: 1000, ...constraint }])
  }

  function removeFood(foodId: string) {
    setSelectedFoods((current) => current.filter((food) => food.id !== foodId))
    setConstraints((current) => current.filter((constraint) => constraint.foodId !== foodId))
  }

  function updateConstraint(foodId: string, updates: Partial<Omit<IngredientConstraint, 'foodId'>>) {
    setConstraints((current) => current.map((constraint) => constraint.foodId === foodId ? { ...constraint, ...updates } : constraint))
  }

  function recalculate() {
    if (constraints.length === 0) {
      setResult(undefined)
      return
    }

    setIsCalculating(true)
    try {
      const input = BalancerInputSchema.parse({ targets, ingredients: constraints })
      setResult(solveMealBalance(input, foodCatalog))
    } finally {
      setIsCalculating(false)
    }
  }

  function autoBalance(proteinFocus = 50) {
    if (constraints.length === 0) {
      setResult(undefined)
      return
    }
    const input = BalancerInputSchema.parse({ targets, ingredients: constraints })
    setResult(autoBalanceMeal(input, foodCatalog, proteinFocus))
  }

  useEffect(() => {
    const timeout = window.setTimeout(recalculate, 150)
    return () => window.clearTimeout(timeout)
  }, [targets, constraints, foodCatalog])

  return {
    addFood,
    autoBalance,
    constraints,
    isCalculating,
    recalculate,
    removeFood,
    result,
    selectedFoods,
    setTargets,
    targets,
    updateConstraint,
  }
}
