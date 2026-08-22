import Dexie, { type Table } from 'dexie'
import { DEFAULT_APP_SETTINGS } from '@/schemas/settings.schema'
import type { AppSettings, DailyLog, ExerciseDefinition, Food, Meal, Profile, WeightEntry, Workout } from '@/types'

export class FitnessTrackerDB extends Dexie {
  foods!: Table<Food, string>
  meals!: Table<Meal, string>
  workouts!: Table<Workout, string>
  dailyLogs!: Table<DailyLog, string>
  profile!: Table<Profile, string>
  weightLogs!: Table<WeightEntry, string>
  exerciseDefinitions!: Table<ExerciseDefinition, string>
  settings!: Table<AppSettings, string>

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

    this.version(4)
      .stores({
        foods: 'id, name, brand, barcode, isCustom, createdAt',
        meals: 'id, date, mealType, [date+mealType]',
        workouts: 'id, date, type',
        dailyLogs: 'id, date',
        profile: 'id',
        weightLogs: 'id, date',
        exerciseDefinitions: 'id, name, category',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        await transaction.table('settings').put(DEFAULT_APP_SETTINGS)
        await transaction
          .table('profile')
          .toCollection()
          .modify((profile: Partial<Profile>) => {
            profile.goal ??= 'maintain'
            profile.activityLevel ??= 'moderate'
            profile.goalRateKgPerWeek ??= 0
          })
      })

    this.version(5)
      .stores({
        foods: 'id, name, brand, barcode, isCustom',
        meals: 'id, date, mealType, [date+mealType]',
        workouts: 'id, date, type',
        dailyLogs: 'id, date',
        profile: 'id',
        weightLogs: 'id, date',
        exerciseDefinitions: 'id, name, category',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('foods')
          .toCollection()
          .modify((food: any) => {
            if (food.createdAt instanceof Date) {
              food.createdAt = food.createdAt.toISOString()
            } else if (typeof food.createdAt !== 'string') {
              food.createdAt = new Date().toISOString()
            }
          })
      })

    // v5 dropped the createdAt index to purge Date-valued keys; ISO strings index cleanly again.
    this.version(6).stores({
      foods: 'id, name, brand, barcode, isCustom, createdAt',
      meals: 'id, date, mealType, [date+mealType]',
      workouts: 'id, date, type',
      dailyLogs: 'id, date',
      profile: 'id',
      weightLogs: 'id, date',
      exerciseDefinitions: 'id, name, category',
      settings: 'id',
    })

    this.version(7)
      .stores({
        foods: 'id, name, brand, barcode, isCustom, createdAt',
        meals: 'id, date, mealType, [date+mealType]',
        workouts: 'id, date, type',
        dailyLogs: 'id, date',
        profile: 'id',
        weightLogs: 'id, date',
        exerciseDefinitions: 'id, name, category',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        const current = await transaction.table('settings').get('app-settings')
        const merged = {
          ...(DEFAULT_APP_SETTINGS as any),
          ...(current ?? {}),
          id: 'app-settings',
          accent: current?.accent ?? 'emerald',
          todayHero: current?.todayHero ?? 'ring',
          locale: current?.locale ?? 'en',
          density: current?.density ?? 'comfortable',
          reduceMotion: current?.reduceMotion ?? 'system',
          onboardingCompleted: current?.onboardingCompleted ?? false,
          onboardingDismissed: current?.onboardingDismissed ?? false,
          updatedAt: new Date(),
        }

        await transaction.table('settings').put(merged)
      })

    this.version(8)
      .stores({
        foods: 'id, name, brand, barcode, isCustom, createdAt',
        meals: 'id, date, mealType, [date+mealType]',
        workouts: 'id, date, type',
        dailyLogs: 'id, date',
        profile: 'id',
        weightLogs: 'id, date',
        exerciseDefinitions: 'id, name, category',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        const current = await transaction.table('settings').get('app-settings')
        await transaction.table('settings').put({
          ...(DEFAULT_APP_SETTINGS as any),
          ...(current ?? {}),
          id: 'app-settings',
          onboardingCompleted: current?.onboardingCompleted ?? false,
          onboardingDismissed: current?.onboardingDismissed ?? false,
          updatedAt: new Date(),
        })
      })
  }
}
