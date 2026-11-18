/**
 * Deterministic, fictional demo data for Treatment Studio, generated relative to
 * "today" in Toronto so the demo always looks current. No real people or records.
 */
import { format, parseISO, startOfMonth } from 'date-fns'
import type { ClockTime, ISODate } from '@/types'
import { addDaysISO, fromMinutes, toMinutes, weekdayOf } from '@/utils/time'
import type { Appointment, Child, Domain, Family, Goal, Invoice, Site, SiteVisit, StudioState } from './types'
import { defaultRules, defaultSettings, rooms, serviceById } from './reference'
import { activityLibrary } from './messages'
import { draftSoap } from './ai'
import { completeAppointment, event, homeKm, issueInvoice, lineForAppointment, markNoShow, pickRoom, recordPayment, runBatch, runMonthEnd, runScheduled, siteVisitDates, todayOf, type Ctx } from './engine'
import { atClinic, mulberry32, round2 } from './util'

const fam = (
  id: string,
  name: string,
  guardian: string,
  rel: string,
  phone: string,
  address: string,
  postal: string,
  geo: [number, number],
  language: Family['language'],
  extra: Partial<Family> = {},
): Family => ({
  id,
  name,
  guardians: [{ name: guardian, relationship: rel, email: `${guardian.split(' ')[0].toLowerCase()}.${name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`, phone }],
  address,
  city: 'Mississauga',
  postalCode: postal,
  geo: { lat: geo[0], lng: geo[1] },
  language,
  preferredChannel: 'email',
  billing: 'per-visit',
  source: 'Website',
  createdAt: '',
  ...extra,
})

const families: Family[] = [
  fam('f-rahman', 'Rahman', 'Nadia Rahman', 'Mother', '(905) 555-0161', '48 Willowbrook Crescent', 'L5M 0A1', [43.5751, -79.7202], 'ar', { source: 'Physician referral', preferredChannel: 'sms' }),
  fam('f-tran', 'Tran', 'Linh Tran', 'Mother', '(905) 555-0172', '1120 Bramblewood Lane', 'L5N 0B2', [43.6031, -79.7744], 'en', { source: 'Online booking' }),
  fam('f-kowalski', 'Kowalski', 'Ewa Kowalski', 'Mother', '(905) 555-0183', '77 Heritage Glen Drive', 'L5L 0C3', [43.5532, -79.7012], 'en'),
  fam('f-gagnon', 'Gagnon', 'Isabelle Gagnon', 'Mother', '(905) 555-0194', '305 Rivergrove Court', 'L5R 0D4', [43.6191, -79.6833], 'fr', { billing: 'monthly', source: 'School referral' }),
  fam('f-sandhu', 'Sandhu', 'Harpreet Sandhu', 'Father', '(905) 555-0127', '2290 Maple Ridge Way', 'L5V 0E5', [43.6102, -79.7375], 'pa', { preferredChannel: 'sms' }),
  fam('f-chen', 'Chen', 'Wei Chen', 'Father', '(905) 555-0138', '19 Lakeshore Mews', 'L5H 0F6', [43.5402, -79.6271], 'zh'),
  fam('f-morales', 'Morales', 'Camila Morales', 'Mother', '(905) 555-0149', '640 Cedar Hollow Road', 'L5B 0G7', [43.5891, -79.6452], 'es', { source: 'Waitlist' }),
  fam('f-obrien', 'O’Brien', 'Siobhan O’Brien', 'Mother', '(905) 555-0152', '88 Orchard Path', 'L5J 0H8', [43.5221, -79.6612], 'en'),
  fam('f-okafor', 'Okafor', 'Chidi Okafor', 'Father', '(905) 555-0165', '1500 Meadowlark Boulevard', 'L5N 0J9', [43.5962, -79.7651], 'en', { source: 'Enquiry' }),
]
families[0].guardians.push({ name: 'Omar Rahman', relationship: 'Father', email: 'omar.rahman@example.com', phone: '(905) 555-0162' })

const kid = (id: string, familyId: string, first: string, last: string, dob: string, therapistId: string, grade: string, status: Child['status'] = 'active'): Child => ({ id, familyId, firstName: first, lastName: last, dob, therapistId, grade, status })

