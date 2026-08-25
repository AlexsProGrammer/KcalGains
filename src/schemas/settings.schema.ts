import { z } from 'zod'

export const SETTINGS_SINGLETON_ID = 'app-settings'

export const ViewModeSchema = z.enum(['graph', 'list'])
export const AccentSchema = z.enum(['emerald', 'lime', 'teal', 'cyan', 'violet', 'amber', 'rose', 'blue'])
export const TodayHeroSchema = z.enum(['ring', 'weight', 'stats', 'streak'])
export const LocaleSchema = z.enum(['en', 'de'])
export const DensitySchema = z.enum(['comfortable', 'compact'])
export const ReduceMotionSchema = z.enum(['system', 'on', 'off'])
export const MicronutrientViewSchema = z.enum(['radar', 'list'])

export const TrainingModePresetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sportType: z.string().min(1),
  description: z.string().default(''),
  intensity: z.enum(['low', 'moderate', 'high']).default('moderate'),
  durationMinutes: z.number().int().min(0).max(600).default(60),
  seasonPhase: z.enum(['offseason', 'competition_prep', 'competition', 'recovery']).default('offseason'),
  caloriesDelta: z.number().default(0),
  proteinDelta: z.number().default(0),
  carbsDelta: z.number().default(0),
  fatDelta: z.number().default(0),
  sodiumMgDelta: z.number().default(0),
  potassiumMgDelta: z.number().default(0),
  hydrationMl: z.number().default(0),
  notes: z.string().default(''),
})

export const DEFAULT_TRAINING_MODES = [
  {
    id: 'strength',
    label: 'Gym',
    sportType: 'strength',
    description: 'Strength training day',
    intensity: 'moderate',
    durationMinutes: 60,
    seasonPhase: 'offseason',
    caloriesDelta: 180,
    proteinDelta: 30,
    carbsDelta: 60,
    fatDelta: 0,
    sodiumMgDelta: 0,
    potassiumMgDelta: 200,
    hydrationMl: 700,
    notes: 'Protein and glycogen support for lifting.',
  },
  {
    id: 'mma',
    label: 'MMA',
    sportType: 'mma',
    description: 'Combat training day',
    intensity: 'high',
    durationMinutes: 75,
    seasonPhase: 'competition_prep',
    caloriesDelta: 420,
    proteinDelta: 10,
    carbsDelta: 120,
    fatDelta: 0,
    sodiumMgDelta: 500,
    potassiumMgDelta: 250,
    hydrationMl: 1100,
    notes: 'Higher glycogen and electrolyte support.',
  },
  {
    id: 'cardio',
    label: 'Cardio',
    sportType: 'cardio',
    description: 'Conditioning session',
    intensity: 'moderate',
    durationMinutes: 50,
    seasonPhase: 'offseason',
    caloriesDelta: 220,
    proteinDelta: 0,
    carbsDelta: 85,
    fatDelta: 0,
    sodiumMgDelta: 200,
    potassiumMgDelta: 150,
    hydrationMl: 800,
    notes: 'Cardio-focused fuel and hydration.',
  },
  {
    id: 'hypertrophy',
    label: 'Hypertrophy',
    sportType: 'hypertrophy',
    description: 'Muscle-building day',
    intensity: 'moderate',
    durationMinutes: 65,
    seasonPhase: 'offseason',
    caloriesDelta: 220,
    proteinDelta: 20,
    carbsDelta: 80,
    fatDelta: 0,
    sodiumMgDelta: 0,
    potassiumMgDelta: 180,
    hydrationMl: 750,
    notes: 'Extra volume and recovery support.',
  },
  {
    id: 'rest',
    label: 'Rest',
    sportType: 'rest',
    description: 'Recovery day',
    intensity: 'low',
    durationMinutes: 0,
    seasonPhase: 'recovery',
    caloriesDelta: 0,
    proteinDelta: 0,
    carbsDelta: 0,
    fatDelta: 0,
    sodiumMgDelta: 0,
    potassiumMgDelta: 0,
    hydrationMl: 500,
    notes: 'Recovery and maintenance baseline.',
  },
] satisfies z.input<typeof TrainingModePresetSchema>[]

export const AppSettingsSchema = z.object({
  id: z.string().min(1).default(SETTINGS_SINGLETON_ID),
  /** When off, every module keeps its own manual targets instead of the resolved ones. */
  moduleChaining: z.boolean().default(true),
  autoWeightFromLogs: z.boolean().default(true),
  autoTargetsFromGoal: z.boolean().default(true),
  snapshotTargetsToDailyLog: z.boolean().default(true),
  defaultView: ViewModeSchema.default('graph'),
  accent: AccentSchema.default('emerald'),
  todayHero: TodayHeroSchema.default('ring'),
  locale: LocaleSchema.default('en'),
  density: DensitySchema.default('comfortable'),
  reduceMotion: ReduceMotionSchema.default('system'),
  micronutrientView: MicronutrientViewSchema.default('list'),
  onboardingCompleted: z.boolean().default(false),
  onboardingDismissed: z.boolean().default(false),
  trainingModes: z.array(TrainingModePresetSchema).default(DEFAULT_TRAINING_MODES),
  updatedAt: z.coerce.date().default(() => new Date()),
})

export const DEFAULT_APP_SETTINGS = AppSettingsSchema.parse({})
