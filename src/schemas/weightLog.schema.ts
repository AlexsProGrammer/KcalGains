import { z } from 'zod'

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format')

export const WeightEntrySchema = z.object({
  id: z.string().min(1),
  date: IsoDateSchema,
  weightKg: z.number().min(30).max(350),
  smoothedWeightKg: z.number().min(30).max(350),
  note: z.string().optional(),
})
