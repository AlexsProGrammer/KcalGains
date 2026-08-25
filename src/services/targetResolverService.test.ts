import { describe, expect, it } from 'vitest'
import { ProfileSchema } from '@/schemas/profile.schema'
import { DEFAULT_APP_SETTINGS } from '@/schemas/settings.schema'
import { resolveDailyTargets } from '@/services/targetResolverService'

const profile = ProfileSchema.parse({
  id: 'p1',
  heightCm: 175,
  weightKg: 75,
  activityLevel: 'moderate',
  goal: 'maintain',
  dietaryPattern: 'standard',
  sweatType: 'normal',
  allergens: [],
  targetCalories: 2000,
  targetMacros: { protein: 150, carbs: 200, fat: 65 },
  goalRateKgPerWeek: 0,
})

describe('resolveDailyTargets', () => {
  it('keeps the goal-based baseline when settings are enabled', () => {
    const result = resolveDailyTargets({ profile, settings: DEFAULT_APP_SETTINGS, recentWeightKg: 75 })

    expect(result.calories).toBeGreaterThan(0)
    expect(result.protein).toBeGreaterThan(0)
    expect(result.source).toBe('goal')
  })

  it('adds training adjustments for a strength day context', () => {
    const result = resolveDailyTargets({
      profile,
      settings: DEFAULT_APP_SETTINGS,
      recentWeightKg: 75,
      trainingContext: { sportType: 'strength', seasonPhase: 'offseason', intensity: 'moderate' },
    })

    expect(result.calories).toBeGreaterThan(2000)
    expect(result.carbs).toBeGreaterThan(200)
    expect(result.reason).toContain('Strength')
  })
})

describe('DEFAULT_APP_SETTINGS', () => {
  it('uses radar mode by default for micronutrients', () => {
    expect(DEFAULT_APP_SETTINGS.micronutrientView).toBe('radar')
  })

  it('keeps a valid training mode preset list', () => {
    expect(DEFAULT_APP_SETTINGS.trainingModes.length).toBeGreaterThan(0)
    expect(DEFAULT_APP_SETTINGS.trainingModes.some((mode) => mode.sportType === 'rest')).toBe(true)
  })
})
