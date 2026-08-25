import { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useT } from '@/i18n'
import { createEmptyMicronutrientTotals, getMicronutrientProgress, MICRONUTRIENT_KEYS, resolveMicronutrientTargets, type MicronutrientKey } from '@/services/micronutrientTargetService'
import type { Meal, Profile } from '@/types'

const labelMap: Record<MicronutrientKey, string> = {
  sodiumMg: 'Sodium',
  potassiumMg: 'Potassium',
  magnesiumMg: 'Magnesium',
  calciumMg: 'Calcium',
  zincMg: 'Zinc',
  ironMg: 'Iron',
  seleniumMcg: 'Selenium',
  vitaminDMcg: 'Vitamin D',
  vitaminB6Mg: 'Vitamin B6',
  vitaminB12Mcg: 'Vitamin B12',
  vitaminCMg: 'Vitamin C',
}

const unitMap: Record<MicronutrientKey, string> = {
  sodiumMg: 'mg',
  potassiumMg: 'mg',
  magnesiumMg: 'mg',
  calciumMg: 'mg',
  zincMg: 'mg',
  ironMg: 'mg',
  seleniumMcg: 'µg',
  vitaminDMcg: 'µg',
  vitaminB6Mg: 'mg',
  vitaminB12Mcg: 'µg',
  vitaminCMg: 'mg',
}

type MealMicronutrientSummaryProps = {
  meal: Meal
  profile?: Profile | null
  compact?: boolean
}

export function MealMicronutrientSummary({ meal, profile, compact = false }: MealMicronutrientSummaryProps) {
  const { settings } = useSettings()
  const { t } = useT()
  const [isOpen, setIsOpen] = useState(false)
  const totals = meal.totalMicros ?? createEmptyMicronutrientTotals()
  const targets = resolveMicronutrientTargets(profile)

  const items = MICRONUTRIENT_KEYS
    .filter((key) => targets[key] > 0)
    .map((key) => ({
      key,
      label: labelMap[key],
      unit: unitMap[key],
      value: totals[key] ?? 0,
      target: targets[key],
      percent: getMicronutrientProgress(totals[key] ?? 0, targets[key]),
    }))
    .filter((item) => item.target > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, compact ? 3 : 5)

  if (items.length === 0) {
    return null
  }

  if (settings.micronutrientView === 'radar') {
    return (
      <div className="mt-3 rounded-xl border border-line bg-surface-1 p-3">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-low">{t.nutrition.micros}</span>
          <span className="flex items-center gap-2 text-ink-mid">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-low">{items.length} {t.common.tracked}</span>
            <span className="text-base leading-none">{isOpen ? '−' : '+'}</span>
          </span>
        </button>
        {isOpen ? (
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[10px] text-ink-mid">
                  <span>{item.label}</span>
                  <span className="num">{item.value.toFixed(0)}/{item.target.toFixed(0)} {item.unit}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300" style={{ width: `${Math.min(100, item.percent)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface-1 p-3">
<button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-low">{t.nutrition.micros}</span>
          <span className="flex items-center gap-2 text-ink-mid">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-low">{items.length} {t.common.tracked}</span>
            <span className="text-base leading-none">{isOpen ? '−' : '+'}</span>
          </span>
        </button>
        {isOpen ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[10px] text-ink-mid">
                <span>{item.label}</span>
                <span className="num">{item.value.toFixed(0)}/{item.target.toFixed(0)} {item.unit}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300" style={{ width: `${Math.min(100, item.percent)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
