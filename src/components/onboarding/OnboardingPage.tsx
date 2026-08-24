import { ArrowLeft, ArrowRight, Check, Sparkles, Target, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { useProfile } from '@/hooks/useProfile'
import { useSettings } from '@/hooks/useSettings'
import { GOAL_DEFAULT_RATES } from '@/schemas/profile.schema'
import { ACCENT_OPTIONS } from '@/theme/accents'
import type { AccentName, ActivityLevel, BiologicalSex, FitnessGoal } from '@/types'

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary (desk job)' },
  { value: 'light', label: 'Light (1–2 sessions/week)' },
  { value: 'moderate', label: 'Moderate (3–4 sessions/week)' },
  { value: 'active', label: 'Active (5–6 sessions/week)' },
  { value: 'athlete', label: 'Athlete (daily training)' },
]

const GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'lose-fat', label: 'Lose fat' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain-muscle', label: 'Gain muscle' },
  { value: 'recomp', label: 'Recomposition' },
  { value: 'athletic', label: 'More athletic' },
]

function toNumberOrUndefined(value: string): number | undefined {
  const parsed = Number(value)
  return value.trim() === '' || Number.isNaN(parsed) ? undefined : parsed
}

const ONBOARDING_STATE_KEY = 'kcalgains.onboardingState'

