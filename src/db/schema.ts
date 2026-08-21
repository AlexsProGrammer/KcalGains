import Dexie, { type Table } from 'dexie'
import type { DailyLog, Food, Meal, Profile, Workout } from '@/types'

export class FitnessTrackerDB extends Dexie {
  foods!: Table<Food, string>
  meals!: Table<Meal, string>
  workouts!: Table<Workout, string>
  dailyLogs!: Table<DailyLog, string>
  profile!: Table<Profile, string>

  constructor() {
    super('KcalGains')

    this.version(1).stores({
      foods: 'id, name, isCustom, createdAt',
      meals: 'id, date, mealType, [date+mealType]',
      workouts: 'id, date, type',
      dailyLogs: 'id, date',
      profile: 'id',
    })
  }
}
