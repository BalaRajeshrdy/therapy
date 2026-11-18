/**
 * In-browser availability engine for the demo booking portal.
 *
 * Availability = therapist weekly schedule
 *   − Ontario statutory holidays
 *   − mock blocked days (deterministic) and admin-blocked days (localStorage)
 *   − mode restrictions (e.g. in-home visits only on certain weekdays)
 *   − mock appointments from "other families" (deterministic)
 *   − demo bookings created in this browser (localStorage)
 * and a slot only exists where the full treatment duration fits.
 *
 * Everything here is pure and UI-agnostic.
 */
import type { BlockedDate, Booking, BusyInterval, ISODate, TimeSlot, Treatment } from '@/types'
import { availabilityFor, mockBlockRules } from '@/data/availability'
import { therapists } from '@/data/therapists'
import { clinic } from '@/data/clinic'
import { hashString } from '@/lib/utils'
import { addDaysISO, clinicToday, fromMinutes, toMinutes, weekdayOf } from './time'
import { ontarioHolidays } from './holidays'

export interface ScheduleContext {
  bookings: Booking[]
  adminBlocked: BlockedDate[]
  today?: ISODate
  /** Ignore this booking when computing conflicts (used when rescheduling). */
  excludeBookingId?: string
}

export type DayStatus =
  | { kind: 'available'; slots: number }
  | { kind: 'full' }
  | { kind: 'blocked'; reason: string }
  | { kind: 'closed' }
  | { kind: 'past' }
  | { kind: 'beyond' }

const MOCK_BASE_DURATION = 60

export function bookingWindow(today = clinicToday()) {
  return { earliest: addDaysISO(today, 1), latest: addDaysISO(today, clinic.bookingHorizonDays) }
}

const holidayCache = new Map<number, BlockedDate[]>()
function holidaysFor(year: number) {
  if (!holidayCache.has(year)) holidayCache.set(year, ontarioHolidays(year))
  return holidayCache.get(year)!
}

export function getBlock(therapistId: string, date: ISODate, ctx: ScheduleContext): BlockedDate | null {
  const year = Number(date.slice(0, 4))
  const holiday = holidaysFor(year).find((h) => h.date === date)
  if (holiday) return holiday

  const admin = ctx.adminBlocked.find((b) => b.date === date && (b.therapistId === 'all' || b.therapistId === therapistId))
  if (admin) return admin

  const rule = mockBlockRules[therapistId]
  if (rule && hashString(`block|${therapistId}|${date}`) % rule.every === 0) {
    return { id: `mock-${therapistId}-${date}`, date, therapistId, reason: rule.reason, source: 'mock' }
  }
  return null
}

/** Deterministic appointments already booked by other (fictional) families. */
export function mockBusy(therapistId: string, date: ISODate): BusyInterval[] {
  const avail = availabilityFor(therapistId)
  const windows = avail?.weekly[weekdayOf(date)]
  if (!avail || !windows) return []
  const busy: BusyInterval[] = []
  for (const w of windows) {
    for (let t = toMinutes(w.start); t + MOCK_BASE_DURATION <= toMinutes(w.end); t += avail.slotStepMinutes) {
      const start = fromMinutes(t)
      if (hashString(`busy|${therapistId}|${date}|${start}`) % 100 < avail.mockOccupancy) {
        busy.push({ therapistId, date, start, end: fromMinutes(t + MOCK_BASE_DURATION), source: 'mock' })
      }
    }
  }
  return busy
}

