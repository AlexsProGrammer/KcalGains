import { useEffect, useRef } from 'react'
import { useT } from '@/i18n'

export function RestTimerOverlay({ seconds }: { seconds: number }) {
  const { t } = useT()
  const previous = useRef(seconds)
  useEffect(() => {
    if (previous.current > 0 && seconds === 0) {
      if ('vibrate' in navigator) navigator.vibrate?.(250)
      try { const context = new AudioContext(); const oscillator = context.createOscillator(); oscillator.connect(context.destination); oscillator.frequency.value = 660; oscillator.start(); oscillator.stop(context.currentTime + 0.15) } catch { /* Audio may be unavailable. */ }
    }
    previous.current = seconds
  }, [seconds])
  if (seconds <= 0) return null
  return <div className="fixed bottom-5 right-5 z-40 rounded-full border border-emerald-400/40 bg-slate-900 px-4 py-3 text-sm font-semibold text-emerald-300 shadow-xl">{t.train.restTimer.replace('{time}', `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`)}</div>
}