export function OnboardingPage({ modalMode = false }: { modalMode?: boolean }) {
  const navigate = useNavigate()
  const { profile, isLoading, saveProfile } = useProfile()
  const { settings, setSetting } = useSettings()

  const [step, setStep] = useState(0)
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [sex, setSex] = useState<BiologicalSex | ''>('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<FitnessGoal>('maintain')
  const [goalRate, setGoalRate] = useState('0')
  const [accent, setAccent] = useState<AccentName>(settings.accent)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isLoading) return
    setHeightCm(profile.heightCm?.toString() ?? '')
    setWeightKg(profile.weightKg?.toString() ?? '')
    setBirthYear(profile.birthYear?.toString() ?? '')
    setSex(profile.sex ?? '')
    setActivityLevel(profile.activityLevel ?? 'moderate')
    setGoal(profile.goal ?? 'maintain')
    setGoalRate(profile.goalRateKgPerWeek?.toString() ?? '0')
    setAccent(settings.accent)
  }, [isLoading, profile, settings.accent])

  const totalSteps = 6
  const percent = ((step + 1) / totalSteps) * 100

  const canContinue = useMemo(() => {
    if (step === 0) return true
    if (step === 1) return heightCm.trim() !== '' && birthYear.trim() !== '' && sex !== ''
    if (step === 2) return true
    if (step === 3) return true
    if (step === 4) return weightKg.trim() !== ''
    if (step === 5) return true
    return true
  }, [birthYear, heightCm, sex, step, weightKg])

  function selectGoal(nextGoal: FitnessGoal) {
    setGoal(nextGoal)
    setGoalRate(GOAL_DEFAULT_RATES[nextGoal].toString())
  }

  function persistOnboardingDecision(state: 'completed' | 'dismissed') {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ONBOARDING_STATE_KEY, state)
    window.sessionStorage.setItem(ONBOARDING_STATE_KEY, state)
    window.localStorage.removeItem('kcalgains.forceOnboarding')
    window.sessionStorage.removeItem('kcalgains.forceOnboarding')
  }

  async function handleComplete() {
    setError(null)
    setIsSubmitting(true)

    try {
      await saveProfile({
        heightCm: toNumberOrUndefined(heightCm),
        weightKg: toNumberOrUndefined(weightKg),
        birthYear: toNumberOrUndefined(birthYear),
        sex: sex === '' ? undefined : sex,
        activityLevel,
        goal,
        goalRateKgPerWeek: Number(goalRate) || 0,
      })
      await setSetting('accent', accent)
      await setSetting('onboardingCompleted', true)
      await setSetting('onboardingDismissed', false)
      persistOnboardingDecision('completed')
      navigate('/today', { replace: true })
    } catch {
      setError('Your profile could not be saved. Please check the values and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSkip() {
    await setSetting('onboardingCompleted', true)
    await setSetting('onboardingDismissed', true)
    persistOnboardingDecision('dismissed')
    navigate('/today', { replace: true })
  }

  const stepInfo = [
    {
      title: 'Welcome',
      subtitle: 'Let’s set up your first nutrition and training profile.',
      content: (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface-1 p-5 text-sm text-ink-mid">
            KcalGains will use your body metrics, activity level, and goals to estimate calories and macros for the day.
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface-0 p-4">
              <Target className="mb-2 h-5 w-5 text-accent-text" />
              <div className="text-sm font-medium text-ink-hi">Body profile</div>
            </div>
            <div className="rounded-xl border border-line bg-surface-0 p-4">
              <Sparkles className="mb-2 h-5 w-5 text-accent-text" />
              <div className="text-sm font-medium text-ink-hi">Goals</div>
            </div>
            <div className="rounded-xl border border-line bg-surface-0 p-4">
              <Trophy className="mb-2 h-5 w-5 text-accent-text" />
              <div className="text-sm font-medium text-ink-hi">Daily tracking</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Body details',
      subtitle: 'Add the basics needed for BMI and TDEE calculations.',
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Height (cm)">
            <TextInput type="number" min="80" max="260" step="0.5" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} placeholder="180" />
          </Field>
          <Field label="Birth year">
            <TextInput type="number" min="1900" max={new Date().getFullYear()} step="1" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} placeholder="1995" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Sex">
              <SelectInput value={sex} onChange={(event) => setSex(event.target.value as BiologicalSex | '')}>
                <option value="">Not set</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </SelectInput>
            </Field>
          </div>
        </div>
      ),
    },
    {
      title: 'Activity',
      subtitle: 'Choose the level that best matches your week.',
      content: (
        <Field label="Activity level">
          <SelectInput value={activityLevel} onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)}>
            {ACTIVITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectInput>
        </Field>
      ),
    },
    {
      title: 'Goal',
      subtitle: 'Set your target direction and weekly adjustment rate.',
      content: (
        <div className="space-y-4">
          <Field label="Primary goal">
            <SelectInput value={goal} onChange={(event) => selectGoal(event.target.value as FitnessGoal)}>
              {GOAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={`Target rate: ${Number(goalRate) > 0 ? '+' : ''}${Number(goalRate).toFixed(2)} kg / week`}>
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
        </div>
      ),
    },
    {
      title: 'First weight',
      subtitle: 'Use your current body weight to anchor the trend and daily calculations.',
      content: (
        <Field label="Weight (kg)">
          <TextInput type="number" min="30" max="350" step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="80.0" />
        </Field>
      ),
    },
    {
      title: 'Theme',
      subtitle: 'Pick the accent you want to use across the app.',
      content: (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-ink-low">Accent</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACCENT_OPTIONS.map((option) => {
              const active = accent === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAccent(option.value as AccentName)}
                  className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-left transition-colors ${active ? 'border-accent/40 bg-accent/12 text-accent-text' : 'border-line bg-surface-0 text-ink-mid hover:bg-surface-1'}`}
                >
                  <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: option.swatch }} />
                  <span className="text-[11px] font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ),
    },
  ]

  const currentStep = stepInfo[step]

  const nextStepLabel = step === totalSteps - 1 ? 'Finish setup' : 'Continue'

  return (
    <div className={modalMode ? 'fixed inset-0 z-[80] flex items-center justify-center bg-surface-0/65 p-4 backdrop-blur-sm' : 'flex min-h-[70vh] items-center justify-center'}>
      <Card className={modalMode ? 'w-full max-w-2xl overflow-hidden border border-line/80 shadow-2xl' : 'w-full max-w-2xl overflow-hidden'}>
        <div className="border-b border-line bg-surface-1 p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-low">
            <span>Setup</span>
            <span>{step + 1}/{totalSteps}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent-fill transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <CardContent className="space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-text">Onboarding</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink-hi">{currentStep.title}</h2>
            <p className="mt-2 text-sm text-ink-mid">{currentStep.subtitle}</p>
          </div>

          {currentStep.content}

          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => (step === 0 ? void handleSkip() : setStep((value) => Math.max(value - 1, 0)))} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? 'Skip for now' : 'Back'}
            </Button>

            <Button
              type="button"
              onClick={() => {
                if (step === totalSteps - 1) {
                  void handleComplete()
                  return
                }

                if (!canContinue) return
                setStep((value) => Math.min(value + 1, totalSteps - 1))
              }}
              disabled={!canContinue || isSubmitting}
            >
              {nextStepLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