const familyChildren: Child[] = [
  kid('c-maya', 'f-rahman', 'Maya', 'Rahman', '2020-03-14', 'julien-tremblay', 'Grade 1'),
  kid('c-zayd', 'f-rahman', 'Zayd', 'Rahman', '2022-07-02', 'sofia-marchetti', 'Pre-school'),
  kid('c-leo', 'f-tran', 'Leo', 'Tran', '2021-05-21', 'julien-tremblay', 'JK', 'assessment'),
  kid('c-ava', 'f-kowalski', 'Ava', 'Kowalski', '2019-01-09', 'julien-tremblay', 'Grade 2'),
  kid('c-theo', 'f-gagnon', 'Théo', 'Gagnon', '2018-04-30', 'leah-thompson', 'Grade 3'),
  kid('c-jasleen', 'f-sandhu', 'Jasleen', 'Sandhu', '2021-02-11', 'sofia-marchetti', 'SK'),
  kid('c-kabir', 'f-sandhu', 'Kabir', 'Sandhu', '2018-09-18', 'sofia-marchetti', 'Grade 3'),
  kid('c-olivia', 'f-chen', 'Olivia', 'Chen', '2020-06-25', 'rosa-delgado', 'SK'),
  kid('c-mateo', 'f-morales', 'Mateo', 'Morales', '2022-01-15', 'rosa-delgado', 'Pre-school'),
  kid('c-finn', 'f-obrien', 'Finn', 'O’Brien', '2017-08-03', 'leah-thompson', 'Grade 4'),
  kid('c-amara', 'f-okafor', 'Amara', 'Okafor', '2023-02-27', 'sofia-marchetti', 'Toddler', 'assessment'),
]

const roster = (siteId: string, therapistId: string, names: [string, string, string][]) =>
  names.map(([first, last, grade], i): Child => ({ id: `${siteId}-${i}`, siteId, firstName: first, lastName: last, dob: '2018-01-01', therapistId, grade, status: 'active' }))

const siteDefs: (Omit<Site, 'childIds'> & { kids: [string, string, string][] })[] = [
  {
    id: 's-maplegrove',
    name: 'Maple Grove Public School',
    type: 'School',
    address: '410 Grove Park Drive, Mississauga, ON',
    contact: { name: 'Ms. Andrea Pereira', role: 'Special Education Resource Teacher', email: 'serf.maplegrove@example.com', phone: '(905) 555-0211' },
    billingEmail: 'office.maplegrove@example.com',
    billingTermsDays: 30,
    recurrence: { weekday: 2, start: '09:00', end: '12:00', therapistId: 'leah-thompson', label: 'Every Tuesday morning' },
    kids: [
      ['Noah', 'Patel', 'Grade 1'],
      ['Zara', 'Mensah', 'Grade 2'],
      ['Ethan', 'Lam', 'Grade 1'],
      ['Aria', 'Singh', 'SK'],
      ['Liam', 'Doyle', 'Grade 3'],
    ],
  },
  {
    id: 's-cedarbrook',
    name: 'Cedarbrook Children’s Hospital · Outpatient Rehab',
    type: 'Hospital',
    address: '9 Cedarbrook Way, Mississauga, ON',
    contact: { name: 'Dr. Felix Romero', role: 'Rehab program lead', email: 'rehab.cedarbrook@example.com', phone: '(905) 555-0222' },
    billingEmail: 'ap.cedarbrook@example.com',
    billingTermsDays: 45,
    recurrence: { weekday: 4, start: '13:00', end: '16:00', therapistId: 'julien-tremblay', label: 'Every Thursday afternoon' },
    kids: [
      ['Hana', 'Ito', 'Inpatient'],
      ['Omar', 'Haddad', 'Outpatient'],
      ['Lucas', 'Ferreira', 'Outpatient'],
      ['Grace', 'Kim', 'Inpatient'],
    ],
  },
  {
    id: 's-acorns',
    name: 'Little Acorns Daycare',
    type: 'Daycare',
    address: '1250 Acorn Lane, Mississauga, ON',
    contact: { name: 'Bea Okonkwo', role: 'Centre director', email: 'director.acorns@example.com', phone: '(905) 555-0233' },
    billingEmail: 'billing.acorns@example.com',
    billingTermsDays: 30,
    recurrence: { weekday: 3, start: '09:30', end: '11:30', therapistId: 'sofia-marchetti', label: 'Every Wednesday morning' },
    kids: [
      ['Ella', 'Novak', 'Preschool room'],
      ['Rohan', 'Mehta', 'Preschool room'],
      ['Mila', 'Petrov', 'Toddler room'],
      ['Yusuf', 'Ali', 'Preschool room'],
    ],
  },
  {
    id: 's-northfield',
    name: 'Northfield Family Services',
    type: 'Agency',
    address: '77 Northfield Avenue, Mississauga, ON',
    contact: { name: 'Karen Liu', role: 'Program coordinator', email: 'programs.northfield@example.com', phone: '(905) 555-0244' },
    billingEmail: 'finance.northfield@example.com',
    billingTermsDays: 30,
    recurrence: { weekday: 5, start: '10:00', end: '12:00', therapistId: 'rosa-delgado', label: 'Every Friday morning' },
    kids: [
      ['Jayden', 'Brooks', 'Age 6'],
      ['Chloe', 'Martin', 'Age 5'],
      ['Aiden', 'Wong', 'Age 7'],
    ],
  },
]

