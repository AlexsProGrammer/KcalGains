import type { z } from 'zod'
import { BalancerInputSchema, BalancerResultSchema, IngredientConstraintSchema, MacroTargetSchema } from '@/schemas/balancer.schema'

export type MacroTarget = z.infer<typeof MacroTargetSchema>
export type IngredientConstraint = z.infer<typeof IngredientConstraintSchema>
export type BalancerInput = z.infer<typeof BalancerInputSchema>
export type BalancerResult = z.infer<typeof BalancerResultSchema>
