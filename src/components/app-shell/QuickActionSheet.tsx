import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Camera, Dumbbell, UtensilsCrossed, Weight, Sparkles, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'

type QuickActionSheetProps = {
  open: boolean
  onClose: () => void
}

export function QuickActionSheet({ open, onClose }: QuickActionSheetProps) {
  const { t } = useT()
  const navigate = useNavigate()
  const location = useLocation()

  const actions = [
    { label: t.quickActions.logMeal, icon: UtensilsCrossed, tone: 'primary', action: 'meal' },
    { label: t.quickActions.logWeight, icon: Weight, tone: 'secondary', action: 'weight' },
    { label: t.quickActions.startWorkout, icon: Dumbbell, tone: 'secondary', action: 'workout' },
    { label: t.quickActions.scanBarcode, icon: Camera, tone: 'secondary', action: 'barcode' },
    { label: t.quickActions.aiImport, icon: Sparkles, tone: 'secondary', action: 'ai' },
  ] as const

  const handleAction = (action: (typeof actions)[number]['action']) => {
    onClose()

    switch (action) {
      case 'meal':
        navigate('/nutrition?tab=log', { replace: false })
        break
      case 'weight':
        if (location.pathname === '/today') {
          const nextUrl = '/today?weight=quick-add'
          window.history.pushState({}, '', nextUrl)
          window.dispatchEvent(new PopStateEvent('popstate'))
        } else {
          navigate('/today?weight=quick-add', { replace: false })
        }
        break
      case 'workout':
        navigate('/train', { replace: false })
        break
      case 'barcode':
        navigate('/nutrition?tab=barcode', { replace: false })
        break
      case 'ai':
        navigate('/more/ai', { replace: false })
        break
      default:
        break
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 bg-surface-0/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl rounded-t-[1.6rem] border border-line bg-surface-1 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 210, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-3" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">{t.shell.quickActions}</p>
                <h3 className="text-lg font-semibold text-ink-hi">{t.shell.quickActionsPrompt}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label={t.common.close}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {actions.map(({ label, icon: Icon, tone, action }) => (
                <Button
                  key={label}
                  variant={tone === 'primary' ? 'primary' : 'secondary'}
                  className="justify-start gap-3 px-4 py-3"
                  onClick={() => handleAction(action)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent-text">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-left">{label}</span>
                  <BarChart3 className="h-4 w-4 opacity-60" />
                </Button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
