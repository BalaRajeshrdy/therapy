import type { BlockedDate, ISODate } from '@/types'

/** Ontario statutory holidays (clinic closed), calculated for any year. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1)
  const offset = (weekday - first.getDay() + 7) % 7
  return new Date(year, month, 1 + offset + (n - 1) * 7)
}

/** Anonymous Gregorian algorithm */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const iso = (d: Date): ISODate =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function ontarioHolidays(year: number): BlockedDate[] {
  const easter = easterSunday(year)
  const goodFriday = new Date(year, easter.getMonth(), easter.getDate() - 2)
  // Victoria Day: the last Monday preceding May 25
  const may24 = new Date(year, 4, 24)
  const victoria = new Date(year, 4, 24 - ((may24.getDay() + 6) % 7))

  const list: [Date, string][] = [
    [new Date(year, 0, 1), 'New Year’s Day'],
    [nthWeekday(year, 1, 1, 3), 'Family Day'],
    [goodFriday, 'Good Friday'],
    [victoria, 'Victoria Day'],
    [new Date(year, 6, 1), 'Canada Day'],
    [nthWeekday(year, 7, 1, 1), 'Civic Holiday'],
    [nthWeekday(year, 8, 1, 1), 'Labour Day'],
    [nthWeekday(year, 9, 1, 2), 'Thanksgiving'],
    [new Date(year, 11, 24), 'Christmas Eve (clinic closed)'],
    [new Date(year, 11, 25), 'Christmas Day'],
    [new Date(year, 11, 26), 'Boxing Day'],
    [new Date(year, 11, 31), 'New Year’s Eve (clinic closed)'],
  ]
  return list.map(([d, reason]) => ({
    id: `holiday-${iso(d)}`,
    date: iso(d),
    therapistId: 'all',
    reason,
    source: 'holiday' as const,
  }))
}
