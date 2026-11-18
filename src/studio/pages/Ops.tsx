import { useState } from 'react'
import { Check, Clock, Mail, MessageSquare, Play, RotateCcw, ShieldCheck, Lock, Sparkles, Trash2, X, Zap, Send, UserPlus } from 'lucide-react'
import { format, parseISO, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useDemoStore } from '@/hooks/useDemoStore'
import { therapists, fullName } from '@/data/therapists'
import { treatmentById } from '@/data/treatments'
import { formatTime, fromMinutes, toMinutes } from '@/utils/time'
import { cn } from '@/lib/utils'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { Card, CardTitle, Countdown, DataTable, Empty, Notice, PageHeader, Pill, PrintButton, Tabs, TextLink, Stat } from '../ui'
import { audit, cancelAppointment, childName, createAppointment, event, matchWaitlist, offerToWaitlist, runMonthEnd, runOverdue, runReminders, send, therapistName } from '../engine'
import { bestSlots } from '../ai'
import { areaLabels, defaultSettings, languages, permissions, roleLabels, rooms, serviceById, services, type Area } from '../reference'
import { fullDate, hoursUntil, money, shortDate, sid, stamp, sum, today } from '../util'
import type { Lang, RuleId, Role } from '../types'
import { inMonth } from '../selectors'
import { DocHeader } from './Documents'

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/* ---------- Waitlist & auto-offers ---------- */

export function WaitlistPage() {
  return (
    <Guard area="waitlist">
      <WaitlistInner />
    </Guard>
  )
}

