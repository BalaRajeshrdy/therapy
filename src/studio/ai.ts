/**
 * "AI" features for the demo. Everything here is deterministic, rule-based and
 * runs in the browser — no data leaves the device and no model is called.
 * In production these would be drafts from a real model, always reviewed and
 * approved by a person before use.
 */
import { format, parseISO, getMonth, getYear } from 'date-fns'
import type { ClockTime, ISODate } from '@/types'
import { faqs } from '@/data/faqs'
import { treatments } from '@/data/treatments'
import { therapists, fullName } from '@/data/therapists'
import { clinic } from '@/data/clinic'
import type { Goal, GoalRating, SoapNote, StudioState } from './types'
import { invoiceBalance, isOverdue, openSlots } from './engine'
import { serviceById } from './reference'
import { addDaysISO, weekdayOf, toMinutes } from '@/utils/time'
import { clinicGeo, money, pct, roadKm, sum } from './util'

/* ---------- Session note drafts ---------- */

const S_RE = /(parent|mom|mum|dad|father|mother|caregiver|teacher|reports?|says|said|shared|mentioned|told)/i
const P_RE = /(next|plan|continue|home|try|will|follow|recommend|send|practi[cs]e at home|homework)/i
const A_RE = /(improv|better|progress|struggl|difficult|harder|easier|emerging|consistent|regress|tolerat|needed (?:less|more))/i

export function sampleVoiceMemo(child: string) {
  return [
    `Mom says ${child} has been more willing to try buttons at home this week`,
    `Buttoned 3 of 5 large buttons independently, needed hand-over-hand for the last two`,
    `Obstacle course x3, transitions with a 2-minute warning and visual timer`,
    `Calmer at transitions than last week, one meltdown when leaving the swing`,
    `Pencil grip emerging, used tripod grasp for about half of the tracing task`,
    `Next session: zipper practice, continue visual timer, send play-dough activity home`,
  ].join('\n')
}

