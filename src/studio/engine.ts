import { addDays, format, parseISO, startOfMonth, subMonths, endOfMonth } from 'date-fns'
import type { ClockTime, ISODate, SessionMode, WaitlistEntry } from '@/types'
import { therapistAvailability } from '@/data/availability'
import { therapistById, fullName } from '@/data/therapists'
import { fromMinutes, toMinutes, addDaysISO, weekdayOf } from '@/utils/time'
import type { Appointment, Family, Invoice, InvoiceLine, Lang, MessageKind, RuleId, StudioState, TreatmentPlan, WaitlistOffer } from './types'
import { renderMessage, type MessageVars, activityTitle } from './messages'
import { rooms, serviceById } from './reference'
import { atClinic, hoursUntil, round2, sid, sum, daysBetween } from './util'

export interface Ctx {
  s: StudioState
  now: Date
  actor: string
  waitlist: WaitlistEntry[]
}

const iso = (c: Ctx) => c.now.toISOString()
export const todayOf = (c: Ctx): ISODate =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(c.now)

const ruleOn = (c: Ctx, id: RuleId) => c.s.rules.find((r) => r.id === id)?.enabled !== false

export function audit(c: Ctx, action: string, target: string) {
  c.s.audit.unshift({ id: sid('au'), at: iso(c), actor: c.actor, action, target })
  if (c.s.audit.length > 400) c.s.audit.length = 400
}

export function event(c: Ctx, ruleId: RuleId, title: string, detail: string, link?: string) {
  c.s.events.unshift({ id: sid('ev'), at: iso(c), ruleId, title, detail, link })
  if (c.s.events.length > 400) c.s.events.length = 400
}

export const familyById = (s: StudioState, id?: string) => s.families.find((f) => f.id === id)
export const childById = (s: StudioState, id?: string) => s.children.find((ch) => ch.id === id)
export const childName = (s: StudioState, id?: string) => {
  const ch = childById(s, id)
  return ch ? `${ch.firstName} ${ch.lastName}` : 'Unknown child'
}
export const therapistName = (id?: string) => {
  const t = therapistById(id)
  return t ? fullName(t) : 'Any therapist'
}

export function send(c: Ctx, kind: MessageKind, family: Family | undefined, vars: MessageVars, overrideTo?: { to: string; lang?: Lang }) {
  const lang: Lang = overrideTo?.lang ?? family?.language ?? 'en'
  const g = family?.guardians[0]
  const channel = family?.preferredChannel ?? 'email'
  const to = overrideTo?.to ?? (channel === 'sms' ? g?.phone : g?.email) ?? 'unknown'
  const msg = renderMessage(kind, lang, { parent: g?.name.split(' ')[0], ...vars })
  c.s.outbox.unshift({ id: sid('msg'), at: iso(c), channel: overrideTo ? 'email' : channel, familyId: family?.id, to, lang, kind, ...msg })
  if (c.s.outbox.length > 400) c.s.outbox.length = 400
}

/* ---------- Scheduling helpers ---------- */

const overlaps = (aS: string, aE: string, bS: string, bE: string) => toMinutes(aS) < toMinutes(bE) && toMinutes(bS) < toMinutes(aE)
const active = (a: Appointment) => a.status !== 'cancelled'

export function therapistConflict(s: StudioState, therapistId: string, date: ISODate, start: ClockTime, end: ClockTime, excludeId?: string) {
  const appt = s.appointments.find((a) => a.id !== excludeId && active(a) && a.therapistId === therapistId && a.date === date && overlaps(a.start, a.end, start, end))
  if (appt) return `${therapistName(therapistId)} already has ${childName(s, appt.childId)} at that time.`
  const sv = s.siteVisits.find((v) => v.therapistId === therapistId && v.date === date && overlaps(v.start, v.end, start, end))
  if (sv) return `${therapistName(therapistId)} is at ${s.sites.find((x) => x.id === sv.siteId)?.name} then.`
  return null
}