export function demoBusy(therapistId: string, date: ISODate, ctx: ScheduleContext): BusyInterval[] {
  return ctx.bookings
    .filter((b) => b.status === 'confirmed' && b.therapistId === therapistId && b.date === date && b.id !== ctx.excludeBookingId)
    .map((b) => ({ therapistId, date, start: b.startTime, end: b.endTime, source: 'demo' as const, bookingId: b.id }))
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd

/** Slots for ONE therapist on ONE date. */
export function therapistSlots(treatment: Treatment, therapistId: string, date: ISODate, ctx: ScheduleContext): TimeSlot[] {
  const therapist = therapists.find((t) => t.id === therapistId)
  const avail = availabilityFor(therapistId)
  if (!therapist || !avail || !therapist.treatmentIds.includes(treatment.id)) return []

  const { earliest, latest } = bookingWindow(ctx.today)
  if (date < earliest || date > latest) return []

  const weekday = weekdayOf(date)
  const windows = avail.weekly[weekday]
  if (!windows?.length) return []

  const allowedDays = avail.modeDays?.[treatment.mode]
  if (allowedDays && !allowedDays.includes(weekday)) return []

  if (getBlock(therapistId, date, ctx)) return []

  const busy = [...mockBusy(therapistId, date), ...demoBusy(therapistId, date, ctx)].map((b) => [toMinutes(b.start), toMinutes(b.end)])
  const duration = treatment.durationMinutes
  const slots: TimeSlot[] = []

  for (const w of windows) {
    const wEnd = toMinutes(w.end)
    for (let t = toMinutes(w.start); t + duration <= wEnd; t += avail.slotStepMinutes) {
      const end = t + duration
      if (busy.some(([bs, be]) => overlaps(t, end, bs, be))) continue
      slots.push({ time: fromMinutes(t), endTime: fromMinutes(end), therapistIds: [therapistId] })
    }
  }
  return slots
}

export const therapistsFor = (treatment: Treatment) => therapists.filter((t) => t.treatmentIds.includes(treatment.id))

/** Slots for a therapist or for "any available therapist" (merged by start time). */
export function slotsFor(treatment: Treatment, selection: string | 'any', date: ISODate, ctx: ScheduleContext): TimeSlot[] {
  if (selection !== 'any') return therapistSlots(treatment, selection, date, ctx)
  const merged = new Map<string, TimeSlot>()
  for (const t of therapistsFor(treatment)) {
    for (const s of therapistSlots(treatment, t.id, date, ctx)) {
      const existing = merged.get(s.time)
      if (existing) existing.therapistIds.push(...s.therapistIds)
      else merged.set(s.time, { ...s, therapistIds: [...s.therapistIds] })
    }
  }
  return [...merged.values()].sort((a, b) => a.time.localeCompare(b.time))
}

export function dayStatus(treatment: Treatment, selection: string | 'any', date: ISODate, ctx: ScheduleContext): DayStatus {
  const today = ctx.today ?? clinicToday()
  const { earliest, latest } = bookingWindow(today)
  if (date < earliest) return { kind: 'past' }
  if (date > latest) return { kind: 'beyond' }

  const ids = selection === 'any' ? therapistsFor(treatment).map((t) => t.id) : [selection]
  const slots = slotsFor(treatment, selection, date, ctx).length
  if (slots > 0) return { kind: 'available', slots }

  const weekday = weekdayOf(date)
  const working = ids.filter((id) => availabilityFor(id)?.weekly[weekday]?.length)
  if (working.length === 0) return { kind: 'closed' }
  const blocks = working.map((id) => getBlock(id, date, { ...ctx, today }))
  if (blocks.every(Boolean)) return { kind: 'blocked', reason: blocks[0]!.reason }
  const modeOk = working.some((id) => {
    const allowed = availabilityFor(id)?.modeDays?.[treatment.mode]
    return !allowed || allowed.includes(weekday)
  })
  if (!modeOk) return { kind: 'closed' }
  return { kind: 'full' }
}

export function nextAvailable(
  treatment: Treatment,
  selection: string | 'any',
  ctx: ScheduleContext,
  from?: ISODate,
): { date: ISODate; slot: TimeSlot } | null {
  const { earliest, latest } = bookingWindow(ctx.today)
  let d = from && from > earliest ? from : earliest
  while (d <= latest) {
    const slots = slotsFor(treatment, selection, d, ctx)
    if (slots.length) return { date: d, slot: slots[0] }
    d = addDaysISO(d, 1)
  }
  return null
}

export function isSlotStillAvailable(
  treatment: Treatment,
  therapistId: string,
  date: ISODate,
  time: string,
  ctx: ScheduleContext,
): boolean {
  return therapistSlots(treatment, therapistId, date, ctx).some((s) => s.time === time)
}

/** Deterministically choose a therapist for an "any available" slot (least-busy first). */
export function pickTherapist(slot: TimeSlot, date: ISODate, ctx: ScheduleContext): string {
  const load = (id: string) => mockBusy(id, date).length + demoBusy(id, date, ctx).length
  return [...slot.therapistIds].sort((a, b) => load(a) - load(b) || a.localeCompare(b))[0]
}