export function draftSoap(input: { bullets: string; child: string; serviceId: string; minutes: number; goals: Goal[] }): SoapNote {
  const lines = input.bullets
    .split(/\n|•|;/)
    .map((l) => l.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
  const s: string[] = []
  const o: string[] = []
  const a: string[] = []
  const p: string[] = []
  for (const l of lines) {
    const sentence = l.charAt(0).toUpperCase() + l.slice(1).replace(/\.$/, '') + '.'
    if (S_RE.test(l) && !/next session/i.test(l)) s.push(sentence)
    else if (P_RE.test(l)) p.push(sentence)
    else if (A_RE.test(l)) a.push(sentence)
    else o.push(sentence)
  }
  const svc = serviceById(input.serviceId)
  const goalList = input.goals.filter((g) => g.status === 'active')
  return {
    s: s.length ? s.join(' ') : `No new concerns reported by the family today. ${input.child} arrived ready to participate.`,
    o: `${input.minutes}-minute ${svc?.name ?? 'OT session'}. ${o.length ? o.join(' ') : `${input.child} engaged in structured play targeting current goals.`}`,
    a: `${a.length ? a.join(' ') + ' ' : ''}${goalList.length ? `Progress continues toward ${goalList.map((g) => g.domain.toLowerCase()).join(', ')} goals. ` : ''}${input.child} responded well to visual supports and graded challenge.`,
    p: p.length ? p.join(' ') : `Continue current plan next session. Home program activities reviewed with the family.`,
  }
}

/* ---------- Progress reports ---------- */

export interface ReportSection {
  heading: string
  body: string
}

export function goalTrend(goal: Goal, ratings: GoalRating[]) {
  const rs = ratings.filter((r) => r.goalId === goal.id).sort((x, y) => x.date.localeCompare(y.date))
  const first = rs[0]?.score ?? 0
  const last = rs[rs.length - 1]?.score ?? 0
  return { first, last, change: last - first, count: rs.length }
}

const level = (n: number) => (n >= 4.5 ? 'consistently and independently' : n >= 3.5 ? 'most of the time with light support' : n >= 2.5 ? 'with some support' : n >= 1.5 ? 'with frequent support' : 'with full support')

export function progressReport(s: StudioState, childId: string, audience: 'parent' | 'school'): ReportSection[] {
  const ch = s.children.find((c) => c.id === childId)
  if (!ch) return []
  const goals = s.goals.filter((g) => g.childId === childId)
  const appts = s.appointments.filter((a) => a.childId === childId)
  const done = appts.filter((a) => a.status === 'completed').length
  const missed = appts.filter((a) => a.status === 'no-show' || a.status === 'late-cancel').length
  const t = therapists.find((x) => x.id === ch.therapistId)
  const name = ch.firstName
  const goalBodies = goals.map((g) => {
    const tr = goalTrend(g, s.ratings)
    const dir = tr.change >= 1.5 ? 'strong progress' : tr.change >= 0.5 ? 'steady progress' : 'early progress'
    return audience === 'parent'
      ? `${g.title}: ${name} has made ${dir} — from ${tr.first} to ${tr.last} out of 5 over ${tr.count} sessions. ${name} can now do this ${level(tr.last)}.`
      : `${g.domain} — ${g.title}. Rating ${tr.first} → ${tr.last}/5 across ${tr.count} sessions; currently performs ${level(tr.last)}.`
  })
  const acts = s.homeActivities.filter((h) => h.childId === childId)
  if (audience === 'parent') {
    return [
      { heading: 'Summary', body: `${name} has attended ${done} sessions with ${t ? fullName(t) : 'our team'}. ${name} is a joy to work with and has been building confidence week by week.` },
      { heading: 'Goals and progress', body: goalBodies.join('\n') },
      { heading: 'What helps at home', body: acts.length ? `Keep going with: ${acts.map((x) => x.title.toLowerCase()).join('; ')}. Short, playful practice a few times a week makes the biggest difference.` : 'We will share home activities at the next session.' },
      { heading: 'Next steps', body: `We recommend continuing weekly sessions and reviewing goals in about 8 weeks. Please reach out any time with questions.` },
    ]
  }
  return [
    { heading: 'Purpose', body: `Summary of occupational therapy services for ${ch.firstName} ${ch.lastName}${ch.grade ? ` (${ch.grade})` : ''}, shared with the family’s consent to support participation at school.` },
    { heading: 'Attendance', body: `${done} sessions completed; ${missed} missed or late-cancelled.` },
    { heading: 'Goal progress', body: goalBodies.join('\n') },
    { heading: 'Classroom strategies', body: 'Provide a visual timer and a 2-minute warning before transitions. Offer a slant board and pencil grip for written work. Allow movement breaks between seated tasks. Break multi-step instructions into single steps.' },
  ]
}

/* ---------- Smart scheduling ---------- */

export function bestSlots(s: StudioState, therapistId: string, serviceId: string, from: ISODate, prefs: { days?: number[]; time?: 'morning' | 'afternoon' | 'evening' | 'any' } = {}) {
  const svc = serviceById(serviceId)
  const dur = svc?.durationMinutes ?? 60
  const out: { date: ISODate; start: ClockTime; score: number; reasons: string[] }[] = []
  for (let d = 1; d <= 21; d++) {
    const date = addDaysISO(from, d)
    const day = weekdayOf(date)
    const dayAppts = s.appointments.filter((a) => a.therapistId === therapistId && a.date === date && a.status !== 'cancelled')
    for (const start of openSlots(s, therapistId, date, dur)) {
      let score = 50
      const reasons: string[] = []
      if (prefs.days?.length && prefs.days.includes(day)) {
        score += 20
        reasons.push('family’s preferred day')
      }
      const m = toMinutes(start)
      const bucket = m < 720 ? 'morning' : m < 960 ? 'afternoon' : 'evening'
      if (prefs.time && prefs.time !== 'any' && prefs.time === bucket) {
        score += 15
        reasons.push(`${bucket} as requested`)
      }
      const adjacent = dayAppts.some((a) => a.end === start || toMinutes(a.start) === m + dur)
      if (adjacent) {
        score += 12
        reasons.push('no gap in therapist’s day')
      }
      if (svc?.mode === 'In-Home' && dayAppts.some((a) => a.mode === 'In-Home')) {
        score += 8
        reasons.push('groups home visits on one day')
      }
      score -= d * 0.8
      if (!reasons.length) reasons.push('earliest open time')
      out.push({ date, start, score: Math.round(score), reasons })
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5)
}

export interface Stop {
  id: string
  label: string
  geo: { lat: number; lng: number }
}

export function routeKm(stops: Stop[]) {
  let km = 0
  let prev = clinicGeo
  for (const st of stops) {
    km += roadKm(prev, st.geo)
    prev = st.geo
  }
  return Math.round((km + (stops.length ? roadKm(prev, clinicGeo) : 0)) * 10) / 10
}

/** Nearest-neighbour route from the clinic. */
export function optimiseRoute(stops: Stop[]) {
  const left = [...stops]
  const order: Stop[] = []
  let cur = clinicGeo
  while (left.length) {
    left.sort((a, b) => roadKm(cur, a.geo) - roadKm(cur, b.geo))
    const next = left.shift()!
    order.push(next)
    cur = next.geo
  }
  return order
}

/* ---------- Ask the dashboard ---------- */

export interface DashAnswer {
  answer: string
  table?: { columns: string[]; rows: (string | number)[][] }
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

function resolveMonth(q: string, today: ISODate): { y: number; m: number; label: string } {
  const t = parseISO(today)
  let y = getYear(t)
  let m = getMonth(t)
  const idx = MONTHS.findIndex((name) => q.includes(name) || q.includes(name.slice(0, 3) + ' '))
  if (/last month|previous month/.test(q)) {
    m -= 1
    if (m < 0) {
      m = 11
      y -= 1
    }
  } else if (idx >= 0) {
    m = idx
    if (m > getMonth(t)) y -= 1
  }
  return { y, m, label: format(new Date(y, m, 1), 'MMMM yyyy') }
}

export const dashboardSuggestions = [
  'How many home visits did each therapist do in October?',
  'What is our no-show rate this month?',
  'Who owes us money?',
  'How many families are on the waitlist?',
  'Revenue by service last month',
  'Which therapist had the most sessions this month?',
]

export function askDashboard(s: StudioState, question: string, today: ISODate, waitlistCount: number): DashAnswer {
  const q = question.toLowerCase()
  const { y, m, label } = resolveMonth(q, today)
  const inMonth = (d: ISODate) => {
    const p = parseISO(d)
    return getYear(p) === y && getMonth(p) === m && d <= today
  }
  const monthAppts = s.appointments.filter((a) => inMonth(a.date))

  if (/(owe|outstanding|unpaid|overdue|balance)/.test(q)) {
    const rows = s.invoices
      .filter((i) => invoiceBalance(i) > 0)
      .map((i) => {
        const who = i.billTo.kind === 'family' ? `${s.families.find((f) => f.id === i.billTo.id)?.name} family` : s.sites.find((x) => x.id === i.billTo.id)?.name ?? ''
        return [who, i.number, money(invoiceBalance(i)), isOverdue(i, today) ? 'Overdue' : 'Not yet due']
      })
    const total = sum(s.invoices.map(invoiceBalance))
    return { answer: `${money(total)} is outstanding across ${rows.length} invoices; ${rows.filter((r) => r[3] === 'Overdue').length} are overdue.`, table: { columns: ['Bill to', 'Invoice', 'Balance', 'Status'], rows } }
  }
  if (/waitlist|wait list/.test(q)) {
    return { answer: `${waitlistCount} famil${waitlistCount === 1 ? 'y is' : 'ies are'} waiting, and ${s.offers.filter((o) => o.status === 'offered').length} slot offer(s) are on hold right now.` }
  }
  if (/no.?show|missed|late cancel/.test(q)) {
    const billable = monthAppts.filter((a) => ['completed', 'no-show', 'late-cancel'].includes(a.status))
    const ns = monthAppts.filter((a) => a.status === 'no-show').length
    const lc = monthAppts.filter((a) => a.status === 'late-cancel').length
    return { answer: `${label}: ${pct(ns, billable.length)}% no-show rate (${ns} of ${billable.length} visits), plus ${lc} late cancellation${lc === 1 ? '' : 's'}.` }
  }
  if (/revenue|invoiced|billed|income/.test(q)) {
    const lines = s.invoices.filter((i) => i.status !== 'void').flatMap((i) => i.lines.filter((l) => inMonth(l.date)))
    const bySvc = new Map<string, number>()
    for (const l of lines) {
      const a = s.appointments.find((x) => x.id === l.appointmentId)
      const key = a ? serviceById(a.serviceId)?.shortName ?? 'Other' : l.siteVisitId ? 'Site visits' : 'Packages & other'
      bySvc.set(key, (bySvc.get(key) ?? 0) + l.amount)
    }
    const rows = [...bySvc.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, money(v)])
    return { answer: `${money(sum(lines.map((l) => l.amount)))} invoiced for visits in ${label} (demo fees).`, table: { columns: ['Service', 'Invoiced'], rows } }
  }
  const homeOnly = /home/.test(q)
  const siteQ = /site|school|hospital|daycare/.test(q)
  if (siteQ) {
    const rows = s.sites.map((site) => {
      const v = s.siteVisits.filter((x) => x.siteId === site.id && x.status === 'completed' && inMonth(x.date))
      return [site.name, v.length, sum(v.flatMap((x) => x.attendance.map((a) => a.minutes)))]
    })
    return { answer: `Site visits in ${label}:`, table: { columns: ['Site', 'Visits', 'Minutes delivered'], rows } }
  }
  const rows = therapists.map((t) => {
    const list = monthAppts.filter((a) => a.therapistId === t.id && a.status === 'completed' && (!homeOnly || a.mode === 'In-Home'))
    return [fullName(t), list.length, Math.round(sum(list.map((a) => toMinutes(a.end) - toMinutes(a.start))) / 6) / 10]
  })
  rows.sort((a, b) => Number(b[1]) - Number(a[1]))
  const top = rows[0]
  return {
    answer: `${homeOnly ? 'Completed home visits' : 'Completed sessions'} in ${label}: ${sum(rows.map((r) => Number(r[1])))} in total. ${top && Number(top[1]) > 0 ? `${top[0]} did the most (${top[1]}).` : ''}`,
    table: { columns: ['Therapist', homeOnly ? 'Home visits' : 'Sessions', 'Hours'], rows },
  }
}

/* ---------- Website assistant ---------- */

export interface AssistantReply {
  text: string
  links?: { label: string; to: string }[]
  askContact?: boolean
}

export const assistantStarters = ['How do I book an assessment?', 'Do you do home visits?', 'Is OT covered by insurance?', 'What ages do you see?', 'I’d like someone to call me']

export function assistantReply(message: string): AssistantReply {
  const q = message.toLowerCase()
  if (/(call me|contact me|speak to|talk to|human|person|callback|call back)/.test(q)) {
    return { text: 'Happy to arrange that. Leave your name and email or phone below and our front desk will reach out within one business day.', askContact: true }
  }
  if (/(emergency|urgent|danger|suicid|hurt)/.test(q)) {
    return { text: 'If this is an emergency, please call 911 or go to your nearest emergency department. I can only help with general questions about our clinic.' }
  }
  if (/(diagnos|is my child|does my child have|autism|adhd|medication)/.test(q)) {
    return {
      text: 'I can’t give medical or diagnostic advice, but an occupational therapy assessment is a great first step to understand your child’s strengths and needs. Would you like to see available assessment times?',
      links: [{ label: 'View assessment times', to: '/booking' }],
    }
  }
  if (/(home|in-home|house|visit)/.test(q)) {
    const t = treatments.filter((x) => x.mode === 'In-Home')
    return {
      text: `Yes — we offer ${t.map((x) => x.name).join(' and ')} across ${clinic.serviceArea.join(', ')}. The extended visit is two hours and works well for daily-routine assessments.`,
      links: t.map((x) => ({ label: `Book ${x.shortName}`, to: `/booking?treatment=${x.id}` })),
    }
  }
  if (/(virtual|remote|online|video)/.test(q)) {
    return { text: 'Our remote assessment runs over secure video and suits families who prefer to start from home or live further away.', links: [{ label: 'Book a remote assessment', to: '/booking?treatment=ot-assessment-remote' }] }
  }
  if (/(book|appointment|schedule|availability|available|start)/.test(q)) {
    return {
      text: 'Most families start with an OT assessment. Choose in-clinic, remote or in-home, pick a therapist (or “any”), then a date and time — it takes about two minutes.',
      links: [
        { label: 'Book an appointment', to: '/booking' },
        { label: 'Compare services', to: '/services' },
      ],
    }
  }
  if (/(waitlist|wait list|no times|full)/.test(q)) {
    return { text: 'If you can’t find a time that works, join our waitlist — when a matching slot opens we offer it to you automatically and hold it while you decide.', links: [{ label: 'Join the waitlist', to: '/waitlist' }] }
  }
  if (/(therapist|who|team|staff)/.test(q)) {
    return { text: `Our team: ${therapists.map((t) => `${fullName(t)} (${t.specializations[0].toLowerCase()})`).join('; ')}.`, links: [{ label: 'Meet the team', to: '/therapists' }] }
  }
  if (/(where|address|location|parking|hours|open)/.test(q)) {
    return { text: `We’re at ${clinic.address.line1}, ${clinic.address.city}. Hours: ${clinic.hours.map((h) => `${h.days} ${h.hours}`).join('; ')}.`, links: [{ label: 'Contact & directions', to: '/contact' }] }
  }
  // fall back to FAQ keyword match
  const words = q.split(/\W+/).filter((w) => w.length > 3)
  const scored = faqs
    .map((f) => ({ f, score: words.filter((w) => (f.question + ' ' + f.answer).toLowerCase().includes(w)).length }))
    .sort((a, b) => b.score - a.score)
  if (scored[0]?.score) {
    return { text: scored[0].f.answer, links: [{ label: 'More FAQs', to: '/faq' }] }
  }
  return {
    text: 'I’m not sure about that one. I can help with booking, services, home visits, insurance and our team — or I can ask someone to contact you.',
    links: [{ label: 'Browse FAQs', to: '/faq' }],
    askContact: true,
  }
}

