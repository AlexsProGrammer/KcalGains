import { Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { useProfile } from '@/hooks/useProfile'
import { useSettings } from '@/hooks/useSettings'
import { useT } from '@/i18n'
import { GOAL_DEFAULT_RATES } from '@/schemas/profile.schema'
import { resolveMicronutrientTargets } from '@/services/micronutrientTargetService'
import type { ActivityLevel, BiologicalSex, DietaryPattern, FitnessGoal, SweatType } from '@/types'

function goalLabel(t: ReturnType<typeof useT>['t'], value: FitnessGoal): string {
  const map: Record<FitnessGoal, string> = {
    'lose-fat': t.more.goalLoseFat,
    maintain: t.more.goalMaintain,
    'gain-muscle': t.more.goalGainMuscle,
    recomp: t.more.goalRecomp,
    athletic: t.more.goalAthletic,
  }
  return map[value]
}

function activityLabel(t: ReturnType<typeof useT>['t'], value: ActivityLevel): string {
  const map: Record<ActivityLevel, string> = {
    sedentary: t.more.actSedentary,
    light: t.more.actLight,
    moderate: t.more.actModerate,
    active: t.more.actActive,
    athlete: t.more.actAthlete,
  }
  return map[value]
}

function dietLabel(t: ReturnType<typeof useT>['t'], value: DietaryPattern): string {
  const map: Record<DietaryPattern, string> = {
    standard: t.more.dietStandard,
    ketogenic: t.more.dietKetogenic,
    diabetic_friendly: t.more.dietDiabetic,
    low_fodmap: t.more.dietLowFodmap,
  }
  return map[value]
}

function sweatLabel(t: ReturnType<typeof useT>['t'], value: SweatType): string {
  const map: Record<SweatType, string> = {
    low: t.more.sweatLow,
    normal: t.more.sweatNormal,
    heavy_salty: t.more.sweatHeavy,
  }
  return map[value]
}

const MICRONUTRIENT_FIELDS = [
  { key: 'sodiumMg', label: 'Sodium (mg)' },
  { key: 'potassiumMg', label: 'Potassium (mg)' },
  { key: 'magnesiumMg', label: 'Magnesium (mg)' },
  { key: 'calciumMg', label: 'Calcium (mg)' },
  { key: 'zincMg', label: 'Zinc (mg)' },
  { key: 'ironMg', label: 'Iron (mg)' },
  { key: 'seleniumMcg', label: 'Selenium (mcg)' },
  { key: 'vitaminDMcg', label: 'Vitamin D (mcg)' },
  { key: 'vitaminB6Mg', label: 'Vitamin B6 (mg)' },
  { key: 'vitaminB12Mcg', label: 'Vitamin B12 (mcg)' },
  { key: 'vitaminCMg', label: 'Vitamin C (mg)' },
] as const

function toNumberOrUndefined(value: string): number | undefined {
  const parsed = Number(value)
  return value.trim() === '' || Number.isNaN(parsed) ? undefined : parsed
}

export function ProfileGoalForm() {
  const navigate = useNavigate()
  const { t } = useT()
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
  const [micronutrientTargets, setMicronutrientTargets] = useState<Record<string, number>>({})
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
    setMicronutrientTargets(
      Object.fromEntries(
        MICRONUTRIENT_FIELDS.map((field) => [field.key, resolveMicronutrientTargets(profile)[field.key] ?? 0]),
      ),
    )
  }, [isLoading, profile])

  function selectGoal(nextGoal: FitnessGoal) {
    setGoal(nextGoal)
    setGoalRate(GOAL_DEFAULT_RATES[nextGoal].toString())
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
        micronutrientTargets: Object.fromEntries(
          MICRONUTRIENT_FIELDS.map((field) => [field.key, Number(micronutrientTargets[field.key] ?? resolveMicronutrientTargets(profile)[field.key] ?? 0)]),
        ),
        goalRateKgPerWeek: Number(goalRate) || 0,
      })
      setMessage(t.more.profileSaved)
    } catch {
      setError(t.more.profileError)
    }
  }

  return (
    <Card>
      <CardHeader icon={<Target />} title={t.more.bodyAndGoal} />
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.more.heightCm}>
              <TextInput type="number" min="80" max="260" step="0.5" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} placeholder="180" />
            </Field>
            <Field label={t.more.weightKg} hint={t.more.weightUsedHint}>
              <TextInput type="number" min="30" max="350" step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="80.0" />
            </Field>
            <Field label={t.more.birthYear}>
              <TextInput type="number" min="1900" max={new Date().getFullYear()} step="1" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} placeholder="1995" />
            </Field>
            <Field label={t.more.sex} hint={t.more.sexHint}>
              <SelectInput value={sex} onChange={(event) => setSex(event.target.value as BiologicalSex | '')}>
                <option value="">{t.more.notSet}</option>
                <option value="male">{t.more.male}</option>
                <option value="female">{t.more.female}</option>
              </SelectInput>
            </Field>
            <Field label={t.more.activityLevel}>
              <SelectInput value={activityLevel} onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)}>
                {(['sedentary', 'light', 'moderate', 'active', 'athlete'] as ActivityLevel[]).map((option) => (
                  <option key={option} value={option}>{activityLabel(t, option)}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label={t.more.goal}>
              <SelectInput value={goal} onChange={(event) => selectGoal(event.target.value as FitnessGoal)}>
                {(['lose-fat', 'maintain', 'gain-muscle', 'recomp', 'athletic'] as FitnessGoal[]).map((option) => (
                  <option key={option} value={option}>{goalLabel(t, option)}</option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.more.dietPattern}>
              <SelectInput value={dietaryPattern} onChange={(event) => setDietaryPattern(event.target.value as DietaryPattern)}>
                {(['standard', 'ketogenic', 'diabetic_friendly', 'low_fodmap'] as DietaryPattern[]).map((option) => (
                  <option key={option} value={option}>{dietLabel(t, option)}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label={t.more.sweatType}>
              <SelectInput value={sweatType} onChange={(event) => setSweatType(event.target.value as SweatType)}>
                {(['low', 'normal', 'heavy_salty'] as SweatType[]).map((option) => (
                  <option key={option} value={option}>{sweatLabel(t, option)}</option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <Field label={t.more.dailyBudget} hint={t.more.dailyBudgetHint}>
            <TextInput type="number" min="0" step="1" value={budgetPerDay} onChange={(event) => setBudgetPerDay(event.target.value)} placeholder="15" />
          </Field>

          <div className="rounded-xl border border-line bg-surface-1 p-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-low">{t.more.micronutrientTargets}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {MICRONUTRIENT_FIELDS.map((field) => (
                <Field key={field.key} label={field.label}>
                  <TextInput
                    type="number"
                    min="0"
                    step={field.key.includes('Mcg') || field.key.includes('vitamin') ? '0.1' : '1'}
                    value={micronutrientTargets[field.key] ?? resolveMicronutrientTargets(profile)[field.key] ?? 0}
                    onChange={(event) => setMicronutrientTargets((current) => ({ ...current, [field.key]: Number(event.target.value || 0) }))}
                  />
                </Field>
              ))}
            </div>
          </div>

          <Field label={t.more.targetRate.replace('{value}', `${Number(goalRate) > 0 ? '+' : ''}${Number(goalRate).toFixed(2)}`)} hint={t.more.targetRateHint}>
            <input
              type="range"
              min="-1.5"
              max="1.5"
              step="0.05"
              value={goalRate}
              onChange={(event) => setGoalRate(event.target.value)}
              className="mt-1 w-full accent-accent"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">{t.more.saveProfile}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/onboarding')}>
              {t.more.openSetupWizard}
            </Button>
          </div>
          {message ? <Alert variant="success">{message}</Alert> : null}
          {error ? <Alert variant="error">{error}</Alert> : null}
        </form>
      </CardContent>
    </Card>
  )
}
