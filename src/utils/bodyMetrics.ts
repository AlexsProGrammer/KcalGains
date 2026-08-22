export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obesity'

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0) {
    return 0
  }

  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'healthy'
  if (bmi < 30) return 'overweight'
  return 'obesity'
}

export function idealWeightRange(heightCm: number): { minKg: number; maxKg: number } {
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    return { minKg: 0, maxKg: 0 }
  }

  const heightM = heightCm / 100
  const minKg = 18.5 * heightM * heightM
  const maxKg = 24.9 * heightM * heightM

  return { minKg, maxKg }
}