export function roomFree(s: StudioState, roomId: string, date: ISODate, start: ClockTime, end: ClockTime, excludeId?: string) {
  return !s.appointments.some((a) => a.id !== excludeId && active(a) && a.roomId === roomId && a.date === date && overlaps(a.start, a.end, start, end))
}

export function pickRoom(s: StudioState, mode: SessionMode, date: ISODate, start: ClockTime, end: ClockTime, excludeId?: string) {
  if (mode === 'In-Home') return undefined
  const order = mode === 'Virtual' ? ['tele'] : ['gym', 'room-a', 'room-b']
  return order.find((r) => roomFree(s, r, date, start, end, excludeId))
}

/** Open start times for a therapist on a date (studio view, within working windows). */
export function openSlots(s: StudioState, therapistId: string, date: ISODate, minutes: number, excludeId?: string): ClockTime[] {
  const av = therapistAvailability.find((a) => a.therapistId === therapistId)
  const windows = av?.weekly[weekdayOf(date)] ?? []
  const out: ClockTime[] = []
  for (const w of windows) {
    for (let m = toMinutes(w.start); m + minutes <= toMinutes(w.end); m += 30) {
      const st = fromMinutes(m)
      const en = fromMinutes(m + minutes)
      if (!therapistConflict(s, therapistId, date, st, en, excludeId)) out.push(st)
    }
  }
  return out
}

export interface NewAppointment {
  childId: string
  therapistId: string
  serviceId: string
  date: ISODate
  start: ClockTime
  source: Appointment['source']
  roomId?: string
  seriesId?: string
  bookingRef?: string
  bookingId?: string
}

export function createAppointment(c: Ctx, input: NewAppointment): { ok: true; appt: Appointment } | { ok: false; error: string } {
  const svc = serviceById(input.serviceId)
  const child = childById(c.s, input.childId)
  if (!svc || !child) return { ok: false, error: 'Choose a child and a service.' }
  const end = fromMinutes(toMinutes(input.start) + svc.durationMinutes)
  const conflict = therapistConflict(c.s, input.therapistId, input.date, input.start, end)
  if (conflict) return { ok: false, error: conflict }
  const roomId = input.roomId ?? pickRoom(c.s, svc.mode, input.date, input.start, end)
  if (input.roomId && !roomFree(c.s, input.roomId, input.date, input.start, end)) return { ok: false, error: 'That room is already booked then.' }
  const fam = familyById(c.s, child.familyId)
  const appt: Appointment = {
    id: sid('ap'),
    childId: child.id,
    familyId: child.familyId ?? '',
    therapistId: input.therapistId,
    serviceId: svc.id,
    date: input.date,
    start: input.start,
    end,
    mode: svc.mode,
    status: 'scheduled',
    roomId,
    km: svc.mode === 'In-Home' && fam ? homeKm(fam) : undefined,
    remindersSent: [],
    familyConfirmed: false,
    source: input.source,
    seriesId: input.seriesId,
    bookingRef: input.bookingRef,
    bookingId: input.bookingId,
  }
  c.s.appointments.push(appt)
  return { ok: true, appt }
}

