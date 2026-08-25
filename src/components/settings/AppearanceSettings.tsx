import { Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { updateSettings } from '@/db/settingsRepository'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput } from '@/components/ui/field'
import { useSettings } from '@/hooks/useSettings'
import { ACCENT_OPTIONS } from '@/theme/accents'
import type { AccentName, Density, Locale, MicronutrientView, ReduceMotion, TodayHero } from '@/types'

export function AppearanceSettings() {
  const { settings, setSetting } = useSettings()
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  async function saveChanges() {
    await updateSettings({
      accent: draft.accent,
      locale: draft.locale,
      density: draft.density,
      reduceMotion: draft.reduceMotion,
      todayHero: draft.todayHero,
      micronutrientView: draft.micronutrientView,
    })
  }

  const updateDraft = <Key extends keyof typeof draft>(key: Key, value: (typeof draft)[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  return (
    <Card>
      <CardHeader icon={<Palette />} title="Appearance" />
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-low">Accent</p>
          <div className="grid grid-cols-4 gap-2">
            {ACCENT_OPTIONS.map((option) => {
              const active = draft.accent === option.value
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={active ? 'primary' : 'secondary'}
                  className="justify-start gap-2 px-2 py-2"
                  onClick={() => updateDraft('accent', option.value as AccentName)}
                >
                  <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: option.swatch }} />
                  <span className="text-[11px]">{option.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        <Field label="Language">
          <SelectInput value={draft.locale} onChange={(event) => updateDraft('locale', event.target.value as Locale)}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </SelectInput>
        </Field>

        <Field label="Density">
          <SelectInput value={draft.density} onChange={(event) => updateDraft('density', event.target.value as Density)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </SelectInput>
        </Field>

        <Field label="Motion">
          <SelectInput value={draft.reduceMotion} onChange={(event) => updateDraft('reduceMotion', event.target.value as ReduceMotion)}>
            <option value="system">System</option>
            <option value="on">Always reduce</option>
            <option value="off">Allow motion</option>
          </SelectInput>
        </Field>

        <Field label="Today hero">
          <SelectInput value={draft.todayHero} onChange={(event) => updateDraft('todayHero', event.target.value as TodayHero)}>
            <option value="ring">Calorie ring</option>
            <option value="weight">Weight / BMI</option>
            <option value="stats">Stat grid</option>
            <option value="streak">Streak</option>
          </SelectInput>
        </Field>

        <Field label="Micronutrient view">
          <SelectInput value={draft.micronutrientView} onChange={(event) => updateDraft('micronutrientView', event.target.value as MicronutrientView)}>
            <option value="radar">Radar</option>
            <option value="list">List</option>
          </SelectInput>
        </Field>

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={() => void saveChanges()}>Save changes</Button>
        </div>
      </CardContent>
    </Card>
  )
}
