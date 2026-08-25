import { describe, expect, it } from 'vitest'
import { ProfileSchema } from '@/schemas/profile.schema'
import { resolveMicronutrientTargets } from '@/services/micronutrientTargetService'

describe('micronutrient targets', () => {
  it('accepts explicit micronutrient target overrides in the profile schema', () => {
    const profile = ProfileSchema.parse({
      id: 'profile-1',
      targetCalories: 2200,
      targetMacros: { protein: 160, carbs: 220, fat: 65 },
      micronutrientTargets: {
        protein: 160,
        sodiumMg: 1500,
        potassiumMg: 2500,
        magnesiumMg: 250,
        calciumMg: 800,
        zincMg: 9,
        ironMg: 12,
        seleniumMcg: 50,
        vitaminDMcg: 15,
        vitaminB6Mg: 1.0,
        vitaminB12Mcg: 2.0,
        vitaminCMg: 80,
      },
    })

    expect(profile.micronutrientTargets?.sodiumMg).toBe(1500)
  })

  it('prefers profile-level micronutrient targets over the default fallback values', () => {
    const profile = {
      sex: 'male' as const,
      birthYear: 1995,
      micronutrientTargets: { sodiumMg: 1200, potassiumMg: 2400, magnesiumMg: 250 },
    }

    const targets = resolveMicronutrientTargets(profile)

    expect(targets.sodiumMg).toBe(1200)
    expect(targets.potassiumMg).toBe(2400)
    expect(targets.magnesiumMg).toBe(250)
  })
})