function WaitlistInner() {
  const { s, act, waitlist } = useStudio()
  const demo = useDemoStore()
  const [suggestFor, setSuggestFor] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const waiting = waitlist.filter((w) => w.status === 'waiting')
  const active = s.offers.filter((o) => o.status === 'offered')
  const history = s.offers.filter((o) => o.status !== 'offered').slice(0, 10)

  const simulate = () => {
    const out = act((c) => {
      const candidate = c.s.appointments
        .filter((a) => a.status === 'scheduled' && hoursUntil(a.date, a.start) > c.s.settings.lateCancelHours)
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
        .find((a) => matchWaitlist(c, a).length > 0)
      if (!candidate) return 'No upcoming visit matches a waitlist family right now.'
      audit(c, 'Family cancelled (simulated)', `${childName(c.s, candidate.childId)} · ${candidate.date}`)
      cancelAppointment({ ...c, actor: 'Parent (simulated)' }, candidate.id, 'family')
      return `${childName(c.s, candidate.childId)} cancelled ${shortDate(candidate.date)} ${formatTime(candidate.start)} — the slot was offered automatically.`
    })
    setMsg(out)
  }

  const respond = (offerId: string, yes: boolean) => {
    const offer = s.offers.find((o) => o.id === offerId)!
    const entry = waitlist.find((w) => w.id === offer.waitlistId)
    act((c) => {
      const o = c.s.offers.find((x) => x.id === offerId)!
      if (!yes) {
        o.status = 'declined'
        event(c, 'slot-cancelled', `${o.name} declined`, 'Offering the slot to the next matching family')
        const tried = c.s.offers.filter((x) => x.date === o.date && x.start === o.start && x.therapistId === o.therapistId).map((x) => x.waitlistId)
        offerToWaitlist(c, { therapistId: o.therapistId, serviceId: o.serviceId, date: o.date, start: o.start, end: o.end, fromAppointmentId: o.fromAppointmentId }, tried)
        return
      }
      o.status = 'accepted'
      const [first, ...rest] = o.name.split(' ')
      const famId = sid('fam')
      c.s.families.push({ id: famId, name: rest.join(' ') || first, guardians: [{ name: o.name, relationship: 'Parent', email: o.email, phone: entry?.phone ?? '' }], address: 'Address to be collected at intake', city: 'Mississauga', postalCode: '', geo: { lat: 43.58, lng: -79.68 }, language: 'en', preferredChannel: 'email', billing: 'per-visit', source: 'Waitlist', createdAt: new Date().toISOString() })
      const childId = sid('ch')
      c.s.children.push({ id: childId, familyId: famId, firstName: 'Child', lastName: `(${rest.join(' ') || first})`, dob: '2020-01-01', therapistId: o.therapistId, status: 'assessment' })
      const pref = entry?.preferredTreatmentId && serviceById(entry.preferredTreatmentId) ? entry.preferredTreatmentId : o.serviceId
      let r = createAppointment(c, { childId, therapistId: o.therapistId, serviceId: pref, date: o.date, start: o.start, source: 'waitlist' })
      if (!r.ok) r = createAppointment(c, { childId, therapistId: o.therapistId, serviceId: o.serviceId, date: o.date, start: o.start, source: 'waitlist' })
      for (const kind of ['intake', 'consent'] as const) c.s.forms.push({ id: sid('frm'), familyId: famId, childId, kind, status: 'requested', requestedAt: new Date().toISOString() })
      const fam = c.s.families.find((f) => f.id === famId)
      send(c, 'confirmation', fam, { child: 'your child', service: serviceById(pref)?.name, therapist: therapistName(o.therapistId), date: o.date, time: o.start })
      send(c, 'forms', fam, { child: 'your child' })
      event(c, 'slot-cancelled', `${o.name} accepted the slot`, `Booked ${o.date} ${o.start} with ${therapistName(o.therapistId)}; intake & consent requested`, `/studio/clients/${famId}`)
      audit(c, 'Waitlist offer accepted', o.name)
    })
    if (yes && entry) demo.setWaitlistStatus(entry.id, 'contacted')
  }

  return (
    <>
      <PageHeader
        eyebrow="Waitlist"
        title="Cancelled slots fill themselves"
        intro={`When a visit is cancelled, the slot is offered to the best-matching waitlist family and held for ${s.settings.holdMinutes / 60} hours. If they don’t reply, it moves to the next family.`}
        actions={
          <Button onClick={simulate}>
            <Zap aria-hidden /> Simulate a cancellation
          </Button>
        }
      />
      {msg && (
        <div className="mb-5" role="status">
          <Notice tone="sage">{msg}</Notice>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card aria-labelledby="offers-h">
          <CardTitle id="offers-h">Offers on hold ({active.length})</CardTitle>
          {active.length ? (
            <ul className="space-y-3">
              {active.map((o) => (
                <li key={o.id} className="rounded-2xl bg-butter/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-forest">{o.name}</p>
                    <Pill tone="forest" icon={Clock}>
                      Hold <Countdown until={o.expiresAt} />
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-charcoal-soft">
                    {fullDate(o.date)} · {formatTime(o.start)} · {therapistName(o.therapistId)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => respond(o.id, true)}>
                      <Check aria-hidden /> Family accepts
                    </Button>
                    <Button size="sm" variant="soft" onClick={() => respond(o.id, false)}>
                      <X aria-hidden /> Declines
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No offers on hold. Try “Simulate a cancellation”.</Empty>
          )}
          {history.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 font-sans font-bold text-forest">Recent offers</h3>
              <ul className="space-y-1 text-sm">
                {history.map((o) => (
                  <li key={o.id} className="flex justify-between gap-2">
                    <span>
                      {o.name} · {shortDate(o.date)} {formatTime(o.start)}
                    </span>
                    <Pill tone={o.status === 'accepted' ? 'sage' : 'ivory'}>{o.status}</Pill>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card aria-labelledby="wl-h">
          <CardTitle id="wl-h">Waiting families ({waiting.length})</CardTitle>
          {waiting.length ? (
            <ul className="space-y-3">
              {waiting.map((w) => (
                <li key={w.id} className="rounded-2xl bg-ivory p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-forest">{w.name}</p>
                    <span className="text-xs text-charcoal-soft">since {shortDate(w.createdAt.slice(0, 10))}</span>
                  </div>
                  <p className="text-sm text-charcoal-soft">
                    {treatmentById(w.preferredTreatmentId)?.name ?? 'Any service'} · {w.preferredTherapistId === 'any' ? 'Any therapist' : therapistName(w.preferredTherapistId)} · {w.preferredDays.length ? w.preferredDays.map((d) => WD[d]).join(', ') : 'Any day'} · {w.preferredTime === 'any' ? 'any time' : w.preferredTime}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setSuggestFor(w.id)}>
                      <Sparkles aria-hidden /> Smart slot suggestions
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Remove ${w.name}`} onClick={() => demo.removeWaitlistEntry(w.id)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nobody is waiting.</Empty>
          )}
        </Card>
      </div>
      {suggestFor && <SuggestDialog waitlistId={suggestFor} onClose={() => setSuggestFor(null)} />}
    </>
  )
}

function SuggestDialog({ waitlistId, onClose }: { waitlistId: string; onClose: () => void }) {
  const { s, act, waitlist } = useStudio()
  const w = waitlist.find((x) => x.id === waitlistId)!
  const svcId = serviceById(w.preferredTreatmentId) ? w.preferredTreatmentId : 'ot-assessment-clinic'
  const pool = w.preferredTherapistId === 'any' ? therapists.map((t) => t.id) : [w.preferredTherapistId]
  const sugg = pool
    .flatMap((tid) => bestSlots(s, tid, svcId, today(), { days: w.preferredDays, time: w.preferredTime }).map((x) => ({ ...x, tid })))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  const [done, setDone] = useState(false)
  const offer = (x: (typeof sugg)[number]) => {
    act((c) => {
      const svc = serviceById(svcId)!
      const expiresAt = new Date(Date.now() + c.s.settings.holdMinutes * 60_000).toISOString()
      const end = fromMinutes(toMinutes(x.start) + svc.durationMinutes)
      c.s.offers.unshift({ id: sid('of'), waitlistId: w.id, name: w.name, email: w.email, therapistId: x.tid, serviceId: svcId, date: x.date, start: x.start, end, offeredAt: new Date().toISOString(), expiresAt, status: 'offered' })
      send(c, 'waitlist-offer', undefined, { parent: w.name.split(' ')[0], date: x.date, time: x.start, therapist: therapistName(x.tid), hold: expiresAt }, { to: w.email })
      event(c, 'slot-cancelled', `Smart offer to ${w.name}`, `${x.date} ${x.start} with ${therapistName(x.tid)} (${x.reasons.join(', ')})`, '/studio/waitlist')
      audit(c, 'Sent smart-scheduling offer', w.name)
    })
    setDone(true)
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`Best slots for ${w.name}`} description="AI sample: ranks open times by the family’s preferences and how well they fit the therapist’s day.">
        {done ? (
          <p role="status" className="font-semibold text-forest">
            Offer sent and held for {s.settings.holdMinutes / 60} hours.
          </p>
        ) : sugg.length ? (
          <ul className="space-y-2">
            {sugg.map((x) => (
              <li key={x.tid + x.date + x.start} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ivory p-3">
                <div>
                  <p className="font-semibold text-forest">
                    {fullDate(x.date)} · {formatTime(x.start)} · {therapistName(x.tid)}
                  </p>
                  <p className="text-xs text-charcoal-soft">{x.reasons.join(' · ')}</p>
                </div>
                <Button size="sm" onClick={() => offer(x)}>
                  Offer
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No open times in the next 3 weeks.</Empty>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Enquiries & intake ---------- */

export function EnquiriesPage() {
  return (
    <Guard area="enquiries">
      <EnquiriesInner />
    </Guard>
  )
}

function EnquiriesInner() {
  const { s, act, setViewer } = useStudio()
  const list = [...s.enquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const sendIntake = (id: string) =>
    act((c) => {
      const e = c.s.enquiries.find((x) => x.id === id)!
      const [first, ...rest] = e.name.split(' ')
      const famId = sid('fam')
      c.s.families.push({ id: famId, name: rest.join(' ') || first, guardians: [{ name: e.name, relationship: 'Parent', email: e.email, phone: e.phone }], address: 'Address to be collected at intake', city: 'Mississauga', postalCode: '', geo: { lat: 43.59, lng: -79.7 }, language: 'en', preferredChannel: 'email', billing: 'per-visit', source: 'Enquiry', createdAt: new Date().toISOString() })
      const childId = sid('ch')
      c.s.children.push({ id: childId, familyId: famId, firstName: 'Child', lastName: `(${rest.join(' ') || first})`, dob: '2020-01-01', therapistId: 'sofia-marchetti', status: 'assessment' })
      for (const kind of ['intake', 'consent'] as const) c.s.forms.push({ id: sid('frm'), familyId: famId, childId, kind, status: 'requested', requestedAt: new Date().toISOString() })
      send(c, 'forms', c.s.families.find((f) => f.id === famId), { child: 'your child' })
      e.status = 'intake-sent'
      e.familyId = famId
      event(c, 'booking-confirmed', `Intake sent · ${e.name}`, 'Family profile created; intake & consent forms requested', `/studio/clients/${famId}`)
      audit(c, 'Sent intake & consent forms', e.name)
    })
  return (
    <>
      <PageHeader eyebrow="Steps 1–2 · Enquiry → intake" title="Enquiries & intake" intro="Contact-form messages and website-assistant requests land here. One click creates the family profile and sends intake and consent forms with e-signature." />
      <div className="space-y-4">
        {list.map((e) => {
          const forms = s.forms.filter((f) => f.familyId === e.familyId)
          return (
            <Card key={e.id} as="article" aria-label={e.name}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-forest">
                    {e.name} <span className="font-normal text-charcoal-soft">· {e.topic}</span>
                  </p>
                  <p className="text-sm text-charcoal-soft">
                    {e.email} · {e.phone || 'no phone'} · {stamp(e.createdAt)} · via {e.source}
                  </p>
                  <p className="mt-2 text-charcoal">“{e.message}”</p>
                </div>
                <Pill tone={e.status === 'new' ? 'peach' : e.status === 'converted' ? 'sage' : e.status === 'closed' ? 'ivory' : 'butter'}>{e.status === 'intake-sent' ? 'Intake sent' : e.status[0].toUpperCase() + e.status.slice(1)}</Pill>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {e.status === 'new' && (
                  <>
                    <Button size="sm" onClick={() => sendIntake(e.id)}>
                      <Send aria-hidden /> Send intake &amp; consent forms
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => act((c) => { c.s.enquiries.find((x) => x.id === e.id)!.status = 'closed'; audit(c, 'Closed enquiry', e.name) })}>
                      Close
                    </Button>
                  </>
                )}
                {e.familyId && (
                  <>
                    {forms.map((f) => (
                      <Pill key={f.id} tone={f.status === 'completed' ? 'sage' : 'butter'}>
                        {f.kind}: {f.status === 'completed' ? 'signed' : 'awaiting'}
                      </Pill>
                    ))}
                    <TextLink to={`/studio/clients/${e.familyId}`}>Family profile</TextLink>
                    {e.status === 'intake-sent' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setViewer({ role: 'parent', familyId: e.familyId! })}>
                          <UserPlus aria-hidden /> View as this parent
                        </Button>
                        <Button size="sm" variant="soft" onClick={() => act((c) => { c.s.enquiries.find((x) => x.id === e.id)!.status = 'converted'; audit(c, 'Enquiry converted to client', e.name) })}>
                          Mark converted
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}

/* ---------- Automation ---------- */

export function AutomationPage() {
  return (
    <Guard area="automation">
      <AutomationInner />
    </Guard>
  )
}

function AutomationInner() {
  const { s, act, viewer } = useStudio()
  const [tab, setTab] = useState<'rules' | 'log' | 'outbox'>('rules')
  const [ruleFilter, setRuleFilter] = useState<RuleId | 'all'>('all')
  const [lang, setLang] = useState<Lang | 'all'>('all')
  const [ran, setRan] = useState('')
  const run = (which: 'reminders' | 'overdue' | 'month-end') => {
    const n = act((c) => (which === 'reminders' ? runReminders({ ...c, actor: 'Automation' }) : which === 'overdue' ? runOverdue({ ...c, actor: 'Automation' }) : runMonthEnd({ ...c, actor: 'Automation' })))
    setRan(which === 'month-end' ? `Month-end complete: owner report ready, ${n} statements sent.` : n ? `${n} message${n > 1 ? 's' : ''} sent.` : 'Nothing due right now — everything is up to date.')
  }
  const events = s.events.filter((e) => ruleFilter === 'all' || e.ruleId === ruleFilter)
  const outbox = s.outbox.filter((m) => lang === 'all' || m.lang === lang)
  return (
    <>
      <PageHeader eyebrow="Automation" title="What runs on its own" intro="Rules handle the routine work. Every automatic action is logged, and every message lands in the outbox in the family’s language." />
      <Tabs label="Automation sections" value={tab} onChange={setTab} items={[{ id: 'rules', label: 'Rules' }, { id: 'log', label: 'Automation log', count: s.events.length }, { id: 'outbox', label: 'Outbox', count: s.outbox.length }]} />
      {ran && (
        <div className="mb-4" role="status">
          <Notice tone="sage">{ran}</Notice>
        </div>
      )}
      {tab === 'rules' && (
        <div className="grid gap-3 lg:grid-cols-2">
          {s.rules.map((r) => (
            <div key={r.id} className="flex items-stretch gap-3">
              <div className={cn('flex w-44 shrink-0 items-center rounded-2xl px-4 py-3 text-sm font-semibold sm:w-52', r.enabled ? 'bg-forest text-ivory' : 'bg-forest/30 text-ivory')}>{r.trigger}</div>
              <div className="flex flex-1 flex-col justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm shadow-soft">
                <span className={r.enabled ? 'text-charcoal' : 'text-charcoal-soft line-through'}>{r.action}</span>
                <span className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-forest">
                    <input type="checkbox" checked={r.enabled} disabled={viewer.role !== 'owner'} onChange={(e) => act((c) => { c.s.rules.find((x) => x.id === r.id)!.enabled = e.target.checked; audit(c, `${e.target.checked ? 'Enabled' : 'Paused'} rule “${r.trigger}”`, 'Automation') })} className="size-4 accent-forest" />
                    {r.enabled ? 'On' : 'Paused'}
                  </label>
                  {r.id === 'reminders' && <Button size="sm" variant="ghost" onClick={() => run('reminders')}><Play aria-hidden /> Run now</Button>}
                  {r.id === 'invoice-overdue' && <Button size="sm" variant="ghost" onClick={() => run('overdue')}><Play aria-hidden /> Run now</Button>}
                  {r.id === 'month-end' && <Button size="sm" variant="ghost" onClick={() => run('month-end')}><Play aria-hidden /> Run now</Button>}
                  <span className="text-xs text-charcoal-soft">{s.events.filter((e) => e.ruleId === r.id).length} runs logged</span>
                </span>
              </div>
            </div>
          ))}
          {viewer.role !== 'owner' && <p className="text-xs text-charcoal-soft lg:col-span-2">Only the owner can pause or resume rules.</p>}
        </div>
      )}
      {tab === 'log' && (
        <Card>
          <div className="mb-4 max-w-xs">
            <label className="sr-only" htmlFor="rule-filter">
              Filter by rule
            </label>
            <Select id="rule-filter" value={ruleFilter} onChange={(e) => setRuleFilter(e.target.value as RuleId | 'all')} className="h-10">
              <option value="all">All rules</option>
              {s.rules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.trigger}
                </option>
              ))}
            </Select>
          </div>
          <ul className="divide-y divide-forest/5">
            {events.slice(0, 80).map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                <span>
                  <Zap className="mr-1 inline size-3.5 text-terracotta" aria-hidden />
                  <b className="text-forest">{e.title}</b> <span className="text-charcoal-soft">— {e.detail}</span> {e.link && <TextLink to={e.link}>Open</TextLink>}
                </span>
                <span className="text-xs text-charcoal-soft">{stamp(e.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {tab === 'outbox' && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="lang-filter">
              Filter by language
            </label>
            <Select id="lang-filter" value={lang} onChange={(e) => setLang(e.target.value as Lang | 'all')} className="h-10 max-w-xs">
              <option value="all">All languages</option>
              {Object.entries(languages).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
            <Pill tone="lavender">Demo outbox — nothing is actually sent</Pill>
          </div>
          <ul className="space-y-2">
            {outbox.slice(0, 60).map((m) => (
              <li key={m.id}>
                <details className="rounded-2xl bg-ivory p-3">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      {m.channel === 'sms' ? <MessageSquare className="size-4 text-forest" aria-label="SMS" /> : <Mail className="size-4 text-forest" aria-label="Email" />}
                      <b className="text-forest" dir={languages[m.lang].dir}>{m.subject}</b>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-charcoal-soft">
                      <Pill tone="ivory">{languages[m.lang].label}</Pill> {m.to} · {stamp(m.at)}
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-charcoal" dir={languages[m.lang].dir}>
                    {m.body}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

/* ---------- Mileage ---------- */

export function MileagePage() {
  return (
    <Guard area="mileage">
      <MileageInner />
    </Guard>
  )
}

function MileageInner() {
  const { s, viewer } = useStudio()
  const t = today()
  const [which, setWhich] = useState<'this' | 'last'>('this')
  const ref = which === 'this' ? t : format(subMonths(parseISO(t), 1), 'yyyy-MM-dd')
  const [tid, setTid] = useState(viewer.role === 'therapist' ? viewer.therapistId : 'all')
  const ids = viewer.role === 'therapist' ? [viewer.therapistId] : tid === 'all' ? therapists.map((x) => x.id) : [tid]
  const rows = s.appointments.filter((a) => ids.includes(a.therapistId) && a.mode === 'In-Home' && a.status === 'completed' && inMonth(a.date, ref)).sort((a, b) => a.date.localeCompare(b.date))
  const km = Math.round(sum(rows.map((a) => a.km ?? 0)) * 10) / 10
  return (
    <>
      <PageHeader eyebrow="Mileage" title="Home-visit mileage" intro="Round-trip distance from the clinic is logged for every completed home visit." actions={<PrintButton label="Print claim" />} />
      <div className="no-print mb-5 flex flex-wrap items-center gap-3">
        <Tabs label="Month" value={which} onChange={setWhich} items={[{ id: 'this', label: format(parseISO(t), 'MMMM') }, { id: 'last', label: format(subMonths(parseISO(t), 1), 'MMMM') }]} />
        {viewer.role !== 'therapist' && (
          <Select aria-label="Therapist" value={tid} onChange={(e) => setTid(e.target.value)} className="mb-5 h-10 max-w-xs">
            <option value="all">All therapists</option>
            {therapists.map((x) => (
              <option key={x.id} value={x.id}>
                {fullName(x)}
              </option>
            ))}
          </Select>
        )}
      </div>
      <div className="mb-5 grid grid-cols-3 gap-4">
        <Stat value={rows.length} label="Home visits" tone="sage" />
        <Stat value={`${km} km`} label="Distance" tone="sage" />
        <Stat value={money(km * s.settings.mileageRate)} label={`At ${money(s.settings.mileageRate)}/km (demo)`} tone="sage" />
      </div>
      <Card className="print-card">
        <DocHeader title="Mileage claim" subtitle={format(parseISO(ref), 'MMMM yyyy')} />
        {rows.length ? (
          <DataTable columns={['Date', 'Therapist', 'Child', 'Round trip', 'Claim']} rows={rows.map((a) => [shortDate(a.date), therapistName(a.therapistId), childName(s, a.childId).replace(/ (\S)\S*$/, ' $1.'), `${a.km} km`, money((a.km ?? 0) * s.settings.mileageRate)])} />
        ) : (
          <Empty>No completed home visits this month.</Empty>
        )}
      </Card>
    </>
  )
}

/* ---------- Settings & access ---------- */

export function SettingsPage() {
  return (
    <Guard area="settings">
      <SettingsInner />
    </Guard>
  )
}

function SettingsInner() {
  const { s, act, reset } = useStudio()
  const demo = useDemoStore()
  const [confirm, setConfirm] = useState(false)
  const set = (k: keyof typeof defaultSettings, v: number) => act((c) => { (c.s.settings as unknown as Record<string, number>)[k] = v; audit(c, `Changed setting ${k} to ${v}`, 'Settings') })
  const roles: Role[] = ['owner', 'frontdesk', 'therapist', 'parent']
  const num = (k: keyof typeof defaultSettings, label: string, suffix = '') => (
    <label className="flex items-center justify-between gap-3 border-b border-forest/5 py-2.5 text-sm">
      <span className="text-charcoal">{label}</span>
      <span className="flex items-center gap-2">
        <Input type="number" step="any" min={0} value={s.settings[k] as number} onChange={(e) => set(k, Number(e.target.value))} className="h-9 w-24 text-right" />
        <span className="w-10 text-xs text-charcoal-soft">{suffix}</span>
      </span>
    </label>
  )
  return (
    <>
      <PageHeader eyebrow="Settings" title="Policies, fees & access" intro="Designed for a regulated health practice: billing rules, people in control of AI, role-based access and a full audit trail." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card aria-labelledby="fees-h">
          <CardTitle id="fees-h">Fee schedule</CardTitle>
          <Notice tone="lavender">Placeholder demo fees — replace with the clinic’s own fee schedule. The public website never shows prices.</Notice>
          <div className="mt-3">
            {services.map((svc) => (
              <label key={svc.id} className="flex items-center justify-between gap-3 border-b border-forest/5 py-2.5 text-sm">
                <span className="text-charcoal">{svc.name}</span>
                <span className="flex items-center gap-2">
                  <Input type="number" min={0} value={s.settings.fees[svc.id]} onChange={(e) => act((c) => { c.s.settings.fees[svc.id] = Number(e.target.value); audit(c, `Changed fee for ${svc.name}`, 'Settings') })} className="h-9 w-24 text-right" />
                  <span className="w-10 text-xs text-charcoal-soft">CAD</span>
                </span>
              </label>
            ))}
            {num('siteHourlyRate', 'Site visits (per hour delivered)', 'CAD')}
          </div>
        </Card>
        <Card aria-labelledby="pol-h">
          <CardTitle id="pol-h">Policies</CardTitle>
          {num('noShowFeePct', 'No-show fee', '%')}
          {num('lateCancelFeePct', 'Late-cancellation fee', '%')}
          {num('lateCancelHours', 'Late-cancellation window', 'hours')}
          {num('paymentTermsDays', 'Family payment terms', 'days')}
          {num('holdMinutes', 'Waitlist offer hold', 'min')}
          {num('mileageRate', 'Mileage rate', '$/km')}
        </Card>
      </div>

      <Card className="mt-6" aria-labelledby="rooms-h">
        <CardTitle id="rooms-h">Rooms</CardTitle>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map((r) => (
            <li key={r.id} className="rounded-2xl bg-ivory p-4 text-sm">
              <p className="font-semibold text-forest">{r.name}</p>
              <p className="text-charcoal-soft">{r.features}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6" aria-labelledby="rbac-h">
        <CardTitle id="rbac-h">
          <span className="flex items-center gap-2">
            <Lock className="size-5 text-terracotta" aria-hidden /> Role-based access
          </span>
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Which roles can open each area</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal-soft">
                <th scope="col" className="py-2">Area</th>
                {roles.map((r) => (
                  <th key={r} scope="col" className="py-2 text-center">
                    {roleLabels[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(permissions) as Area[]).map((a) => (
                <tr key={a} className="border-t border-forest/5">
                  <th scope="row" className="py-2 text-left font-medium text-charcoal">
                    {areaLabels[a]}
                  </th>
                  {roles.map((r) => (
                    <td key={r} className="py-2 text-center">
                      {permissions[a].includes(r) ? <Check className="mx-auto size-4 text-forest" aria-label="Allowed" /> : <span className="text-charcoal-soft/50" aria-label="Not allowed">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { t: 'Records-ready billing', b: 'Invoices name the treating OT and designation; notes and invoices are checked to match.', tone: 'bg-peach' },
          { t: 'People stay in control', b: 'AI only drafts; therapists approve every note, report and message.', tone: 'bg-butter' },
          { t: 'Privacy by design', b: 'Role-based access, audit trail, Canadian hosting and retention rules in production.', tone: 'bg-lavender' },
          { t: 'Safe demo', b: 'Fictional therapists and children only; no real health data. Everything stays in this browser.', tone: 'bg-sage' },
        ].map((x) => (
          <div key={x.t} className={cn('rounded-3xl p-5', x.tone)}>
            <ShieldCheck className="size-6 text-forest" aria-hidden />
            <p className="mt-3 font-serif text-xl text-forest">{x.t}</p>
            <p className="mt-2 text-sm text-charcoal">{x.b}</p>
          </div>
        ))}
      </div>

      <Card className="mt-6">
        <CardTitle>Reset demo data</CardTitle>
        <p className="text-sm text-charcoal-soft">Restores the fictional caseload, schedule, billing and waitlist, and clears demo bookings made on the public website.</p>
        {confirm ? (
          <div className="mt-3 flex gap-2">
            <Button variant="danger" onClick={() => { demo.resetDemo(); setTimeout(reset, 0); setConfirm(false) }}>
              Yes, reset everything
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button className="mt-3" variant="secondary" onClick={() => setConfirm(true)}>
            <RotateCcw aria-hidden /> Reset demo
          </Button>
        )}
      </Card>
    </>
  )
}

/* ---------- Audit ---------- */

export function AuditPage() {
  return (
    <Guard area="audit">
      <AuditInner />
    </Guard>
  )
}

function AuditInner() {
  const { s } = useStudio()
  const [q, setQ] = useState('')
  const list = s.audit.filter((a) => `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader eyebrow="Trust & compliance" title="Audit trail" intro="Every change is recorded with who did it and when — staff, families and automations alike." />
      <Card>
        <label className="sr-only" htmlFor="audit-q">
          Search audit trail
        </label>
        <Input id="audit-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by person, action or record" className="mb-4 h-10 max-w-sm" />
        <DataTable caption="Audit trail" columns={['When', 'Who', 'Action', 'Record']} rows={list.slice(0, 150).map((a) => [stamp(a.at), a.actor, a.action, a.target])} />
      </Card>
    </>
  )
}

