import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ISODate } from '@/types'
import type { DayStatus } from '@/utils/scheduling'
import { toISODate } from '@/utils/time'
import { cn } from '@/lib/utils'

interface CalendarProps {
  month: Date
  onMonthChange: (m: Date) => void
  selected: ISODate | null
  onSelect: (d: ISODate) => void
  getStatus: (d: ISODate) => DayStatus
  minDate: ISODate
  maxDate: ISODate
  today: ISODate
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Accessible date grid (WAI-ARIA grid pattern): arrow keys move by day/week,
 * Home/End jump within the week, PageUp/PageDown change month.
 */
export function Calendar({ month, onMonthChange, selected, onSelect, getStatus, minDate, maxDate, today }: CalendarProps) {
  const [direction, setDirection] = useState(0)
  const [focusDate, setFocusDate] = useState<ISODate>(selected ?? minDate)
  const gridRef = useRef<HTMLDivElement>(null)
  const shouldFocus = useRef(false)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    const out: Date[] = []
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d)
    return out
  }, [month])

  const statuses = useMemo(() => new Map(days.map((d) => [toISODate(d), getStatus(toISODate(d))])), [days, getStatus])

  const canPrev = format(month, 'yyyy-MM') > minDate.slice(0, 7)
  const canNext = format(month, 'yyyy-MM') < maxDate.slice(0, 7)

  const go = (delta: number) => {
    setDirection(delta)
    onMonthChange(addMonths(month, delta))
  }

  useEffect(() => {
    if (selected) setFocusDate(selected)
  }, [selected])

  // Keep roving focus target inside the visible month.
  useEffect(() => {
    if (!isSameMonth(parseISO(focusDate), month)) {
      const first = days.find((d) => isSameMonth(d, month) && statuses.get(toISODate(d))?.kind === 'available') ?? startOfMonth(month)
      setFocusDate(toISODate(first))
    }
  }, [month]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!shouldFocus.current) return
    shouldFocus.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus()
  }, [focusDate, month])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    const cur = parseISO(focusDate)
    let next: Date | null = null
    if (e.key in deltas) next = addDays(cur, deltas[e.key])
    else if (e.key === 'Home') next = startOfWeek(cur)
    else if (e.key === 'End') next = endOfWeek(cur)
    else if (e.key === 'PageUp') next = addMonths(cur, -1)
    else if (e.key === 'PageDown') next = addMonths(cur, 1)
    if (!next) return
    e.preventDefault()
    const iso = toISODate(next)
    if (iso < minDate.slice(0, 8) + '01' || iso > maxDate) return
    shouldFocus.current = true
    if (!isSameMonth(next, month)) {
      setDirection(next > cur ? 1 : -1)
      onMonthChange(startOfMonth(next))
    }
    setFocusDate(iso)
  }

  const monthKey = format(month, 'yyyy-MM')

  return (
    <div className="select-none">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-2xl text-forest" id="cal-label" aria-live="polite">
          {format(month, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!canPrev}
            className="grid size-10 place-items-center rounded-full border border-forest/15 text-forest transition-all hover:border-forest/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canNext}
            className="grid size-10 place-items-center rounded-full border border-forest/15 text-forest transition-all hover:border-forest/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 text-center text-[0.7rem] font-semibold uppercase tracking-wider text-charcoal-soft" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-2">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </span>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={monthKey}
            ref={gridRef}
            role="group"
            aria-labelledby="cal-label"
            onKeyDown={onKeyDown}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 gap-1 sm:gap-1.5"
          >
            {days.map((d) => {
              const iso = toISODate(d)
              const inMonth = isSameMonth(d, month)
              if (!inMonth) return <span key={iso} role="presentation" className="aspect-square" />
              const status = statuses.get(iso)!
              const available = status.kind === 'available'
              const isSelected = selected === iso
              const isToday = today === iso
              const label = `${format(d, 'EEEE, MMMM d, yyyy')}${
                available
                  ? ` — ${status.slots} time${status.slots === 1 ? '' : 's'} available`
                  : status.kind === 'blocked'
                    ? ` — unavailable (${status.reason})`
                    : status.kind === 'full'
                      ? ' — fully booked'
                      : ' — unavailable'
              }`
              return (
                <button
                  key={iso}
                  type="button"
                  data-date={iso}
                  tabIndex={iso === focusDate ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-disabled={!available}
                  aria-label={label}
                  title={status.kind === 'blocked' ? status.reason : status.kind === 'full' ? 'Fully booked' : undefined}
                  onClick={() => available && onSelect(iso)}
                  onFocus={() => setFocusDate(iso)}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-xl text-[0.95rem] transition-all duration-200 sm:rounded-2xl sm:text-base',
                    available && !isSelected && 'bg-sage-light/70 font-semibold text-forest hover:-translate-y-0.5 hover:bg-sage/60 hover:shadow-soft',
                    isSelected && 'bg-forest font-semibold text-ivory shadow-[0_10px_24px_-10px_rgba(41,75,67,0.8)]',
                    !available && 'cursor-not-allowed text-charcoal/30',
                    status.kind === 'blocked' && 'bg-[repeating-linear-gradient(135deg,transparent_0_5px,rgba(41,75,67,0.06)_5px_6px)]',
                    status.kind === 'full' && 'line-through decoration-charcoal/20',
                  )}
                >
                  {format(d, 'd')}
                  {available && (
                    <span className={cn('absolute bottom-1.5 size-1 rounded-full sm:bottom-2', isSelected ? 'bg-butter' : 'bg-forest-light')} aria-hidden />
                  )}
                  {isToday && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-terracotta" aria-hidden />}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-charcoal-soft">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded bg-sage-light ring-1 ring-sage" aria-hidden /> Available
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded bg-forest" aria-hidden /> Selected
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded bg-[repeating-linear-gradient(135deg,transparent_0_2px,rgba(41,75,67,0.25)_2px_3px)] ring-1 ring-forest/10" aria-hidden /> Unavailable
        </li>
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-terracotta" aria-hidden /> Today
        </li>
      </ul>
    </div>
  )
}
