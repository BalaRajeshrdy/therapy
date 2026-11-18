import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const BOOKING_STEPS = ['Treatment', 'Therapist', 'Date & Time', 'Your Details', 'Confirm']

export function StepIndicator({ current, onStepClick }: { current: number; onStepClick?: (i: number) => void }) {
  return (
    <nav aria-label="Booking progress">
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {BOOKING_STEPS.map((label, i) => {
          const done = i < current
          const active = i === current
          const clickable = done && onStepClick
          return (
            <li key={label} className={cn('flex items-center gap-1.5 sm:gap-2', i < BOOKING_STEPS.length - 1 && 'flex-1')}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(i)}
                aria-current={active ? 'step' : undefined}
                className={cn('flex shrink-0 items-center gap-2 rounded-full transition-colors', clickable && 'hover:opacity-80')}
              >
                <span
                  className={cn(
                    'relative grid size-8 place-items-center rounded-full text-sm font-semibold transition-all duration-300',
                    done && 'bg-forest text-ivory',
                    active && 'bg-forest text-ivory ring-4 ring-sage/50',
                    !done && !active && 'bg-white text-charcoal-soft ring-1 ring-forest/15',
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn('hidden text-sm font-semibold lg:inline', active || done ? 'text-forest' : 'text-charcoal-soft')}>
                  {label}
                  <span className="sr-only">{done ? ' (completed)' : active ? ' (current step)' : ''}</span>
                </span>
              </button>
              {i < BOOKING_STEPS.length - 1 && (
                <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-forest/10" aria-hidden>
                  <motion.span className="absolute inset-y-0 left-0 bg-forest" initial={false} animate={{ width: done ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-sm font-semibold text-forest lg:hidden">
        Step {current + 1} of {BOOKING_STEPS.length}: <span className="font-normal text-charcoal-soft">{BOOKING_STEPS[current]}</span>
      </p>
    </nav>
  )
}
