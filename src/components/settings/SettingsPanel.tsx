import { ModuleSettingsPanel } from '@/components/settings/ModuleSettingsPanel'
import { ProfileGoalForm } from '@/components/settings/ProfileGoalForm'

export function SettingsPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ProfileGoalForm />
      <ModuleSettingsPanel />
    </div>
  )
}
