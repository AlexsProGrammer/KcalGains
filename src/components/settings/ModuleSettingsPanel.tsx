import { SlidersHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput } from '@/components/ui/field'
import { Toggle } from '@/components/ui/toggle'
import { useSettings } from '@/hooks/useSettings'
import { useT } from '@/i18n'
import type { ViewMode } from '@/types'

export function ModuleSettingsPanel() {
  const { settings, setSetting } = useSettings()
  const { t } = useT()

  return (
    <Card>
      <CardHeader icon={<SlidersHorizontal />} title={t.more.moduleTitle} />
      <CardContent className="space-y-3">
        <Toggle
          checked={settings.moduleChaining}
          onChange={(checked) => void setSetting('moduleChaining', checked)}
          label={t.more.connectModules}
          description={t.more.connectModulesDesc}
        />
        <Toggle
          checked={settings.autoWeightFromLogs}
          onChange={(checked) => void setSetting('autoWeightFromLogs', checked)}
          label={t.more.useLatestWeight}
          disabled={!settings.moduleChaining}
          description={t.more.useLatestWeightDesc}
        />
        <Toggle
          checked={settings.autoTargetsFromGoal}
          onChange={(checked) => void setSetting('autoTargetsFromGoal', checked)}
          label={t.more.deriveTargets}
          disabled={!settings.moduleChaining}
          description={t.more.deriveTargetsDesc}
        />
        <Toggle
          checked={settings.snapshotTargetsToDailyLog}
          onChange={(checked) => void setSetting('snapshotTargetsToDailyLog', checked)}
          label={t.more.snapshotTargets}
          disabled={!settings.moduleChaining}
          description={t.more.snapshotTargetsDesc}
        />
        <Field label={t.more.defaultView}>
          <SelectInput value={settings.defaultView} onChange={(event) => void setSetting('defaultView', event.target.value as ViewMode)}>
            <option value="graph">{t.more.viewGraph}</option>
            <option value="list">{t.more.viewList}</option>
          </SelectInput>
        </Field>
      </CardContent>
    </Card>
  )
}
