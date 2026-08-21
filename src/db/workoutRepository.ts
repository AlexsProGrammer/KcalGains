import { db } from '@/db'
import { WorkoutLogSchema } from '@/schemas/workout.schema'
import type { WorkoutLog } from '@/types'

const workoutTable = db.workouts as unknown as {
  add: (workout: WorkoutLog) => Promise<unknown>
  put: (workout: WorkoutLog) => Promise<unknown>
  get: (id: string) => Promise<WorkoutLog | undefined>
  delete: (id: string) => Promise<void>
  toArray: () => Promise<WorkoutLog[]>
}

export async function getAllWorkoutLogs(): Promise<WorkoutLog[]> {
  return workoutTable.toArray()
}

export async function getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
  return workoutTable.get(id)
}

export async function saveWorkoutLog(workout: WorkoutLog): Promise<string> {
  const parsed = WorkoutLogSchema.parse(workout)
  await workoutTable.put(parsed)
  return parsed.id
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  await workoutTable.delete(id)
}
