import { motion, useReducedMotion } from 'framer-motion'
import { CloudSun, Moon, Sun } from 'lucide-react'
import type { TimeSlot } from '@/types'
import { therapistById, fullName } from '@/data/therapists'
import { TherapistAvatar } from '@/components/therapists/TherapistCard'
import { formatTime, toMinutes } from '@/utils/time'
import { cn } from '@/lib/utils'

const groups = [
  { key: 'Morning', Icon: Sun, test: (m: number) => m < 12 * 60 },
  { key: 'Afternoon', Icon: CloudSun, test: (m: number) => m >= 12 * 60 && m < 16 * 60 },
  { key: 'Late afternoon & evening', Icon: Moon, test: (m: number) => m >= 16 * 60 },
]

export function TimeSlots({ slots, selected, onSelect, showTherapists }: { slots: TimeSlot[]; selected?: string | null; onSelect: (s: TimeSlot) => void; showTherapists?: boolean }) {
  const reduce = useReducedMotion()
  let index = 0
  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ key, Icon, test }) => {
        const items = slots.filter((s) => test(toMinutes(s.time)))
        if (!items.length) return null
        return (
          <div key={key} role="group" aria-label={`${key} appointments`}>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
              <Icon className="size-4 text-sage-dark" aria-hidden /> {key}
              <span className="font-normal normal-case tracking-normal">· {items.length} available</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-3">
              {items.map((s) => {
                const i = index++
                const isSel = selected === s.time
                return (
                  <motion.button
                    key={s.time}
                    type="button"
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    onClick={() => onSelect(s)}
                    aria-pressed={isSel}
                    aria-label={`${formatTime(s.time)} to ${formatTime(s.endTime)}${showTherapists ? ` with ${s.therapistIds.map((id) => fullName(therapistById(id)!)).join(' or ')}` : ''}`}
                    className={cn(
                      'group flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-[0.95rem] font-semibold transition-all duration-200',
                      isSel ? 'border-forest bg-forest text-ivory shadow-soft' : 'border-forest/15 bg-white text-forest hover:-translate-y-0.5 hover:border-forest hover:shadow-soft',
                    )}
                  >
                    {formatTime(s.time)}
                    {showTherapists && (
                      <span className="flex -space-x-2">
                        {s.therapistIds.slice(0, 2).map((id) => (
                          <TherapistAvatar key={id} therapist={therapistById(id)!} size={22} className="ring-[1.5px]" />
                        ))}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
