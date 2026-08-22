import { z } from 'zod'

export const SETTINGS_SINGLETON_ID = 'app-settings'

export const ViewModeSchema = z.enum(['graph', 'list'])

export const AppSettingsSchema = z.object({
  id: z.string().min(1).default(SETTINGS_SINGLETON_ID),
  /** When off, every module keeps its own manual targets instead of the resolved ones. */
  moduleChaining: z.boolean().default(true),
  autoWeightFromLogs: z.boolean().default(true),
  autoTargetsFromGoal: z.boolean().default(true),
  snapshotTargetsToDailyLog: z.boolean().default(true),
  defaultView: ViewModeSchema.default('graph'),
  updatedAt: z.coerce.date().default(() => new Date()),
})

export const DEFAULT_APP_SETTINGS = AppSettingsSchema.parse({})
