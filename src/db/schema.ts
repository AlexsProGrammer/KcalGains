import Dexie, { type Table } from 'dexie'
import type { DailyLog, ExerciseDefinition, Food, Meal, Profile, WeightEntry, Workout } from '@/types'

export class FitnessTrackerDB extends Dexie {
  foods!: Table<Food, string>
  meals!: Table<Meal, string>
  workouts!: Table<Workout, string>
  dailyLogs!: Table<DailyLog, string>
  profile!: Table<Profile, string>
  weightLogs!: Table<WeightEntry, string>
  exerciseDefinitions!: Table<ExerciseDefinition, string>

  constructor() {
    super('KcalGains')

    this.version(1).stores({
      foods: 'id, name, isCustom, createdAt',
      meals: 'id, date, mealType, [date+mealType]',
      workouts: 'id, date, type',
      dailyLogs: 'id, date',
      profile: 'id',
    })

    this.version(2).stores({
      foods: 'id, name, brand, barcode, isCustom, createdAt',
      meals: 'id, date, mealType, [date+mealType]',
      workouts: 'id, date, type',
      dailyLogs: 'id, date',
      profile: 'id',
    })

    this.version(3).stores({
      foods: 'id, name, brand, barcode, isCustom, createdAt',
      meals: 'id, date, mealType, [date+mealType]',
      workouts: 'id, date, type',
      dailyLogs: 'id, date',
      profile: 'id',
      weightLogs: 'id, date',
      exerciseDefinitions: 'id, name, category',
    })
  }
}
