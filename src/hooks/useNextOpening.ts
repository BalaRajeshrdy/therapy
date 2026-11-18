import { useMemo } from 'react'
import { useDemoStore } from './useDemoStore'
import { treatments } from '@/data/treatments'
import { nextAvailable } from '@/utils/scheduling'
import { formatMediumDate, formatTime } from '@/utils/time'

/** "Thu, Nov 12 · 9:00 a.m." — the soonest opening across all assessments. */
export function useNextOpening(treatmentId?: string, therapistId: string | 'any' = 'any'): string | null {
  const { scheduleContext } = useDemoStore()
  return useMemo(() => {
    const list = treatmentId ? treatments.filter((t) => t.id === treatmentId) : treatments
    let best: { date: string; time: string } | null = null
    for (const t of list) {
      const n = nextAvailable(t, therapistId, scheduleContext)
      if (n && (!best || n.date + n.slot.time < best.date + best.time)) best = { date: n.date, time: n.slot.time }
    }
    return best ? `${formatMediumDate(best.date)} · ${formatTime(best.time)}` : null
  }, [scheduleContext, treatmentId, therapistId])
}
