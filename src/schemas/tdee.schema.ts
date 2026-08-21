import { z } from 'zod'

export const TdeeCalculationResultSchema = z.object({
  calculatedTdee: z.number().nonnegative(),
  trendDirection: z.enum(['rising', 'falling', 'stable']),
  weeklyWeightDeltaKg: z.number(),
  confidenceScore: z.number().min(0).max(1),
  recommendedIntake: z.number().nonnegative(),
})
