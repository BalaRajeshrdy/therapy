import { addDays, format, parseISO } from 'date-fns'
import type { ClockTime, ISODate } from '@/types'
import { clinic } from '@/data/clinic'

/** Today's date as seen in the clinic's timezone (America/Toronto). */
export function clinicToday(now: Date = new Date()): ISODate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: clinic.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function addDaysISO(date: ISODate, days: number): ISODate {
  return format(addDays(parseISO(date), days), 'yyyy-MM-dd')
}

export const toISODate = (d: Date): ISODate => format(d, 'yyyy-MM-dd')
export const fromISODate = (d: ISODate): Date => parseISO(d)

export function toMinutes(t: ClockTime): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(mins: number): ClockTime {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "13:30" -> "1:30 p.m." (Canadian English style) */
export function formatTime(t: ClockTime): string {
  const mins = toMinutes(t)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const suffix = h >= 12 ? 'p.m.' : 'a.m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export const formatLongDate = (d: ISODate) => format(parseISO(d), 'EEEE, MMMM d, yyyy')
export const formatMediumDate = (d: ISODate) => format(parseISO(d), 'EEE, MMM d')
export const weekdayOf = (d: ISODate) => parseISO(d).getDay()

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m) return `${h} hr ${m} min`
  return h === 1 ? '60 min' : `${h * 60} min`
}

const digitsOnly = (raw: string) => raw.replace(/\D/g, '').replace(/^1(?=\d{10})/, '')

/** Canadian / NANP phone formatting: 9055550148 -> (905) 555-0148 */
export function formatPhone(raw: string): string {
  const d = digitsOnly(raw).slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export const isValidPhone = (raw: string) => /^[2-9]\d{2}[2-9]\d{6}$/.test(digitsOnly(raw))
export const isValidEmail = (raw: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim())
