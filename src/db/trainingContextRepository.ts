import { db } from '@/db'
import { TrainingDayContextSchema } from '@/schemas/trainingContext.schema'
import type { TrainingDayContext } from '@/types'

export async function getTrainingContextForDate(date: string): Promise<TrainingDayContext | null> {
  const record = await db.trainingContext.where('date').equals(date).first()
  return record ? TrainingDayContextSchema.parse(record) : null
}

export async function upsertTrainingContext(context: TrainingDayContext): Promise<TrainingDayContext> {
  const next = TrainingDayContextSchema.parse(context)
  await db.trainingContext.put(next)
  return next
}

export async function listTrainingContextForRange(startDate: string, endDate: string): Promise<TrainingDayContext[]> {
  const rows = await db.trainingContext
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray()

  return rows.map((row) => TrainingDayContextSchema.parse(row))
}

export async function deleteTrainingContext(date: string): Promise<void> {
  await db.trainingContext.delete(date)
}
