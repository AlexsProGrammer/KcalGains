import { Zap } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { useBodyMetrics } from '@/hooks/useBodyMetrics'
import { useDynamicTargets } from '@/hooks/useDynamicTargets'

export function DynamicTargetBanner() {
  const targets = useDynamicTargets()
  const { recommendedIntake, targetMacros } = useBodyMetrics()

  return (
    <Alert variant="info" title="Resolved targets">
      <span className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-300" />
        {targets.calories} kcal · {targetMacros.protein}P / {targetMacros.carbs}C / {targetMacros.fat}F
        <span className="text-slate-300">· recommended {recommendedIntake} kcal/day</span>
      </span>
    </Alert>
  )
}