const goalSets: Record<string, [Domain, string, string][]> = {
  'c-maya': [
    ['Fine motor', 'Buttons & zips', 'Fastens 5 large buttons and a jacket zip independently'],
    ['Sensory', 'Calm transitions', 'Moves between activities with a visual timer and no more than one prompt'],
    ['Self-care', 'Dressing', 'Puts on socks, shoes and jacket on her own before school'],
  ],
  default: [
    ['Fine motor', 'Pencil grasp', 'Uses a functional tripod grasp for a full drawing task'],
    ['Attention & regulation', 'Seated attention', 'Stays engaged in a seated table task for 10 minutes'],
    ['Gross motor', 'Balance & coordination', 'Walks a 3 m line heel-to-toe and hops 5 times on each foot'],
  ],
  'c-theo': [
    ['Handwriting', 'Legible handwriting', 'Copies a 3-line sentence with correct letter size and spacing'],
    ['Attention & regulation', 'Homework routine', 'Starts and completes a 15-minute homework block with a checklist'],
    ['Fine motor', 'Keyboarding', 'Types 10 words per minute using both hands'],
  ],
  'c-olivia': [
    ['Sensory', 'Tolerating textures', 'Joins messy play for 5 minutes with a calm body'],
    ['Self-care', 'Mealtime routine', 'Sits for a 15-minute family mealtime using utensils'],
    ['Fine motor', 'Scissor skills', 'Cuts along a curved line with a 1 cm margin'],
  ],
}

const MAYA_SCORES = [
  [1, 1.5, 2, 2, 3, 3.5, 4, 4.5],
  [1.5, 1.5, 2, 2.5, 2.5, 3, 3.5, 4],
  [1, 1, 1.5, 2, 2, 2.5, 3, 3],
]

interface SeriesDef {
  childId: string
  therapistId: string
  serviceId: string
  weekday: number | 'today'
  start: ClockTime
  back: number
  fwd: number
}

