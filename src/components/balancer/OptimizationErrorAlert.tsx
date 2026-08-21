import { Alert } from '@/components/ui/alert'
import type { BalancerResult } from '@/types/balancer.types'

export function OptimizationErrorAlert({ result }: { result: BalancerResult }) {
  if (result.status !== 'infeasible') return null
  return <Alert className="mt-3" variant="warning" title="Optimization is infeasible">The current food limits cannot satisfy all targets. Increase a maximum, reduce a target, or select a food with the missing macro.</Alert>
}
