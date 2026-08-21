import { Zap } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { useDynamicTargets } from '@/hooks/useDynamicTargets'

export function DynamicTargetBanner() {
  const targets = useDynamicTargets()
  if (!targets.isWorkoutDay) return null
  return <Alert variant="info" title="Workout Day"><span className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-300" />Macro targets adjusted: +40g carbs, +10g protein, +250 kcal.</span></Alert>
}
