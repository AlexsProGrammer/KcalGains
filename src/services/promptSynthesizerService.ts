import { PromptContextSchema } from '@/schemas/aiPrompt.schema'
import { buildBackupImportPrompt, buildMealPrompt } from '@/utils/promptTemplates'
import type { PromptContext } from '@/types'

export type PromptMode = 'meal' | 'import'

export function generatePrompt(context: PromptContext): string {
  return buildMealPrompt(PromptContextSchema.parse(context))
}

export function generateBackupImportPrompt(sourceText: string): string {
  return buildBackupImportPrompt(sourceText)
}
