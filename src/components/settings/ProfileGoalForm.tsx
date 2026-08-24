import { Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { useProfile } from '@/hooks/useProfile'
import { useSettings } from '@/hooks/useSettings'
import { GOAL_DEFAULT_RATES } from '@/schemas/profile.schema'
import type { ActivityLevel, AllergenTag, BiologicalSex, DietaryPattern, FitnessGoal, SweatType } from '@/types'

const GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'lose-fat', label: 'Lose fat' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain-muscle', label: 'Gain muscle' },
  { value: 'recomp', label: 'Recomposition' },
  { value: 'athletic', label: 'More athletic' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary (desk job)' },
  { value: 'light', label: 'Light (1-2 sessions/week)' },
  { value: 'moderate', label: 'Moderate (3-4 sessions/week)' },
  { value: 'active', label: 'Active (5-6 sessions/week)' },
  { value: 'athlete', label: 'Athlete (daily training)' },
]

const ALLERGEN_OPTIONS: { value: AllergenTag; label: string }[] = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'lactose', label: 'Lactose' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'soy', label: 'Soy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'fish', label: 'Fish' },
  { value: 'fructose', label: 'Fructose' },
]

const DIETARY_OPTIONS: { value: DietaryPattern; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'ketogenic', label: 'Ketogenic' },
  { value: 'diabetic_friendly', label: 'Diabetic-friendly' },
  { value: 'low_fodmap', label: 'Low-FODMAP' },
]

const SWEAT_OPTIONS: { value: SweatType; label: string }[] = [
  { value: 'low', label: 'Low sweat / low sodium loss' },
  { value: 'normal', label: 'Normal' },
  { value: 'heavy_salty', label: 'Heavy sweater / salty sweat' },
]

function toNumberOrUndefined(value: string): number | undefined {
  const parsed = Number(value)
  return value.trim() === '' || Number.isNaN(parsed) ? undefined : parsed
}

export function ProfileGoalForm() {
  const navigate = useNavigate()
  const { profile, isLoading, saveProfile } = useProfile()
  const { setSetting } = useSettings()
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [sex, setSex] = useState<BiologicalSex | ''>('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<FitnessGoal>('maintain')
  const [goalRate, setGoalRate] = useState('0')
  const [dietaryPattern, setDietaryPattern] = useState<DietaryPattern>('standard')
  const [sweatType, setSweatType] = useState<SweatType>('normal')
  const [budgetPerDay, setBudgetPerDay] = useState('')
  const [allergens, setAllergens] = useState<AllergenTag[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    setHeightCm(profile.heightCm?.toString() ?? '')
    setWeightKg(profile.weightKg?.toString() ?? '')
    setBirthYear(profile.birthYear?.toString() ?? '')
    setSex(profile.sex ?? '')
    setActivityLevel(profile.activityLevel)
    setGoal(profile.goal)
    setGoalRate(profile.goalRateKgPerWeek.toString())
    setDietaryPattern(profile.dietaryPattern ?? 'standard')
    setSweatType(profile.sweatType ?? 'normal')
    setBudgetPerDay(profile.budgetPerDay?.toString() ?? '')
    setAllergens(profile.allergens ?? [])
  }, [isLoading, profile])

  function selectGoal(nextGoal: FitnessGoal) {
    setGoal(nextGoal)
    setGoalRate(GOAL_DEFAULT_RATES[nextGoal].toString())
  }

  function toggleAllergen(allergen: AllergenTag) {
    setAllergens((current) => current.includes(allergen)
      ? current.filter((item) => item !== allergen)
      : [...current, allergen])
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    try {
      await saveProfile({
        heightCm: toNumberOrUndefined(heightCm),
        weightKg: toNumberOrUndefined(weightKg),
        birthYear: toNumberOrUndefined(birthYear),
        sex: sex === '' ? undefined : sex,
        activityLevel,
        goal,
        dietaryPattern,
        sweatType,
        budgetPerDay: toNumberOrUndefined(budgetPerDay),
        allergens,
        goalRateKgPerWeek: Number(goalRate) || 0,
      })
      setMessage('Profile saved. Connected modules will pick up the new goal and health constraints.')
    } catch {
      setError('Check your entries: height 80-260 cm, weight above 0, rate between -1.5 and 1.5 kg/week.')
    }
  }

  return (
    <Card>
      <CardHeader icon={<Target />} title="Body & goal" />
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Height (cm)">
              <TextInput type="number" min="80" max="260" step="0.5" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} placeholder="180" />
            </Field>
            <Field label="Weight (kg)" hint="Used when automatic weight tracking is off.">
              <TextInput type="number" min="30" max="350" step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="80.0" />
            </Field>
            <Field label="Birth year">
              <TextInput type="number" min="1900" max={new Date().getFullYear()} step="1" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} placeholder="1995" />
            </Field>
            <Field label="Sex" hint="Required for the BMR formula.">
              <SelectInput value={sex} onChange={(event) => setSex(event.target.value as BiologicalSex | '')}>
                <option value="">Not set</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </SelectInput>
            </Field>
            <Field label="Activity level">
              <SelectInput value={activityLevel} onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)}>
                {ACTIVITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Goal">
              <SelectInput value={goal} onChange={(event) => selectGoal(event.target.value as FitnessGoal)}>
                {GOAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Diet pattern">
              <SelectInput value={dietaryPattern} onChange={(event) => setDietaryPattern(event.target.value as DietaryPattern)}>
                {DIETARY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Sweat type">
              <SelectInput value={sweatType} onChange={(event) => setSweatType(event.target.value as SweatType)}>
                {SWEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <Field label="Daily budget (€)" hint="Optional: used by future budget-aware meal planning.">
            <TextInput type="number" min="0" step="1" value={budgetPerDay} onChange={(event) => setBudgetPerDay(event.target.value)} placeholder="15" />
          </Field>

          <div className="rounded-md border border-line bg-surface-0 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-low">Allergens</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALLERGEN_OPTIONS.map((option) => {
                const checked = allergens.includes(option.value)
                return (
                  <label key={option.value} className="flex items-center gap-2 rounded-md border border-line bg-surface-1 px-2 py-2 text-sm text-ink-hi">
                    <input type="checkbox" checked={checked} onChange={() => toggleAllergen(option.value)} className="h-4 w-4 accent-emerald-500" />
                    <span>{option.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <Field label={`Target rate: ${Number(goalRate) > 0 ? '+' : ''}${Number(goalRate).toFixed(2)} kg / week`} hint="Negative loses weight, positive gains.">
            <input
              type="range"
              min="-1.5"
              max="1.5"
              step="0.05"
              value={goalRate}
              onChange={(event) => setGoalRate(event.target.value)}
              className="mt-1 w-full accent-emerald-500"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">Save profile</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/onboarding')}>
              Open setup wizard
            </Button>
          </div>
          {message ? <Alert variant="success">{message}</Alert> : null}
          {error ? <Alert variant="error">{error}</Alert> : null}
        </form>
      </CardContent>
    </Card>
  )
}
