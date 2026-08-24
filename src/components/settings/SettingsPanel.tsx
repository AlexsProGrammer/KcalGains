import { AppearanceSettings } from '@/components/settings/AppearanceSettings'
import { ModuleSettingsPanel } from '@/components/settings/ModuleSettingsPanel'
import { ProfileGoalForm } from '@/components/settings/ProfileGoalForm'
import { TrainingModeSettingsForm } from '@/components/settings/TrainingModeSettingsForm'

export function SettingsPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <ProfileGoalForm />
        <TrainingModeSettingsForm />
      </div>
      <div className="space-y-4">
        <ModuleSettingsPanel />
        <AppearanceSettings />
      </div>
    </div>
  )
}
