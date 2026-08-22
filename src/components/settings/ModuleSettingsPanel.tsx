import { SlidersHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput } from '@/components/ui/field'
import { Toggle } from '@/components/ui/toggle'
import { useSettings } from '@/hooks/useSettings'
import type { ViewMode } from '@/types'

export function ModuleSettingsPanel() {
  const { settings, setSetting } = useSettings()

  return (
    <Card>
      <CardHeader icon={<SlidersHorizontal />} title="Module behaviour" />
      <CardContent className="space-y-3">
        <Toggle
          checked={settings.moduleChaining}
          onChange={(checked) => void setSetting('moduleChaining', checked)}
          label="Connect modules"
          description="Let BMI, weight logs, balancer and AI bridge share data. Turn off to run every module standalone."
        />
        <Toggle
          checked={settings.autoWeightFromLogs}
          onChange={(checked) => void setSetting('autoWeightFromLogs', checked)}
          label="Use latest logged weight"
          disabled={!settings.moduleChaining}
          description="BMI and energy needs follow your weight table instead of the fixed profile weight."
        />
        <Toggle
          checked={settings.autoTargetsFromGoal}
          onChange={(checked) => void setSetting('autoTargetsFromGoal', checked)}
          label="Derive targets from goal"
          disabled={!settings.moduleChaining}
          description="Calorie and macro targets are calculated from your goal instead of entered manually."
        />
        <Toggle
          checked={settings.snapshotTargetsToDailyLog}
          onChange={(checked) => void setSetting('snapshotTargetsToDailyLog', checked)}
          label="Snapshot daily targets"
          disabled={!settings.moduleChaining}
          description="Stores the resolved targets per day so history stays accurate after a goal change."
        />
        <Field label="Default view for lists and charts">
          <SelectInput value={settings.defaultView} onChange={(event) => void setSetting('defaultView', event.target.value as ViewMode)}>
            <option value="graph">Graph (read-only)</option>
            <option value="list">List (editable)</option>
          </SelectInput>
        </Field>
      </CardContent>
    </Card>
  )
}
