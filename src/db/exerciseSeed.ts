import exerciseData from '@/data/exercises.json'
import { ExerciseDefinitionSchema } from '@/schemas/workout.schema'
import type { FitnessTrackerDB } from '@/db/schema'

const ExerciseLibrarySchema = ExerciseDefinitionSchema.array()

export async function seedExerciseLibraryIfEmpty(db: FitnessTrackerDB): Promise<number> {
  const count = await db.exerciseDefinitions.count()
  if (count > 0) return 0
  const exercises = ExerciseLibrarySchema.parse(exerciseData)
  await db.exerciseDefinitions.bulkAdd(exercises)
  return exercises.length
}
