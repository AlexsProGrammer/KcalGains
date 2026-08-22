import { de } from '@/i18n/de'
import { en } from '@/i18n/en'
import { LocaleSchema } from '@/schemas/settings.schema'
import { useSettings } from '@/hooks/useSettings'

export const dictionaries = { en, de } as const
export type LocaleKey = keyof typeof dictionaries
export type TranslationKey = keyof typeof en

export function getLocale(): LocaleKey {
  const locale = typeof window !== 'undefined' ? window.document.documentElement.lang : 'en'
  return LocaleSchema.safeParse(locale).success ? (locale as LocaleKey) : 'en'
}

export function useT() {
  const { settings } = useSettings()
  const dictionary = dictionaries[settings.locale] ?? dictionaries.en

  return {
    t: <K extends keyof typeof en>(key: K) => dictionary[key],
    locale: settings.locale,
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(settings.locale, options).format(value),
    formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(settings.locale, options).format(new Date(value)),
    formatWeight: (value: number, unit: 'kg' | 'lb' = 'kg') =>
      `${new Intl.NumberFormat(settings.locale, { maximumFractionDigits: 1 }).format(value)} ${unit}`,
  }
}