function signatureDataUrl(seed: number) {
  const r = mulberry32(seed)
  let d = `M 10 ${40 + r() * 10}`
  for (let x = 20; x < 220; x += 14) d += ` Q ${x} ${10 + r() * 50} ${x + 7} ${25 + r() * 30}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70"><path d="${d}" fill="none" stroke="#1D3731" stroke-width="2.4" stroke-linecap="round"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function seedStudio(waitlist: Ctx['waitlist']): StudioState {
  const now = new Date()
  const base: StudioState = {
    version: 1,
    seededFor: '',
    families: structuredClone(families),
    children: structuredClone(familyChildren),
    appointments: [],
    sites: [],
    siteVisits: [],
    goals: [],
    ratings: [],
    homeActivities: [],
    notes: [],
    invoices: [],
    packages: [],
    forms: [],
    enquiries: [],
    offers: [],
    plans: [],
    rooms,
    rules: structuredClone(defaultRules),
    events: [],
    outbox: [],
    audit: [],
    settings: structuredClone(defaultSettings),
    importedBookings: {},
    counters: { invoice: 1000, receipt: 5000 },
  }
  const c: Ctx = { s: base, now, actor: 'System', waitlist }
  const today = todayOf(c)
  base.seededFor = today
  const T = weekdayOf(today)
  const rnd = mulberry32(20261117)
  const s = base

  s.families.forEach((f, i) => (f.createdAt = new Date(now.getTime() - (70 + i * 9) * 86400_000).toISOString()))

  /* Sites + rosters */
  for (const def of siteDefs) {
    const { kids, ...rest } = def
    const children = roster(def.id, def.recurrence.therapistId, kids)
    s.children.push(...children)
    s.sites.push({ ...rest, childIds: children.map((ch) => ch.id) })
  }

  /* Appointments: weekly series */
  const series: SeriesDef[] = [
    { childId: 'c-maya', therapistId: 'julien-tremblay', serviceId: 'ot-session-home', weekday: 'today', start: '09:00', back: 8, fwd: 3 },
    { childId: 'c-ava', therapistId: 'julien-tremblay', serviceId: 'ot-session-home', weekday: 'today', start: '14:30', back: 6, fwd: 3 },
    { childId: 'c-zayd', therapistId: 'sofia-marchetti', serviceId: 'ot-session-clinic', weekday: 1, start: '15:00', back: 5, fwd: 3 },
    { childId: 'c-theo', therapistId: 'leah-thompson', serviceId: 'ot-session-virtual', weekday: 'today', start: '13:00', back: 8, fwd: 3 },
    { childId: 'c-jasleen', therapistId: 'sofia-marchetti', serviceId: 'ot-session-clinic', weekday: 'today', start: '10:00', back: 7, fwd: 3 },
    { childId: 'c-kabir', therapistId: 'sofia-marchetti', serviceId: 'ot-session-clinic', weekday: 'today', start: '11:00', back: 7, fwd: 3 },
    { childId: 'c-olivia', therapistId: 'rosa-delgado', serviceId: 'ot-session-home', weekday: 'today', start: '10:00', back: 8, fwd: 3 },
    { childId: 'c-mateo', therapistId: 'rosa-delgado', serviceId: 'ot-session-clinic', weekday: 3, start: '13:30', back: 6, fwd: 3 },
    { childId: 'c-finn', therapistId: 'leah-thompson', serviceId: 'ot-session-clinic', weekday: 1, start: '16:00', back: 8, fwd: 3 },
  ]

  const mk = (childId: string, therapistId: string, serviceId: string, date: ISODate, start: ClockTime, extra: Partial<Appointment> = {}): Appointment => {
    const svc = serviceById(serviceId)!
    const ch = s.children.find((x) => x.id === childId)!
    const f = s.families.find((x) => x.id === ch.familyId)!
    const end = fromMinutes(toMinutes(start) + svc.durationMinutes)
    const a: Appointment = {
      id: `ap-${childId}-${date}`,
      childId,
      familyId: f.id,
      therapistId,
      serviceId,
      date,
      start,
      end,
      mode: svc.mode,
      status: 'scheduled',
      km: svc.mode === 'In-Home' ? homeKm(f) : undefined,
      remindersSent: [],
      familyConfirmed: rnd() < 0.6,
      source: 'recurring',
      seriesId: `ser-${childId}`,
      ...extra,
    }
    a.roomId = pickRoom(s, svc.mode, date, start, end)
    s.appointments.push(a)
    return a
  }

  for (const sd of series) {
    const wd = sd.weekday === 'today' ? T : sd.weekday
    let anchor = today
    while (weekdayOf(anchor) !== wd) anchor = addDaysISO(anchor, -1)
    const svc = serviceById(sd.serviceId)!
    const assessId = svc.mode === 'In-Home' ? 'ot-assessment-home' : svc.mode === 'Virtual' ? 'ot-assessment-remote' : 'ot-assessment-clinic'
    mk(sd.childId, sd.therapistId, assessId, addDaysISO(anchor, -(sd.back + 1) * 7), '09:30', { source: 'online', seriesId: undefined })
    for (let w = -sd.back; w <= sd.fwd; w++) {
      const date = addDaysISO(anchor, w * 7)
      if (date === today || (sd.weekday === 'today' && w === 0)) {
        mk(sd.childId, sd.therapistId, sd.serviceId, today, sd.start)
        continue
      }
      mk(sd.childId, sd.therapistId, sd.serviceId, date, sd.start)
    }
  }
  // One-off assessments
  mk('c-leo', 'julien-tremblay', 'ot-assessment-home-extended', today, '11:00', { source: 'online', seriesId: undefined, bookingRef: 'MSP-L3OTRN', familyConfirmed: true })
  mk('c-amara', 'sofia-marchetti', 'ot-assessment-clinic', addDaysISO(today, 3), '10:00', { source: 'online', seriesId: undefined, bookingRef: 'MSP-AM4R2K', familyConfirmed: false })
  // Tomorrow, unconfirmed (for the 24 h reminder → call flag)
  mk('c-finn', 'leah-thompson', 'ot-session-clinic', addDaysISO(today, 1), '16:00', { seriesId: undefined, source: 'staff', familyConfirmed: false, id: 'ap-finn-extra' })

  /* Package for the Sandhu family */
  const pkgDate = addDaysISO(today, -20)
  s.packages.push({ id: 'pkg-sandhu', familyId: 'f-sandhu', name: '10-session package', sessions: 10, used: 0, purchasedOn: pkgDate })

  /* Site visits */
  for (const site of s.sites) {
    const dates = siteVisitDates(site.recurrence.weekday, addDaysISO(today, -70), addDaysISO(today, 14))
    for (const date of dates) {
      const v: SiteVisit = {
        id: `sv-${site.id}-${date}`,
        siteId: site.id,
        therapistId: site.recurrence.therapistId,
        date,
        start: site.recurrence.start,
        end: site.recurrence.end,
        status: date < today ? 'completed' : 'scheduled',
        attendance: site.childIds.map((childId) => {
          if (date >= today) return { childId, status: 'pending', minutes: 0 }
          const r = rnd()
          const status = r < 0.8 ? 'present' : r < 0.9 ? 'absent' : 'excused'
          return { childId, status, minutes: status === 'present' ? [30, 30, 45][Math.floor(rnd() * 3)] : 0 }
        }),
      }
      if (v.status === 'completed') {
        v.checkIn = atClinic(date, site.recurrence.start)
        v.checkOut = atClinic(date, site.recurrence.end)
      }
      s.siteVisits.push(v)
    }
  }

  /* Goals */
  for (const ch of s.children.filter((x) => x.familyId && x.status === 'active')) {
    const set = goalSets[ch.id] ?? goalSets.default
    set.forEach(([domain, title, target], i) => {
      const g: Goal = { id: `g-${ch.id}-${i}`, childId: ch.id, domain, title, target, createdAt: addDaysISO(today, -63), status: 'active' }
      s.goals.push(g)
    })
    const picks = activityLibrary.filter((a) => set.some(([d]) => d === a.domain)).slice(0, 3)
    picks.forEach((a, i) =>
      s.homeActivities.push({
        id: `ha-${ch.id}-${i}`,
        childId: ch.id,
        key: a.key,
        title: a.title.en,
        domain: a.domain,
        frequency: a.frequency,
        completions: [1, 2, 3, 4, 5, 6].filter(() => rnd() < 0.55).map((d) => addDaysISO(today, -d)),
      }),
    )
  }

  /* Forms */
  for (const f of s.families) {
    for (const kind of ['intake', 'consent'] as const) {
      const pending = f.id === 'f-okafor' || (f.id === 'f-tran' && kind === 'consent')
      s.forms.push({
        id: `frm-${f.id}-${kind}`,
        familyId: f.id,
        kind,
        status: pending ? 'requested' : 'completed',
        requestedAt: f.createdAt,
        completedAt: pending ? undefined : new Date(new Date(f.createdAt).getTime() + 86400_000).toISOString(),
        signature: pending ? undefined : { name: f.guardians[0].name, dataUrl: signatureDataUrl(f.id.length * 31), at: f.createdAt },
        answers: pending ? undefined : kind === 'consent' ? { assessment: true, shareSchool: f.id !== 'f-chen', photos: false } : { concerns: 'Fine motor and daily routines', goals: 'More independence at home and school', language: f.language },
      })
    }
  }

  /* Enquiries */
  const ago = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()
  s.enquiries.push(
    { id: 'enq-1', name: 'Rebecca Hughes', email: 'rebecca.hughes@example.com', phone: '(905) 555-0301', topic: 'Booking an assessment', message: 'My son is 5 and finds handwriting and scissors really hard. Do you have weekend times?', createdAt: ago(5), status: 'new', source: 'Contact form' },
    { id: 'enq-2', name: 'Ali Hassan', email: 'ali.hassan@example.com', phone: '(905) 555-0302', topic: 'Website assistant', message: 'Asked about in-home visits in Meadowvale and asked for a call back.', createdAt: ago(26), status: 'new', source: 'Website assistant' },
    { id: 'enq-3', name: 'Julia Santos', email: 'julia.santos@example.com', phone: '(905) 555-0303', topic: 'General question', message: 'Our daughter’s school suggested OT for sensory needs. What are the next steps?', createdAt: ago(60), status: 'intake-sent', source: 'Phone' },
    { id: 'enq-4', name: 'Chidi Okafor', email: 'chidi.okafor@example.com', phone: '(905) 555-0165', topic: 'Booking an assessment', message: 'Toddler assessment please.', createdAt: ago(200), status: 'converted', source: 'Contact form', familyId: 'f-okafor' },
  )

  /* Month-end run on the 1st (owner report) */
  const monthStart = format(startOfMonth(parseISO(today)), 'yyyy-MM-dd')

  /* Package invoice */
  const sessionFee = s.settings.fees['ot-session-clinic']
  c.now = new Date(atClinic(pkgDate, '12:00'))
  const pkgInv = issueInvoice(c, { kind: 'family', id: 'f-sandhu' }, [{ id: 'ln-pkg', description: '10-session package (10 × In-Clinic session, 10% package discount)', date: pkgDate, qty: 1, unitPrice: round2(sessionFee * 10 * 0.9), amount: round2(sessionFee * 10 * 0.9) }], 'per-visit', pkgDate)
  s.packages[0].invoiceId = pkgInv.id
  c.now = new Date(atClinic(addDaysISO(pkgDate, 1), '10:00'))
  recordPayment(c, pkgInv.id, pkgInv.total, 'Credit card', addDaysISO(pkgDate, 1))

  /* Process past visits chronologically (as they "happened") */
  s.rules.find((r) => r.id === 'assessment-done')!.enabled = false
  const forcedNoShow = new Set([`ap-c-olivia-${addDaysISO(today, -14)}`, `ap-c-olivia-${addDaysISO(today, -35)}`])
  const past = s.appointments.filter((a) => a.date < today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  let monthEndDone = false
  let lastMonthBatchDone = false
  for (const a of past) {
    if (!monthEndDone && a.date >= monthStart) {
      c.now = new Date(atClinic(monthStart, '06:00'))
      if (!lastMonthBatchDone) {
        runBatch({ ...c, actor: 'Automation' }, 'monthly', 'all')
        lastMonthBatchDone = true
      }
      runMonthEnd({ ...c, actor: 'Automation' })
      monthEndDone = true
    }
    c.now = new Date(atClinic(a.date, a.end))
    const r = rnd()
    if (forcedNoShow.has(a.id) || (r < 0.04 && !a.childId.startsWith('c-maya'))) {
      markNoShow(c, a.id)
    } else if (r < 0.07 && a.serviceId.includes('session')) {
      a.status = 'late-cancel'
      a.cancelledAt = atClinic(addDaysISO(a.date, -1), '20:00')
      if (s.families.find((f) => f.id === a.familyId)?.billing === 'per-visit') issueInvoice(c, { kind: 'family', id: a.familyId }, [lineForAppointment(c, a)], 'per-visit', a.date)
    } else if (r < 0.09 && a.serviceId.includes('session')) {
      a.status = 'cancelled'
      a.cancelledAt = atClinic(addDaysISO(a.date, -4), '09:00')
    } else {
      a.checkIn = { at: atClinic(a.date, fromMinutes(toMinutes(a.start) + 2)) }
      completeAppointment(c, a.id, a.mode === 'In-Home' ? { signature: { name: s.families.find((f) => f.id === a.familyId)!.guardians[0].name, dataUrl: signatureDataUrl(toMinutes(a.start) + a.date.length * 7 + a.childId.length), at: atClinic(a.date, a.end) } } : {})
    }
    a.remindersSent = [48, 24]
    a.familyConfirmed = true
  }
  if (!monthEndDone) {
    c.now = new Date(atClinic(monthStart, '06:00'))
    runBatch({ ...c, actor: 'Automation' }, 'monthly', 'all')
    runMonthEnd({ ...c, actor: 'Automation' })
  }
  s.rules.find((r) => r.id === 'assessment-done')!.enabled = true

  /* Today's visits so far (the "phone" view: completed / checked in / upcoming) */
  const maya = s.appointments.find((a) => a.childId === 'c-maya' && a.date === today)!
  c.now = new Date(atClinic(today, '09:03'))
  maya.checkIn = { at: c.now.toISOString(), lat: 43.5751, lng: -79.7202 }
  c.now = new Date(atClinic(today, '09:58'))
  completeAppointment({ ...c, actor: 'Julien Tremblay' }, maya.id, { signature: { name: 'Nadia Rahman', dataUrl: signatureDataUrl(4242), at: c.now.toISOString() }, geo: { lat: 43.5751, lng: -79.7202 } })
  const leo = s.appointments.find((a) => a.childId === 'c-leo' && a.date === today)!
  leo.status = 'checked-in'
  leo.checkIn = { at: atClinic(today, '11:04'), lat: 43.6031, lng: -79.7744 }
  const jas = s.appointments.find((a) => a.childId === 'c-jasleen' && a.date === today)!
  c.now = new Date(atClinic(today, '10:46'))
  jas.checkIn = { at: atClinic(today, '10:01') }
  completeAppointment({ ...c, actor: 'Sofia Marchetti' }, jas.id)

  /* Ratings + notes for completed sessions */
  for (const ch of s.children.filter((x) => x.familyId)) {
    const goals = s.goals.filter((g) => g.childId === ch.id)
    const sessions = s.appointments.filter((a) => a.childId === ch.id && a.status === 'completed' && a.serviceId.includes('session')).sort((a, b) => a.date.localeCompare(b.date)).slice(-8)
    goals.forEach((g, gi) => {
      const start = 1 + Math.round(rnd()) * 0.5
      const end = 3 + Math.round(rnd() * 3) * 0.5
      sessions.forEach((a, i) => {
        const score = ch.id === 'c-maya' ? MAYA_SCORES[gi][i + (8 - sessions.length)] : Math.min(5, Math.max(1, Math.round((start + ((end - start) * i) / Math.max(1, sessions.length - 1) + (rnd() - 0.5) * 0.5) * 2) / 2))
        s.ratings.push({ id: `r-${g.id}-${i}`, goalId: g.id, date: a.date, score, appointmentId: a.id })
      })
    })
    const allDone = s.appointments.filter((a) => a.childId === ch.id && a.status === 'completed')
    for (const a of allDone) {
      const age = (new Date(today).getTime() - new Date(a.date).getTime()) / 86400_000
      if (age < 3) continue // recent visits stay as open note tasks
      const svc = serviceById(a.serviceId)!
      const soap = draftSoap({
        bullets: svc.kind === 'assessment'
          ? `Parent reports concerns with ${goals[0]?.title.toLowerCase() ?? 'daily routines'}\nStandardized and play-based assessment completed\nNext: share written summary and recommend weekly sessions`
          : `Parent says practice at home is going well\n${goals.map((g) => `${g.title}: worked on ${g.target.toLowerCase()}`).join('\n')}\nImproved participation compared with last week\nContinue home program`,
        child: ch.firstName,
        serviceId: a.serviceId,
        minutes: svc.durationMinutes,
        goals,
      })
      s.notes.push({ id: `n-${a.id}`, appointmentId: a.id, childId: ch.id, therapistId: a.therapistId, status: 'signed', soap, aiDrafted: rnd() < 0.6, createdAt: atClinic(a.date, a.end), signedAt: atClinic(a.date, '18:30') })
    }
  }
  // One draft waiting for sign-off
  const draftTarget = s.appointments.filter((a) => a.childId === 'c-ava' && a.status === 'completed').sort((a, b) => b.date.localeCompare(a.date))[0]
  if (draftTarget && !s.notes.some((n) => n.appointmentId === draftTarget.id)) {
    s.notes.push({ id: `n-${draftTarget.id}`, appointmentId: draftTarget.id, childId: 'c-ava', therapistId: draftTarget.therapistId, status: 'draft', soap: draftSoap({ bullets: sampleBullets, child: 'Ava', serviceId: draftTarget.serviceId, minutes: 60, goals: s.goals.filter((g) => g.childId === 'c-ava') }), aiDrafted: true, createdAt: atClinic(draftTarget.date, draftTarget.end) })
  }

  /* Payments */
  const methods: Invoice['payments'][number]['method'][] = ['e-Transfer', 'e-Transfer', 'Credit card', 'Debit', 'Insurance (direct)']
  for (const inv of [...s.invoices].sort((a, b) => a.issuedOn.localeCompare(b.issuedOn))) {
    if (inv.status !== 'issued') continue
    const age = (new Date(today).getTime() - new Date(inv.issuedOn).getTime()) / 86400_000
    const famId = inv.billTo.kind === 'family' ? inv.billTo.id : ''
    let payAfter: number | null
    if (famId === 'f-obrien' && age < 50) payAfter = null
    else if (famId === 'f-chen' && age < 12) payAfter = null
    else if (inv.billTo.kind === 'site') payAfter = inv.billTo.id === 's-cedarbrook' ? null : age > 20 ? 18 : null
    else if (age < 3) payAfter = null
    else {
      const r = rnd()
      payAfter = r < 0.9 ? Math.floor(rnd() * Math.min(10, age)) : Math.min(age - 1, 16 + Math.floor(rnd() * 5))
    }
    if (payAfter == null) continue
    const date = addDaysISO(inv.issuedOn, payAfter)
    if (date > today) continue
    c.now = new Date(atClinic(date, '12:00'))
    recordPayment({ ...c, actor: 'Front desk' }, inv.id, inv.total, inv.billTo.kind === 'site' ? 'e-Transfer' : methods[Math.floor(rnd() * methods.length)], date)
  }

  /* Time-based automations up to now */
  c.now = now
  runScheduled({ ...c, actor: 'Automation' })
  event(c, 'month-end', 'Owner report ready', `Monthly owner report for ${format(parseISO(addDaysISO(monthStart, -1)), 'MMMM yyyy')} available on the dashboard`, '/studio/dashboard')

  s.audit.push(
    { id: 'au-seed-1', at: new Date(now.getTime() - 3600_000 * 30).toISOString(), actor: 'Priya Shah (Owner)', action: 'Updated late-cancellation policy to 24 h / 50%', target: 'Settings' },
    { id: 'au-seed-2', at: new Date(now.getTime() - 3600_000 * 50).toISOString(), actor: 'Marcus Bell (Front desk)', action: 'Exported attendance report', target: 'Maple Grove Public School' },
  )

  for (const list of [s.events, s.outbox, s.audit]) list.sort((a, b) => b.at.localeCompare(a.at))
  return s
}

const sampleBullets = `Mom says Ava is trying zippers at home
Completed obstacle course 3 times with verbal cues
Buttoned 4 of 5 buttons, needed help with the smallest one
Improved tolerance for the swing compared with last week
Next session: continue zipper practice and send peg game home`
