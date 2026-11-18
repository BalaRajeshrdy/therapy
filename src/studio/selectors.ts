import { endOfWeek, format, getMonth, getYear, parseISO, startOfWeek, subMonths, subWeeks } from 'date-fns'
import type { ISODate, WaitlistEntry } from '@/types'
import { therapists, fullName } from '@/data/therapists'
import type { Appointment, Invoice, StudioState, Viewer } from './types'
import { invoiceBalance, isOverdue, noShowCount } from './engine'
import { pct, sum } from './util'

export const inMonth = (d: ISODate, ref: ISODate) => {
  const a = parseISO(d)
  const b = parseISO(ref)
  return getYear(a) === getYear(b) && getMonth(a) === getMonth(b)
}

export function visibleAppointments(s: StudioState, v: Viewer): Appointment[] {
  if (v.role === 'therapist') return s.appointments.filter((a) => a.therapistId === v.therapistId)
  if (v.role === 'parent') return s.appointments.filter((a) => a.familyId === v.familyId)
  return s.appointments
}

export const familyInvoices = (s: StudioState, familyId: string) => s.invoices.filter((i) => i.billTo.kind === 'family' && i.billTo.id === familyId)
export const familyBalance = (s: StudioState, familyId: string) => sum(familyInvoices(s, familyId).map(invoiceBalance))

export const paidOnTime = (inv: Invoice) => inv.status === 'paid' && inv.payments.length > 0 && inv.payments[inv.payments.length - 1].date <= inv.dueOn

export function ownerMetrics(s: StudioState, today: ISODate, waitlist: WaitlistEntry[], monthRef = today) {
  const monthAppts = s.appointments.filter((a) => inMonth(a.date, monthRef) && a.date <= today)
  const completed = monthAppts.filter((a) => a.status === 'completed')
  const siteVisits = s.siteVisits.filter((v) => v.status === 'completed' && inMonth(v.date, monthRef))
  const billable = monthAppts.filter((a) => ['completed', 'no-show', 'late-cancel'].includes(a.status))
  const noShows = monthAppts.filter((a) => a.status === 'no-show').length
  const paidInvoices = s.invoices.filter((i) => i.status === 'paid' && i.total > 0)
  const invoicedThisMonth = sum(s.invoices.filter((i) => i.status !== 'void').flatMap((i) => i.lines.filter((l) => inMonth(l.date, monthRef))).map((l) => l.amount))
  return {
    sessions: completed.length + siteVisits.length,
    clinicSessions: completed.length,
    siteVisits: siteVisits.length,
    noShowRate: pct(noShows, billable.length),
    noShows,
    waitlist: waitlist.filter((w) => w.status === 'waiting').length,
    paidOnTime: pct(paidInvoices.filter(paidOnTime).length, paidInvoices.length),
    invoiced: invoicedThisMonth,
    outstanding: sum(s.invoices.map(invoiceBalance)),
    overdue: s.invoices.filter((i) => isOverdue(i, today)).length,
    collected: sum(s.invoices.flatMap((i) => i.payments.filter((p) => inMonth(p.date, monthRef)).map((p) => p.amount))),
  }
}

export function sessionsPerWeek(s: StudioState, today: ISODate, weeks = 8) {
  const t = parseISO(today)
  return Array.from({ length: weeks }, (_, i) => {
    const ws = startOfWeek(subWeeks(t, weeks - 1 - i), { weekStartsOn: 1 })
    const we = endOfWeek(ws, { weekStartsOn: 1 })
    const a = format(ws, 'yyyy-MM-dd')
    const b = format(we, 'yyyy-MM-dd')
    const n = s.appointments.filter((x) => x.status === 'completed' && x.date >= a && x.date <= b).length + s.siteVisits.filter((v) => v.status === 'completed' && v.date >= a && v.date <= b).length
    return { label: format(ws, 'MMM d'), value: n }
  })
}

export function invoicedPerMonth(s: StudioState, today: ISODate, months = 4) {
  const t = parseISO(today)
  return Array.from({ length: months }, (_, i) => {
    const ref = format(subMonths(t, months - 1 - i), 'yyyy-MM-dd')
    return { label: format(parseISO(ref), 'MMM'), value: Math.round(sum(s.invoices.filter((x) => x.status !== 'void').flatMap((x) => x.lines.filter((l) => inMonth(l.date, ref))).map((l) => l.amount))) }
  })
}

export function therapistTable(s: StudioState, today: ISODate) {
  return therapists.map((t) => {
    const month = s.appointments.filter((a) => a.therapistId === t.id && inMonth(a.date, today) && a.date <= today)
    const done = month.filter((a) => a.status === 'completed')
    const notesDue = s.appointments.filter((a) => a.therapistId === t.id && a.status === 'completed' && !s.notes.some((n) => n.appointmentId === a.id && n.status === 'signed')).length
    return {
      id: t.id,
      name: fullName(t),
      sessions: done.length,
      home: done.filter((a) => a.mode === 'In-Home').length,
      km: Math.round(sum(done.map((a) => a.km ?? 0))),
      notesDue,
      siteVisits: s.siteVisits.filter((v) => v.therapistId === t.id && v.status === 'completed' && inMonth(v.date, today)).length,
    }
  })
}

export const noteTasks = (s: StudioState, therapistId?: string) =>
  s.appointments
    .filter((a) => a.status === 'completed' && (!therapistId || a.therapistId === therapistId) && !s.notes.some((n) => n.appointmentId === a.id && n.status === 'signed'))
    .sort((a, b) => b.date.localeCompare(a.date))

export const flaggedFamilies = (s: StudioState, today: ISODate) => new Set(s.families.filter((f) => noShowCount(s, f.id, today) >= 2).map((f) => f.id))
