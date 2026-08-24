import { db } from '@/db'
import { TrainingPlanSchema } from '@/schemas/trainingPlan.schema'
import type { TrainingPlan } from '@/types'

export async function listTrainingPlans(): Promise<TrainingPlan[]> {
  return db.trainingPlans.orderBy('weekStart').reverse().toArray()
}

export async function getLatestTrainingPlan(): Promise<TrainingPlan | null> {
  const plan = await db.trainingPlans.orderBy('weekStart').reverse().first()
  return plan ?? null
}

export async function saveTrainingPlan(plan: TrainingPlan): Promise<TrainingPlan> {
  const parsed = TrainingPlanSchema.parse(plan)
  await db.trainingPlans.put(parsed)
  return parsed
}

export async function deleteTrainingPlan(id: string): Promise<void> {
  await db.trainingPlans.delete(id)
}
