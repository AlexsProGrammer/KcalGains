import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useWeightTrends } from '@/hooks/useWeightTrends'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function WeightTrendChart() {
  const { trend } = useWeightTrends()
  return <Card><CardHeader title="Weight trend" /><CardContent><div className="h-56">{trend.length > 0 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="weightKg" stroke="#94a3b8" strokeWidth={1} dot={{ r: 2, fill: '#94a3b8' }} name="Raw weight" /><Line type="monotone" dataKey="smoothedWeightKg" stroke="#34d399" strokeWidth={3} dot={false} name="EMA trend" /></LineChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-slate-600">Add weight entries to see the EMA trend.</p>}</div></CardContent></Card>
}
