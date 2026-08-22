import { z } from 'zod'

export const SETTINGS_SINGLETON_ID = 'app-settings'

export const ViewModeSchema = z.enum(['graph', 'list'])
export const AccentSchema = z.enum(['emerald', 'lime', 'teal', 'cyan', 'violet', 'amber', 'rose', 'blue'])
export const TodayHeroSchema = z.enum(['ring', 'weight', 'stats', 'streak'])
export const LocaleSchema = z.enum(['en', 'de'])
export const DensitySchema = z.enum(['comfortable', 'compact'])
export const ReduceMotionSchema = z.enum(['system', 'on', 'off'])

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
  updatedAt: z.coerce.date().default(() => new Date()),
})

export const DEFAULT_APP_SETTINGS = AppSettingsSchema.parse({})
