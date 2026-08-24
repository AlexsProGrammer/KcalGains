import trainingTemplates from '@/data/trainingTemplates.json'
import { TrainingPlanSchema } from '@/schemas/trainingPlan.schema'
import type { Profile } from '@/types'

export type TrainingPlanPreferences = {
  goal?: string
  sportType?: string
  frequency?: number
  weekStart?: string
  competitionDate?: string
}

const templates = trainingTemplates as Record<string, { label: string; days: Array<{ offset: number; focus: string; type: 'training' | 'rest'; durationMinutes: number }> }>

function normalizeSportType(sportType?: string): string {
  const normalized = (sportType ?? 'gym').toLowerCase()
  if (normalized === 'strength' || normalized === 'gym') return 'gym'
  if (normalized === 'combat_sport') return 'mma'
  return normalized
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfWeek(date: Date) {
  const next = new Date(date)
  const day = next.getDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + diff)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function generateWeeklyPlan(profile: Partial<Profile> | null, preferences: TrainingPlanPreferences = {}) {
  const goal = (preferences.goal ?? profile?.goal ?? 'maintain').toLowerCase()
  const sportType = normalizeSportType(preferences.sportType ?? 'gym')
  const frequency = Math.min(7, Math.max(1, Number(preferences.frequency ?? 4)))
  const weekStart = preferences.weekStart ? new Date(`${preferences.weekStart}T12:00:00`) : startOfWeek(new Date())

  const key = `${goal}+${sportType}+${frequency}d`
  const fallbackTemplate = templates[key] ?? templates[`${goal}+gym+${frequency}d`] ?? templates[`maintain+gym+${frequency}d`]

  if (!fallbackTemplate) {
    const plan = Array.from({ length: 7 }, (_, index) => ({
      day: formatDate(addDays(weekStart, index)),
      sportType: index % 2 === 0 ? sportType : 'rest',
      focus: index % 2 === 0 ? `${sportType} session` : 'Recovery day',
      durationMinutes: index % 2 === 0 ? 60 : 0,
      type: index % 2 === 0 ? 'training' : 'rest',
    }))

    return TrainingPlanSchema.parse({
      id: crypto.randomUUID(),
      weekStart: formatDate(weekStart),
      goal,
      sportType,
      frequency,
      competitionDate: preferences.competitionDate,
      generatedAt: new Date().toISOString(),
      entries: plan,
    })
  }

  const entries = fallbackTemplate.days.map((entry) => {
    const date = addDays(weekStart, entry.offset)
    const resolvedSportType = entry.type === 'training' ? sportType : 'rest'
    return {
      day: formatDate(date),
      sportType: resolvedSportType,
      focus: entry.focus,
      durationMinutes: entry.durationMinutes,
      type: entry.type,
    }
  })

  return TrainingPlanSchema.parse({
    id: crypto.randomUUID(),
    weekStart: formatDate(weekStart),
    goal,
    sportType,
    frequency,
    competitionDate: preferences.competitionDate,
    generatedAt: new Date().toISOString(),
    entries,
  })
}
