import type { WorkoutLog } from '@/types'

export function calculateTotalVolume(workout: WorkoutLog): number {
  return workout.exercises.reduce((total, exercise) => total + exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + set.reps * set.weightKg, 0), 0)
}

export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (weightKg < 0 || reps <= 0) return 0
  if (reps === 1) return weightKg
  const denominator = 1.0278 - 0.0278 * reps
  return denominator > 0 ? weightKg / denominator : weightKg
}
