import { Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { updateSettings } from '@/db/settingsRepository'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput } from '@/components/ui/field'
import { useSettings } from '@/hooks/useSettings'
import { useT } from '@/i18n'
import { ACCENT_OPTIONS } from '@/theme/accents'
import type { AccentName, Density, Locale, MicronutrientView, ReduceMotion, TodayHero } from '@/types'

const ACCENT_LABELS: Record<AccentName, keyof ReturnType<typeof useT>['t']['more']> = {
  emerald: 'accentEmerald',
  lime: 'accentLime',
  teal: 'accentTeal',
  cyan: 'accentCyan',
  violet: 'accentViolet',
  amber: 'accentAmber',
  rose: 'accentRose',
  blue: 'accentBlue',
}

export function AppearanceSettings() {
  const { t } = useT()
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
      <CardHeader icon={<Palette />} title={t.more.appearanceTitle} />
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-low">{t.more.accent}</p>
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
                  <span className="text-[11px]">{t.more[ACCENT_LABELS[option.value as AccentName]]}</span>
                </Button>
              )
            })}
          </div>
        </div>

        <Field label={t.more.language}>
          <SelectInput value={draft.locale} onChange={(event) => updateDraft('locale', event.target.value as Locale)}>
            <option value="en">{t.more.english}</option>
            <option value="de">{t.more.deutsch}</option>
          </SelectInput>
        </Field>

        <Field label={t.more.density}>
          <SelectInput value={draft.density} onChange={(event) => updateDraft('density', event.target.value as Density)}>
            <option value="comfortable">{t.more.comfortable}</option>
            <option value="compact">{t.more.compact}</option>
          </SelectInput>
        </Field>

        <Field label={t.more.motion}>
          <SelectInput value={draft.reduceMotion} onChange={(event) => updateDraft('reduceMotion', event.target.value as ReduceMotion)}>
            <option value="system">{t.more.motionSystem}</option>
            <option value="on">{t.more.reduceAlways}</option>
            <option value="off">{t.more.allowMotion}</option>
          </SelectInput>
        </Field>

        <Field label={t.more.todayHero}>
          <SelectInput value={draft.todayHero} onChange={(event) => updateDraft('todayHero', event.target.value as TodayHero)}>
            <option value="ring">{t.more.heroRing}</option>
            <option value="weight">{t.more.heroWeight}</option>
            <option value="stats">{t.more.heroStats}</option>
            <option value="streak">{t.more.heroStreak}</option>
          </SelectInput>
        </Field>

        <Field label={t.more.microView}>
          <SelectInput value={draft.micronutrientView} onChange={(event) => updateDraft('micronutrientView', event.target.value as MicronutrientView)}>
            <option value="radar">{t.more.viewRadar}</option>
            <option value="list">{t.more.viewList}</option>
          </SelectInput>
        </Field>

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={() => void saveChanges()}>{t.more.saveChanges}</Button>
        </div>
      </CardContent>
    </Card>
  )
}
