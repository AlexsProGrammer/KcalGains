import { Solve, type SolveResult } from 'javascript-lp-solver'
import { BalancerResultSchema } from '@/schemas/balancer.schema'
import type { BalancerInput, BalancerResult } from '@/types/balancer.types'
import type { Food } from '@/types'
import { addMacroTotals, calculateFoodMacros, type MacroTotals } from '@/utils/macroCalculations'
import { buildLpModel, getFoodVariableName } from '@/services/balancerTransformer'

const emptyTotals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
const macroNames = ['calories', 'protein', 'carbs', 'fat'] as const

type MacroName = typeof macroNames[number]

function numericResultValue(result: SolveResult, key: string): number {
  const value = result[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function quantizeGrams(grams: number, stepSize?: number): number {
  const step = stepSize && stepSize > 0 ? stepSize : 1
  return Math.max(0, Math.round(grams / step) * step)
}

export function buildResult(
  input: BalancerInput,
  foodCatalog: Map<string, Food>,
  solvedValues: Map<string, number>,
  status: BalancerResult['status'],
): BalancerResult {
  let totalMacros = { ...emptyTotals }
  const solution = input.ingredients.flatMap((ingredient) => {
    const food = foodCatalog.get(ingredient.foodId)
    if (!food) return []

    const roundedGrams = quantizeGrams(solvedValues.get(ingredient.foodId) ?? ingredient.minGrams, ingredient.stepSize)
    const grams = Math.min(ingredient.maxGrams, Math.max(ingredient.minGrams, roundedGrams))
    const computed = calculateFoodMacros(food, grams)
    totalMacros = addMacroTotals(totalMacros, computed)

    return [{
      foodId: ingredient.foodId,
      grams,
      computedCalories: computed.calories,
      computedProtein: computed.protein,
      computedCarbs: computed.carbs,
      computedFat: computed.fat,
    }]
  })

  const deviation = {
    deltaCalories: totalMacros.calories - input.targets.calories,
    deltaProtein: totalMacros.protein - input.targets.protein,
    deltaCarbs: totalMacros.carbs - input.targets.carbs,
    deltaFat: totalMacros.fat - input.targets.fat,
  }

  return BalancerResultSchema.parse({ status, solution, totalMacros, deviation })
}

function isCloseToTarget(result: BalancerResult): boolean {
  return Math.abs(result.deviation.deltaCalories) <= 10
    && Math.abs(result.deviation.deltaProtein) <= 2
    && Math.abs(result.deviation.deltaCarbs) <= 2
    && Math.abs(result.deviation.deltaFat) <= 2
}

export function solveMealBalance(input: BalancerInput, foodCatalog: Map<string, Food>): BalancerResult {
  const missingFood = input.ingredients.find((ingredient) => !foodCatalog.has(ingredient.foodId))
  if (missingFood) {
    return buildResult(input, foodCatalog, new Map(), 'infeasible')
  }

  const model = buildLpModel(input, foodCatalog)
  let solved: SolveResult

  try {
    solved = Solve(model)
  } catch {
    return buildResult(input, foodCatalog, new Map(), 'infeasible')
  }

  if (solved.feasible === false) {
    return buildResult(input, foodCatalog, new Map(), 'infeasible')
  }

  const solvedValues = new Map<string, number>()
  for (const ingredient of input.ingredients) {
    solvedValues.set(ingredient.foodId, numericResultValue(solved, getFoodVariableName(ingredient.foodId)))
  }

  const result = buildResult(input, foodCatalog, solvedValues, 'bounded')
  return isCloseToTarget(result) ? { ...result, status: 'feasible' } : result
}

export function autoBalanceMeal(input: BalancerInput, foodCatalog: Map<string, Food>, proteinFocus = 50): BalancerResult {
  const grams = new Map(input.ingredients.map((ingredient) => [ingredient.foodId, ingredient.minGrams]))
  const weights = {
    calories: 0.5 + proteinFocus / 200,
    protein: 0.5 + (100 - proteinFocus) / 100,
    carbs: 0.5,
    fat: 0.5,
  }

  function score(current: Map<string, number>): number {
    const totals = input.ingredients.reduce((sum, ingredient) => {
      const food = foodCatalog.get(ingredient.foodId)
      return food ? addMacroTotals(sum, calculateFoodMacros(food, current.get(ingredient.foodId) ?? 0)) : sum
    }, { ...emptyTotals })

    return macroNames.reduce((total, macro) => total + weights[macro] * Math.abs(totals[macro] - input.targets[macro]) / Math.max(input.targets[macro], 1), 0)
  }

  let currentScore = score(grams)
  let improved = true
  while (improved) {
    improved = false
    let bestScore = currentScore
    let bestFoodId: string | undefined
    let bestGrams = 0

    for (const ingredient of input.ingredients) {
      const currentGrams = grams.get(ingredient.foodId) ?? ingredient.minGrams
      const step = ingredient.stepSize ?? 1
      if (currentGrams + step > ingredient.maxGrams) continue
      grams.set(ingredient.foodId, currentGrams + step)
      const candidateScore = score(grams)
      grams.set(ingredient.foodId, currentGrams)
      if (candidateScore + 0.000001 < bestScore) {
        bestScore = candidateScore
        bestFoodId = ingredient.foodId
        bestGrams = currentGrams + step
      }
    }

    if (bestFoodId) {
      grams.set(bestFoodId, bestGrams)
      currentScore = bestScore
      improved = true
    }
  }

  const result = buildResult(input, foodCatalog, grams, 'bounded')
  return isCloseToTarget(result) ? { ...result, status: 'feasible' } : result
}

export function macroDeviationMagnitude(result: BalancerResult): number {
  return macroNames.reduce((total, macro) => total + Math.abs(result.deviation[`delta${macro[0].toUpperCase()}${macro.slice(1)}` as keyof BalancerResult['deviation']] as number), 0)
}
