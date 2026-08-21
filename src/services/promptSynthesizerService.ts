import { PromptContextSchema } from '@/schemas/aiPrompt.schema'
import { buildMealPrompt } from '@/utils/promptTemplates'
import type { PromptContext } from '@/types'

export function generatePrompt(context: PromptContext): string {
  return buildMealPrompt(PromptContextSchema.parse(context))
}