export function homeKm(f: Family) {
  // clinic → home → clinic, rounded
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const a = { lat: 43.5905, lng: -79.7581 }
  const dLat = toRad(f.geo.lat - a.lat)
  const dLng = toRad(f.geo.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(f.geo.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.3 * 2 * 10) / 10
}

export function noShowCount(s: StudioState, familyId: string, today: ISODate) {
  return s.appointments.filter((a) => a.familyId === familyId && (a.status === 'no-show' || a.status === 'late-cancel') && daysBetween(a.date, today) <= 90 && daysBetween(a.date, today) >= 0).length
}

/* ---------- Billing ---------- */

export const invoiceBalance = (inv: Invoice) => (inv.status === 'void' ? 0 : round2(inv.total - sum(inv.payments.map((p) => p.amount))))
export const isOverdue = (inv: Invoice, today: ISODate) => inv.status === 'issued' && invoiceBalance(inv) > 0 && inv.dueOn < today

export function lineForAppointment(c: Ctx, a: Appointment): InvoiceLine {
  const svc = serviceById(a.serviceId)!
  const fee = c.s.settings.fees[a.serviceId] ?? 0
  const pct = a.status === 'no-show' ? c.s.settings.noShowFeePct : a.status === 'late-cancel' ? c.s.settings.lateCancelFeePct : 100
  const label = a.status === 'no-show' ? ` — no-show fee (${pct}%)` : a.status === 'late-cancel' ? ` — late cancellation (${pct}%)` : ''
  const pkg = a.status === 'completed' && svc.kind === 'session' ? c.s.packages.find((p) => p.familyId === a.familyId && p.used < p.sessions && p.purchasedOn <= a.date) : undefined
  if (pkg) {
    pkg.used += 1
    a.packageId = pkg.id
    return { id: sid('ln'), description: `${svc.name} · ${childName(c.s, a.childId)} — covered by ${pkg.name} (${pkg.used}/${pkg.sessions})`, date: a.date, therapistId: a.therapistId, appointmentId: a.id, qty: 1, unitPrice: 0, amount: 0 }
  }
  const unit = round2((fee * pct) / 100)
  return { id: sid('ln'), description: `${svc.name} · ${childName(c.s, a.childId)}${label}`, date: a.date, therapistId: a.therapistId, appointmentId: a.id, qty: 1, unitPrice: unit, amount: unit }
}

export function issueInvoice(c: Ctx, billTo: Invoice['billTo'], lines: InvoiceLine[], batch: Invoice['batch'], issuedOn = todayOf(c), terms?: number): Invoice {
  c.s.counters.invoice += 1
  const termsDays = terms ?? (billTo.kind === 'site' ? c.s.sites.find((x) => x.id === billTo.id)?.billingTermsDays ?? 30 : c.s.settings.paymentTermsDays)
  const inv: Invoice = {
    id: sid('inv'),
    number: `INV-${c.s.counters.invoice}`,
    billTo,
    lines,
    issuedOn,
    dueOn: addDaysISO(issuedOn, termsDays),
    status: 'issued',
    total: round2(sum(lines.map((l) => l.amount))),
    payments: [],
    reminders: [],
    batch,
  }
  if (inv.total === 0) inv.status = 'paid'
  c.s.invoices.push(inv)
  for (const l of lines) {
    const a = c.s.appointments.find((x) => x.id === l.appointmentId)
    if (a) a.invoiceId = inv.id
    const v = c.s.siteVisits.find((x) => x.id === l.siteVisitId)
    if (v) v.invoiceId = inv.id
  }
  if (billTo.kind === 'family') {
    send(c, 'invoice', familyById(c.s, billTo.id), { number: inv.number, amount: inv.total, due: inv.dueOn })
  }
  return inv
}

export function recordPayment(c: Ctx, invoiceId: string, amount: number, method: Invoice['payments'][number]['method'], date = todayOf(c)) {
  const inv = c.s.invoices.find((i) => i.id === invoiceId)
  if (!inv || amount <= 0) return
  c.s.counters.receipt += 1
  const pay = { id: sid('pay'), amount: round2(Math.min(amount, invoiceBalance(inv))), method, date, receiptNo: `RCT-${c.s.counters.receipt}` }
  inv.payments.push(pay)
  if (invoiceBalance(inv) <= 0) inv.status = 'paid'
  audit(c, `Recorded ${method} payment`, `${inv.number}`)
  if (ruleOn(c, 'payment-recorded')) {
    const fam = inv.billTo.kind === 'family' ? familyById(c.s, inv.billTo.id) : undefined
    if (fam) send(c, 'receipt', fam, { number: pay.receiptNo, amount: pay.amount })
    event(c, 'payment-recorded', `Receipt ${pay.receiptNo} issued`, `${inv.number} · ${method} · insurance-ready receipt ${fam ? 'sent to the family' : 'filed for the site'}`, `/studio/invoices/${inv.id}`)
  }
  return pay
}

/* ---------- Visit outcomes ---------- */

function afterBillableOutcome(c: Ctx, a: Appointment) {
  const fam = familyById(c.s, a.familyId)
  if (!fam || a.invoiceId) return
  const mode = fam.billing === 'monthly' ? 'monthly' : 'per-visit'
  if (mode === 'per-visit' && ruleOn(c, 'visit-completed')) {
    const inv = issueInvoice(c, { kind: 'family', id: fam.id }, [lineForAppointment(c, a)], 'per-visit')
    return inv
  }
}

export function completeAppointment(c: Ctx, id: string, opts: { signature?: Appointment['signature']; geo?: { lat: number; lng: number } } = {}) {
  const a = c.s.appointments.find((x) => x.id === id)
  if (!a || a.status === 'completed') return
  if (!a.checkIn) a.checkIn = { at: iso(c), ...opts.geo }
  a.checkOut = { at: iso(c), ...opts.geo }
  a.status = 'completed'
  if (opts.signature) a.signature = opts.signature
  audit(c, 'Completed visit', `${childName(c.s, a.childId)} · ${a.date}`)
  const inv = afterBillableOutcome(c, a)
  if (ruleOn(c, 'visit-completed')) {
    event(
      c,
      'visit-completed',
      `Visit completed · ${childName(c.s, a.childId)}`,
      `Note task created for ${therapistName(a.therapistId)}${inv ? `; ${inv.number} generated (${inv.total ? `$${inv.total.toFixed(2)}` : 'package'})` : '; added to the monthly batch'}`,
      `/studio/notes/${a.id}`,
    )
  }
  const svc = serviceById(a.serviceId)
  if (svc?.kind === 'assessment' && ruleOn(c, 'assessment-done')) offerTreatmentPlan(c, a)
}

export function checkIn(c: Ctx, id: string, geo?: { lat: number; lng: number }) {
  const a = c.s.appointments.find((x) => x.id === id)
  if (!a) return
  a.checkIn = { at: iso(c), ...geo }
  a.status = 'checked-in'
  audit(c, 'Checked in', `${childName(c.s, a.childId)} · ${a.date}`)
}

export function markNoShow(c: Ctx, id: string) {
  const a = c.s.appointments.find((x) => x.id === id)
  if (!a) return
  a.status = 'no-show'
  audit(c, 'Marked no-show', `${childName(c.s, a.childId)} · ${a.date}`)
  const inv = afterBillableOutcome(c, a)
  event(c, 'visit-completed', `No-show · ${childName(c.s, a.childId)}`, `Policy applied: ${c.s.settings.noShowFeePct}% fee${inv ? ` on ${inv.number}` : ' (monthly batch)'}`, `/studio/clients/${a.familyId}`)
}

/** Cancel a visit. Inside the late-cancel window it becomes a billable late cancellation. */
export function cancelAppointment(c: Ctx, id: string, by: 'family' | 'clinic') {
  const a = c.s.appointments.find((x) => x.id === id)
  if (!a || a.status === 'cancelled') return
  const hrs = hoursUntil(a.date, a.start, c.now.getTime())
  a.cancelledAt = iso(c)
  if (by === 'family' && hrs < c.s.settings.lateCancelHours && hrs > -2) {
    a.status = 'late-cancel'
    audit(c, 'Late cancellation', `${childName(c.s, a.childId)} · ${a.date}`)
    const inv = afterBillableOutcome(c, a)
    event(c, 'visit-completed', `Late cancel · ${childName(c.s, a.childId)}`, `Within ${c.s.settings.lateCancelHours} h: ${c.s.settings.lateCancelFeePct}% fee${inv ? ` on ${inv.number}` : ' (monthly batch)'}`)
  } else {
    a.status = 'cancelled'
    audit(c, `Cancelled visit (${by})`, `${childName(c.s, a.childId)} · ${a.date}`)
  }
  if (hrs > 0) offerToWaitlist(c, { therapistId: a.therapistId, serviceId: a.serviceId, date: a.date, start: a.start, end: a.end, fromAppointmentId: a.id })
}

/* ---------- Waitlist auto-offer ---------- */

const timeBucket = (t: string) => (toMinutes(t) < 720 ? 'morning' : toMinutes(t) < 960 ? 'afternoon' : 'evening')

export function matchWaitlist(c: Ctx, slot: { therapistId: string; date: ISODate; start: ClockTime }, exclude: string[] = []) {
  const busy = new Set(c.s.offers.filter((o) => o.status === 'offered' || o.status === 'accepted').map((o) => o.waitlistId))
  return c.waitlist
    .filter((w) => w.status === 'waiting' && !busy.has(w.id) && !exclude.includes(w.id))
    .filter((w) => w.preferredTherapistId === 'any' || w.preferredTherapistId === slot.therapistId)
    .filter((w) => !w.preferredDays.length || w.preferredDays.includes(weekdayOf(slot.date)))
    .filter((w) => w.preferredTime === 'any' || w.preferredTime === timeBucket(slot.start))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function offerToWaitlist(c: Ctx, slot: Omit<WaitlistOffer, 'id' | 'waitlistId' | 'name' | 'email' | 'offeredAt' | 'expiresAt' | 'status'>, exclude: string[] = []) {
  if (!ruleOn(c, 'slot-cancelled')) return
  const [match] = matchWaitlist(c, slot, exclude)
  if (!match) {
    event(c, 'slot-cancelled', 'Slot released', `${slot.date} ${slot.start} with ${therapistName(slot.therapistId)} — no matching waitlist family; slot returned to the calendar`)
    return
  }
  const expiresAt = new Date(c.now.getTime() + c.s.settings.holdMinutes * 60_000).toISOString()
  const offer: WaitlistOffer = { id: sid('of'), waitlistId: match.id, name: match.name, email: match.email, offeredAt: iso(c), expiresAt, status: 'offered', ...slot }
  c.s.offers.unshift(offer)
  send(c, 'waitlist-offer', undefined, { parent: match.name.split(' ')[0], date: slot.date, time: slot.start, therapist: therapistName(slot.therapistId), hold: expiresAt }, { to: match.email })
  event(c, 'slot-cancelled', `Slot offered to ${match.name}`, `${slot.date} ${slot.start} with ${therapistName(slot.therapistId)} · held ${c.s.settings.holdMinutes / 60} h`, '/studio/waitlist')
  return offer
}

export function expireOffers(c: Ctx) {
  for (const o of c.s.offers) {
    if (o.status === 'offered' && new Date(o.expiresAt) <= c.now) {
      o.status = 'expired'
      event(c, 'slot-cancelled', `Hold expired · ${o.name}`, 'Offering the slot to the next matching family')
      const tried = c.s.offers.filter((x) => x.date === o.date && x.start === o.start && x.therapistId === o.therapistId).map((x) => x.waitlistId)
      offerToWaitlist(c, { therapistId: o.therapistId, serviceId: o.serviceId, date: o.date, start: o.start, end: o.end, fromAppointmentId: o.fromAppointmentId }, tried)
    }
  }
}

/* ---------- Treatment plans ---------- */

export function sessionServiceFor(mode: SessionMode) {
  return mode === 'In-Home' ? 'ot-session-home' : mode === 'Virtual' ? 'ot-session-virtual' : 'ot-session-clinic'
}

export function offerTreatmentPlan(c: Ctx, a: Appointment) {
  if (c.s.plans.some((p) => p.childId === a.childId && p.status === 'offered')) return
  const av = therapistAvailability.find((x) => x.therapistId === a.therapistId)
  const serviceId = sessionServiceFor(a.mode)
  const dur = serviceById(serviceId)!.durationMinutes
  const options: TreatmentPlan['options'] = []
  const nextWeek = addDaysISO(a.date, 7)
  for (let d = 0; d < 7 && options.length < 3; d++) {
    const date = addDaysISO(nextWeek, d)
    if (!av?.weekly[weekdayOf(date)]) continue
    const slots = openSlots(c.s, a.therapistId, date, dur)
    const pick = slots[Math.min(slots.length - 1, 2)]
    if (pick) options.push({ weekday: weekdayOf(date), start: pick })
  }
  const plan: TreatmentPlan = { id: sid('pl'), childId: a.childId, therapistId: a.therapistId, serviceId, createdAt: iso(c), weeks: 10, options, status: 'offered' }
  c.s.plans.unshift(plan)
  const ch = childById(c.s, a.childId)
  if (ch) ch.status = 'active'
  send(c, 'plan', familyById(c.s, a.familyId), { child: ch?.firstName, therapist: therapistName(a.therapistId), weeks: plan.weeks })
  event(c, 'assessment-done', `Treatment plan offered · ${childName(c.s, a.childId)}`, `${plan.weeks} weekly sessions; ${options.length} weekly times offered`, `/studio/children/${a.childId}`)
  return plan
}

export function acceptPlan(c: Ctx, planId: string, option: TreatmentPlan['options'][number]) {
  const plan = c.s.plans.find((p) => p.id === planId)
  if (!plan) return 0
  const seriesId = sid('ser')
  let date = todayOf(c)
  while (weekdayOf(date) !== option.weekday || date <= todayOf(c)) date = addDaysISO(date, 1)
  let made = 0
  for (let w = 0; w < plan.weeks; w++) {
    const r = createAppointment(c, { childId: plan.childId, therapistId: plan.therapistId, serviceId: plan.serviceId, date: addDaysISO(date, w * 7), start: option.start, source: 'plan', seriesId })
    if (r.ok) made++
  }
  plan.status = 'accepted'
  plan.accepted = option
  plan.seriesId = seriesId
  audit(c, `Accepted treatment plan (${made} sessions)`, childName(c.s, plan.childId))
  return made
}

export function createSeries(c: Ctx, input: Omit<NewAppointment, 'seriesId' | 'source'>, weeks: number) {
  const seriesId = sid('ser')
  const results = Array.from({ length: weeks }, (_, w) => createAppointment(c, { ...input, date: addDaysISO(input.date, w * 7), source: 'recurring', seriesId }))
  return { made: results.filter((r) => r.ok).length, skipped: results.filter((r) => !r.ok).map((r) => (!r.ok ? r.error : '')) }
}

/* ---------- Scheduled automations ---------- */

export function runReminders(c: Ctx) {
  if (!ruleOn(c, 'reminders')) return 0
  let n = 0
  for (const a of c.s.appointments) {
    if (a.status !== 'scheduled') continue
    const h = hoursUntil(a.date, a.start, c.now.getTime())
    if (h <= 0 || h > 48) continue
    const fam = familyById(c.s, a.familyId)
    const svc = serviceById(a.serviceId)
    for (const mark of [48, 24] as const) {
      if (h <= mark && !a.remindersSent.includes(mark)) {
        a.remindersSent.push(mark)
        n++
        send(c, 'reminder', fam, { child: childById(c.s, a.childId)?.firstName, service: svc?.name, therapist: therapistName(a.therapistId), date: a.date, time: a.start })
        if (mark === 24 && !a.familyConfirmed) {
          a.flaggedForCall = true
          event(c, 'reminders', `Unconfirmed · ${childName(c.s, a.childId)}`, `${a.date} ${a.start} — flagged for a call`, '/studio/schedule')
        }
      }
    }
  }
  if (n) event(c, 'reminders', `${n} reminder${n > 1 ? 's' : ''} sent`, '48 h and 24 h reminders in each family’s language')
  return n
}

export function runOverdue(c: Ctx) {
  if (!ruleOn(c, 'invoice-overdue')) return 0
  const today = todayOf(c)
  let n = 0
  for (const inv of c.s.invoices) {
    if (!isOverdue(inv, today)) continue
    const late = daysBetween(inv.dueOn, today)
    for (const day of [7, 14, 30] as const) {
      if (late >= day && !inv.reminders.some((r) => r.day === day)) {
        inv.reminders.push({ day, at: iso(c) })
        n++
        if (inv.billTo.kind === 'family') send(c, 'overdue', familyById(c.s, inv.billTo.id), { number: inv.number, amount: invoiceBalance(inv), days: day })
        event(c, 'invoice-overdue', `${day}-day reminder · ${inv.number}`, `${invoiceBalance(inv).toFixed(2)} outstanding`, `/studio/invoices/${inv.id}`)
      }
    }
  }
  return n
}

/** Group un-invoiced billable visits into invoices. */
export function runBatch(c: Ctx, period: 'daily' | 'weekly' | 'monthly', scope: 'families' | 'sites' | 'all') {
  const today = todayOf(c)
  const from = period === 'daily' ? today : period === 'weekly' ? addDaysISO(today, -7) : format(startOfMonth(subMonths(parseISO(today), 1)), 'yyyy-MM-dd')
  const to = period === 'monthly' ? format(endOfMonth(subMonths(parseISO(today), 1)), 'yyyy-MM-dd') : today
  const made: Invoice[] = []
  if (scope !== 'sites') {
    const billable = c.s.appointments.filter((a) => !a.invoiceId && a.familyId && ['completed', 'no-show', 'late-cancel'].includes(a.status) && a.date >= from && a.date <= to)
    const byFam = new Map<string, Appointment[]>()
    billable.forEach((a) => byFam.set(a.familyId, [...(byFam.get(a.familyId) ?? []), a]))
    for (const [famId, list] of byFam) made.push(issueInvoice(c, { kind: 'family', id: famId }, list.map((a) => lineForAppointment(c, a)), period))
  }
  if (scope !== 'families') {
    const visits = c.s.siteVisits.filter((v) => v.status === 'completed' && !v.invoiceId && v.date >= from && v.date <= to)
    const bySite = new Map<string, typeof visits>()
    visits.forEach((v) => bySite.set(v.siteId, [...(bySite.get(v.siteId) ?? []), v]))
    for (const [siteId, list] of bySite) {
      const lines: InvoiceLine[] = list.map((v) => {
        const mins = sum(v.attendance.map((x) => x.minutes))
        const hours = round2(mins / 60)
        return { id: sid('ln'), description: `Site visit ${v.date} · ${v.attendance.filter((x) => x.status === 'present').length} children · ${mins} min delivered`, date: v.date, therapistId: v.therapistId, siteVisitId: v.id, qty: hours, unitPrice: c.s.settings.siteHourlyRate, amount: round2(hours * c.s.settings.siteHourlyRate) }
      })
      made.push(issueInvoice(c, { kind: 'site', id: siteId }, lines, period))
    }
  }
  audit(c, `Ran ${period} batch invoicing (${scope})`, `${made.length} invoice${made.length === 1 ? '' : 's'}`)
  return made
}

export function runMonthEnd(c: Ctx) {
  if (!ruleOn(c, 'month-end')) return 0
  const today = todayOf(c)
  let statements = 0
  for (const f of c.s.families) {
    const bal = sum(c.s.invoices.filter((i) => i.billTo.kind === 'family' && i.billTo.id === f.id).map(invoiceBalance))
    if (bal > 0) {
      statements++
      send(c, 'statement', f, { month: format(subMonths(parseISO(today), 1), 'yyyy-MM-dd'), amount: bal })
    }
  }
  event(c, 'month-end', 'Month-end run complete', `Owner report generated; ${statements} family statement${statements === 1 ? '' : 's'} sent`, '/studio/dashboard')
  audit(c, 'Ran month-end', `${statements} statements`)
  c.s.lastAutomationRun = iso(c)
  return statements
}

/** Called on load and on a timer: time-based rules. */
export function runScheduled(c: Ctx) {
  expireOffers(c)
  runReminders(c)
  runOverdue(c)
}

/* ---------- Online bookings → studio ---------- */

export function importBooking(c: Ctx, b: import('@/types').Booking) {
  const known = c.s.importedBookings[b.id]
  if (!known) {
    if (b.status === 'cancelled') return
    let fam = c.s.families.find((f) => f.guardians.some((g) => g.email.toLowerCase() === b.client.email.toLowerCase()))
    if (!fam) {
      fam = {
        id: sid('fam'),
        name: b.client.lastName,
        guardians: [{ name: `${b.client.firstName} ${b.client.lastName}`, relationship: 'Parent', email: b.client.email, phone: b.client.phone }],
        address: 'Address to be collected at intake',
        city: 'Mississauga',
        postalCode: '',
        geo: { lat: 43.585, lng: -79.69 },
        language: 'en',
        preferredChannel: 'email',
        billing: 'per-visit',
        source: 'Online booking',
        createdAt: iso(c),
      }
      c.s.families.push(fam)
    }
    const childFirst = b.client.childFirstName?.trim() || 'Child'
    let child = c.s.children.find((ch) => ch.familyId === fam!.id && ch.firstName.toLowerCase() === childFirst.toLowerCase())
    if (!child) {
      child = { id: sid('ch'), familyId: fam.id, firstName: childFirst, lastName: b.client.lastName, dob: '2019-01-01', therapistId: b.therapistId, status: 'assessment' }
      c.s.children.push(child)
    }
    const svc = serviceById(b.treatmentId)!
    const appt: Appointment = {
      id: sid('ap'),
      childId: child.id,
      familyId: fam.id,
      therapistId: b.therapistId,
      serviceId: svc.id,
      date: b.date,
      start: b.startTime,
      end: b.endTime,
      mode: svc.mode,
      status: 'scheduled',
      roomId: pickRoom(c.s, svc.mode, b.date, b.startTime, b.endTime),
      km: svc.mode === 'In-Home' ? homeKm(fam) : undefined,
      remindersSent: [],
      familyConfirmed: true,
      source: 'online',
      bookingRef: b.reference,
      bookingId: b.id,
    }
    c.s.appointments.push(appt)
    c.s.importedBookings[b.id] = { status: b.status, date: b.date, start: b.startTime }
    if (ruleOn(c, 'booking-confirmed')) {
      send(c, 'confirmation', fam, { child: childFirst, service: svc.name, therapist: therapistName(b.therapistId), date: b.date, time: b.startTime })
      for (const kind of ['intake', 'consent'] as const) {
        if (!c.s.forms.some((f) => f.familyId === fam!.id && f.kind === kind)) c.s.forms.push({ id: sid('frm'), familyId: fam.id, childId: child.id, kind, status: 'requested', requestedAt: iso(c) })
      }
      send(c, 'forms', fam, { child: childFirst })
      event(c, 'booking-confirmed', `Online booking ${b.reference}`, `${childFirst} ${b.client.lastName} · ${svc.shortName} · confirmation sent, intake & consent requested`, `/studio/clients/${fam.id}`)
    }
    return
  }
  const appt = c.s.appointments.find((a) => a.bookingId === b.id)
  if (!appt) return
  if (b.status === 'cancelled' && known.status !== 'cancelled') {
    known.status = 'cancelled'
    cancelAppointment({ ...c, actor: 'Parent (online)' }, appt.id, 'family')
  } else if (b.status === 'confirmed' && (known.date !== b.date || known.start !== b.startTime)) {
    appt.date = b.date
    appt.start = b.startTime
    appt.end = b.endTime
    appt.remindersSent = []
    const old = { ...known }
    known.date = b.date
    known.start = b.startTime
    audit({ ...c, actor: 'Parent (online)' }, 'Rescheduled online booking', `${b.reference}`)
    offerToWaitlist(c, { therapistId: appt.therapistId, serviceId: appt.serviceId, date: old.date, start: old.start, end: fromMinutes(toMinutes(old.start) + (toMinutes(b.endTime) - toMinutes(b.startTime))) })
  }
}

/* ---------- Misc ---------- */

export function homeProgramMessage(c: Ctx, childId: string) {
  const ch = childById(c.s, childId)
  const fam = familyById(c.s, ch?.familyId)
  if (!ch || !fam) return
  const acts = c.s.homeActivities.filter((h) => h.childId === childId).map((h) => activityTitle(h.key, fam.language))
  send(c, 'home-program', fam, { child: ch.firstName, activities: acts.join('; ') })
  audit(c, 'Sent home program', childName(c.s, childId))
}

export function siteVisitDates(weekday: number, from: ISODate, to: ISODate) {
  const out: ISODate[] = []
  let d = from
  while (weekdayOf(d) !== weekday) d = addDaysISO(d, 1)
  for (; d <= to; d = addDaysISO(d, 7)) out.push(d)
  return out
}

export { addDays, atClinic, rooms }
