import type { SolverModel } from 'javascript-lp-solver'
import type { BalancerInput } from '@/types/balancer.types'
import type { Food } from '@/types'
import { macroRatesPerGram } from '@/utils/macroCalculations'

export type BalancerModel = SolverModel

const macroNames = ['calories', 'protein', 'carbs', 'fat'] as const

type MacroName = typeof macroNames[number]

function variableName(foodId: string): string {
  return `food_${foodId.replace(/[^a-zA-Z0-9_]/g, '_')}`
}

export function getFoodVariableName(foodId: string): string {
  return variableName(foodId)
}

function deviationWeight(input: BalancerInput, macro: MacroName): number {
  if (input.targets.priority === 'protein-first') {
    return macro === 'protein' ? 10 : 1
  }

  if (input.targets.priority === 'exact-calories') {
    return macro === 'calories' ? 10 : 1
  }

  return 1
}

export function buildLpModel(input: BalancerInput, foodCatalog: Map<string, Food>): BalancerModel {
  const constraints: SolverModel['constraints'] = {}
  const variables: SolverModel['variables'] = {}
  const ints: Record<string, 1> = {}

  for (const macro of macroNames) {
    const target = input.targets[macro]
    constraints[`target_${macro}`] = { min: target, max: target }
  }

  for (const ingredient of input.ingredients) {
    const food = foodCatalog.get(ingredient.foodId)
    if (!food) continue

    const name = variableName(ingredient.foodId)
    const rates = macroRatesPerGram(food)
    variables[name] = {
      objective: 0,
      [name]: 1,
      target_calories: rates.calories,
      target_protein: rates.protein,
      target_carbs: rates.carbs,
      target_fat: rates.fat,
    }
    constraints[name] = { min: ingredient.minGrams, max: ingredient.maxGrams }
    ints[name] = 1
  }

  for (const macro of macroNames) {
    const weight = deviationWeight(input, macro)
    variables[`slack_${macro}`] = {
      objective: weight,
      [`target_${macro}`]: 1,
    }
    variables[`surplus_${macro}`] = {
      objective: weight,
      [`target_${macro}`]: -1,
    }
  }

  return {
    optimize: 'objective',
    opType: 'min',
    constraints,
    variables,
    ints,
  }
}
