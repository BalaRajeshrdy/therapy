import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarClock, CheckCircle2, FileText, Hospital, Plus, School, Baby, Users, Mail, Phone, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { therapists, fullName } from '@/data/therapists'
import { formatTime } from '@/utils/time'
import { cn } from '@/lib/utils'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { Card, CardTitle, DataTable, Empty, PageHeader, Pill, PrintButton, Row, TextLink } from '../ui'
import { audit, invoiceBalance, siteVisitDates, therapistName, event } from '../engine'
import { fullDate, money, shortDate, sid, sum, today, clockOf } from '../util'
import type { AttendanceStatus, Site, SiteType } from '../types'
import { addDaysISO } from '@/utils/time'
import { DocHeader } from './Documents'

const typeIcon: Record<SiteType, typeof School> = { School, Hospital, Daycare: Baby, Agency: Users }
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Sites() {
  return (
    <Guard area="sites">
      <SitesInner />
    </Guard>
  )
}

function SitesInner() {
  const { s, viewer } = useStudio()
  const [open, setOpen] = useState(false)
  const t = today()
  const list = viewer.role === 'therapist' ? s.sites.filter((x) => x.recurrence.therapistId === viewer.therapistId) : s.sites
  return (
    <>
      <PageHeader
        eyebrow="Module 2 · School, hospital & daycare visits"
        title="Group visits with per-child attendance"
        intro="A registry of schools, hospitals, daycares and agencies with contacts and billing details, recurring site visits on the therapist calendar, attendance and minutes per child, and term reports and site invoices."
        actions={
          viewer.role !== 'therapist' && (
            <Button onClick={() => setOpen(true)}>
              <Plus aria-hidden /> Add site
            </Button>
          )
        }
      />
      <div className="grid gap-5 md:grid-cols-2">
        {list.map((site) => {
          const Icon = typeIcon[site.type]
          const next = s.siteVisits.filter((v) => v.siteId === site.id && v.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0]
          const owed = sum(s.invoices.filter((i) => i.billTo.kind === 'site' && i.billTo.id === site.id).map(invoiceBalance))
          return (
            <Card key={site.id} as="article" aria-label={site.name}>
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lavender text-forest">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/studio/sites/${site.id}`} className="font-serif text-xl text-forest hover:underline">
                    {site.name}
                  </Link>
                  <p className="text-sm text-charcoal-soft">
                    {site.type} · {site.childIds.length} children · {therapistName(site.recurrence.therapistId)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="lavender" icon={CalendarClock}>
                      {site.recurrence.label} · {formatTime(site.recurrence.start)}–{formatTime(site.recurrence.end)}
                    </Pill>
                    {next && <Pill tone="sage">Next: {shortDate(next.date)}</Pill>}
                    {owed > 0 && <Pill tone="peach">{money(owed)} outstanding</Pill>}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <AddSiteDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function AddSiteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { act } = useStudio()
  const [f, setF] = useState({ name: '', type: 'School' as SiteType, contact: '', email: '', phone: '', billingEmail: '', weekday: 2, start: '09:00', end: '11:00', therapistId: therapists[0].id, terms: 30 })
  const [err, setErr] = useState('')
  const save = () => {
    if (f.name.trim().length < 3 || !f.contact.trim() || !f.email.includes('@')) return setErr('Please add a site name, contact name and contact email.')
    act((c) => {
      const site: Site = {
        id: sid('site'),
        name: f.name.trim(),
        type: f.type,
        address: 'Mississauga, ON',
        contact: { name: f.contact, role: 'Site contact', email: f.email, phone: f.phone },
        billingEmail: f.billingEmail || f.email,
        billingTermsDays: f.terms,
        recurrence: { weekday: f.weekday, start: f.start, end: f.end, therapistId: f.therapistId, label: `Every ${WEEKDAYS[f.weekday]}` },
        childIds: [],
      }
      c.s.sites.push(site)
      for (const date of siteVisitDates(f.weekday, today(), addDaysISO(today(), 56))) {
        c.s.siteVisits.push({ id: sid('sv'), siteId: site.id, therapistId: f.therapistId, date, start: f.start, end: f.end, status: 'scheduled', attendance: [] })
      }
      audit(c, 'Added site and recurring visits', site.name)
    })
    onOpenChange(false)
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: ['weekday', 'terms'].includes(k) ? Number(e.target.value) : e.target.value })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add a site" description="Schools, hospitals, daycares and agencies. Recurring visits are added to the therapist’s calendar for the next 8 weeks.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name" className="sm:col-span-2">{(p) => <Input {...p} value={f.name} onChange={set('name')} />}</Field>
          <Field label="Type">
            {(p) => (
              <Select {...p} value={f.type} onChange={set('type')}>
                {(['School', 'Hospital', 'Daycare', 'Agency'] as SiteType[]).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Therapist">
            {(p) => (
              <Select {...p} value={f.therapistId} onChange={set('therapistId')}>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {fullName(t)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Contact name">{(p) => <Input {...p} value={f.contact} onChange={set('contact')} />}</Field>
          <Field label="Contact email">{(p) => <Input {...p} type="email" value={f.email} onChange={set('email')} />}</Field>
          <Field label="Billing email" optional>{(p) => <Input {...p} type="email" value={f.billingEmail} onChange={set('billingEmail')} />}</Field>
          <Field label="Payment terms (days)">{(p) => <Input {...p} type="number" min={0} value={f.terms} onChange={set('terms')} />}</Field>
          <Field label="Visit day">
            {(p) => (
              <Select {...p} value={f.weekday} onChange={set('weekday')}>
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">{(p) => <Input {...p} type="time" value={f.start} onChange={set('start')} />}</Field>
            <Field label="End">{(p) => <Input {...p} type="time" value={f.end} onChange={set('end')} />}</Field>
          </div>
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-terracotta">{err}</p>}
        <Button className="mt-5 w-full" onClick={save}>
          Save site
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export function SiteDetail() {
  return (
    <Guard area="sites">
      <SiteDetailInner />
    </Guard>
  )
}

function SiteDetailInner() {
  const { id } = useParams()
  const { s, act, viewer } = useStudio()
  const [newKid, setNewKid] = useState('')
  const site = s.sites.find((x) => x.id === id)
  if (!site) return <Empty>Site not found.</Empty>
  const t = today()
  const visits = s.siteVisits.filter((v) => v.siteId === site.id).sort((a, b) => b.date.localeCompare(a.date))
  const kids = site.childIds.map((cid) => s.children.find((c) => c.id === cid)!).filter(Boolean)
  const invoices = s.invoices.filter((i) => i.billTo.kind === 'site' && i.billTo.id === site.id)
  const addKid = () => {
    const [first, ...rest] = newKid.trim().split(' ')
    if (!first) return
    act((c) => {
      const ch = { id: sid('ch'), siteId: site.id, firstName: first, lastName: rest.join(' ') || '—', dob: '2018-01-01', therapistId: site.recurrence.therapistId, status: 'active' as const }
      c.s.children.push(ch)
      c.s.sites.find((x) => x.id === site.id)!.childIds.push(ch.id)
      c.s.siteVisits.filter((v) => v.siteId === site.id && v.status === 'scheduled').forEach((v) => v.attendance.push({ childId: ch.id, status: 'pending', minutes: 0 }))
      audit(c, 'Added child to site roster', `${first} · ${site.name}`)
    })
    setNewKid('')
  }
  return (
    <>
      <PageHeader
        eyebrow={`${site.type} · ${site.recurrence.label}`}
        title={site.name}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link to={`/studio/sites/${site.id}/report`}>
                <FileText aria-hidden /> Term report
              </Link>
            </Button>
            {viewer.role !== 'therapist' && (
              <Button asChild variant="secondary" size="sm">
                <Link to="/studio/billing?tab=batch">Site invoices</Link>
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card aria-labelledby="contact-h">
            <CardTitle id="contact-h">Contacts &amp; billing</CardTitle>
            <dl>
              <Row k="Address" v={site.address} />
              <Row k="Contact" v={`${site.contact.name} · ${site.contact.role}`} />
              <Row k={<Mail className="size-4" aria-label="Email" />} v={site.contact.email} />
              <Row k={<Phone className="size-4" aria-label="Phone" />} v={site.contact.phone} />
              <Row k="Billing email" v={site.billingEmail} />
              <Row k="Payment terms" v={`${site.billingTermsDays} days`} />
              <Row k="Rate" v={`${money(s.settings.siteHourlyRate)} / hour delivered (demo)`} />
              <Row k="Therapist" v={therapistName(site.recurrence.therapistId)} />
            </dl>
          </Card>
          <Card aria-labelledby="roster-h">
            <CardTitle id="roster-h">Roster ({kids.length})</CardTitle>
            <ul className="divide-y divide-forest/5">
              {kids.map((k) => {
                const recs = s.siteVisits.filter((v) => v.siteId === site.id && v.status === 'completed').flatMap((v) => v.attendance.filter((a) => a.childId === k.id))
                return (
                  <li key={k.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      <b className="text-forest">
                        {k.firstName} {k.lastName}
                      </b>{' '}
                      <span className="text-charcoal-soft">{k.grade}</span>
                    </span>
                    <span className="text-charcoal-soft">
                      {recs.filter((r) => r.status === 'present').length}/{recs.length} present · {sum(recs.map((r) => r.minutes))} min
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor="new-kid">
                Add child to roster
              </label>
              <Input id="new-kid" placeholder="Add child (first last)" value={newKid} onChange={(e) => setNewKid(e.target.value)} className="h-10" />
              <Button size="sm" onClick={addKid}>
                Add
              </Button>
            </div>
          </Card>
          {viewer.role !== 'therapist' && (
            <Card aria-labelledby="sinv-h">
              <CardTitle id="sinv-h">Site invoices</CardTitle>
              {invoices.length ? (
                <ul className="space-y-2">
                  {invoices.map((i) => (
                    <li key={i.id} className="flex items-center justify-between text-sm">
                      <TextLink to={`/studio/invoices/${i.id}`}>{i.number}</TextLink>
                      <span>{money(i.total)}</span>
                      <Pill tone={invoiceBalance(i) > 0 ? (i.dueOn < t ? 'alert' : 'butter') : 'sage'}>{invoiceBalance(i) > 0 ? (i.dueOn < t ? 'Overdue' : 'Due ' + shortDate(i.dueOn)) : 'Paid'}</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No invoices yet — run a batch from Billing.</Empty>
              )}
            </Card>
          )}
        </div>
        <Card aria-labelledby="visits-h">
          <CardTitle id="visits-h">Recurring visits</CardTitle>
          <ul className="space-y-2">
            {visits.slice(0, 14).map((v) => {
              const present = v.attendance.filter((a) => a.status === 'present').length
              return (
                <li key={v.id}>
                  <Link to={`/studio/site-visits/${v.id}`} className={cn('flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3 text-sm ring-1 ring-forest/10 hover:ring-forest/30', v.date === t ? 'bg-butter/60' : 'bg-ivory')}>
                    <span className="font-semibold text-forest">
                      {fullDate(v.date)} {v.date === t && '· Today'}
                    </span>
                    {v.status === 'completed' ? (
                      <span className="text-charcoal-soft">
                        {present}/{v.attendance.length} present · {sum(v.attendance.map((a) => a.minutes))} min {v.invoiceId && '· invoiced'}
                      </span>
                    ) : (
                      <Pill tone="lavender">{v.date <= t ? 'Take attendance' : 'Scheduled'}</Pill>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </>
  )
}

/* ---------- Attendance ---------- */

export function SiteVisitPage() {
  return (
    <Guard area="sites">
      <SiteVisitInner />
    </Guard>
  )
}

const statusOpts: { id: AttendanceStatus; label: string; cls: string }[] = [
  { id: 'present', label: 'Present', cls: 'bg-sage text-forest-dark' },
  { id: 'absent', label: 'Absent', cls: 'bg-peach text-[#8a3f27]' },
  { id: 'excused', label: 'Excused', cls: 'bg-lavender text-forest' },
]

function SiteVisitInner() {
  const { id } = useParams()
  const { s, act } = useStudio()
  const visit = s.siteVisits.find((v) => v.id === id)
  const site = s.sites.find((x) => x.id === visit?.siteId)
  const [saved, setSaved] = useState(false)
  if (!visit || !site) return <Empty>Visit not found.</Empty>
  const rows = site.childIds.map((cid) => visit.attendance.find((a) => a.childId === cid) ?? { childId: cid, status: 'pending' as AttendanceStatus, minutes: 0 })
  const update = (childId: string, patch: Partial<{ status: AttendanceStatus; minutes: number }>) =>
    act((c) => {
      const v = c.s.siteVisits.find((x) => x.id === visit.id)!
      let rec = v.attendance.find((a) => a.childId === childId)
      if (!rec) {
        rec = { childId, status: 'pending', minutes: 0 }
        v.attendance.push(rec)
      }
      Object.assign(rec, patch)
      if (patch.status && patch.status !== 'present') rec.minutes = 0
      if (patch.status === 'present' && !rec.minutes) rec.minutes = 30
    })
  const complete = () => {
    act((c) => {
      const v = c.s.siteVisits.find((x) => x.id === visit.id)!
      v.attendance.forEach((a) => a.status === 'pending' && (a.status = 'absent'))
      v.status = 'completed'
      v.checkOut = new Date().toISOString()
      v.checkIn ??= v.checkOut
      audit(c, 'Completed site visit attendance', `${site.name} · ${v.date}`)
      event(c, 'visit-completed', `Site visit completed · ${site.name}`, `${v.attendance.filter((a) => a.status === 'present').length} present · ${sum(v.attendance.map((a) => a.minutes))} min — added to the site’s next batch invoice`, `/studio/site-visits/${v.id}`)
    })
    setSaved(true)
  }
  const pending = rows.filter((r) => r.status === 'pending').length
  return (
    <>
      <PageHeader eyebrow={site.name} title={`${fullDate(visit.date)} · ${formatTime(visit.start)}–${formatTime(visit.end)}`} intro={`${therapistName(visit.therapistId)} · mark each child present, absent or excused, with minutes delivered.`} actions={<TextLink to={`/studio/sites/${site.id}`}>Back to site</TextLink>} />
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {visit.status === 'scheduled' && !visit.checkIn && (
            <Button size="sm" variant="secondary" onClick={() => act((c) => { const v = c.s.siteVisits.find((x) => x.id === visit.id)!; v.checkIn = new Date().toISOString(); audit(c, 'Checked in at site', site.name) })}>
              <LogIn aria-hidden /> Check in at site
            </Button>
          )}
          {visit.checkIn && <Pill tone="butter">Checked in {clockOf(visit.checkIn)}</Pill>}
          {visit.checkOut && visit.status === 'completed' && <Pill>Completed {clockOf(visit.checkOut)}</Pill>}
          {visit.invoiceId && <Pill tone="lavender">Invoiced</Pill>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Attendance</caption>
            <thead className="text-left text-xs uppercase tracking-wider text-charcoal-soft">
              <tr>
                <th scope="col" className="py-2">Child</th>
                <th scope="col" className="py-2">Status</th>
                <th scope="col" className="py-2 text-right">Minutes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ch = s.children.find((c) => c.id === r.childId)!
                return (
                  <tr key={r.childId} className="border-t border-forest/5">
                    <th scope="row" className="py-3 text-left font-semibold text-charcoal">
                      {ch.firstName} {ch.lastName.charAt(0)}.
                    </th>
                    <td className="py-3">
                      <div role="radiogroup" aria-label={`Attendance for ${ch.firstName}`} className="flex gap-1.5">
                        {statusOpts.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            role="radio"
                            aria-checked={r.status === o.id}
                            disabled={visit.status === 'completed' && !!visit.invoiceId}
                            onClick={() => update(r.childId, { status: o.id })}
                            className={cn('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-forest/10 transition-colors', r.status === o.id ? o.cls : 'bg-white text-charcoal-soft hover:bg-ivory')}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <label className="sr-only" htmlFor={`min-${r.childId}`}>
                        Minutes for {ch.firstName}
                      </label>
                      <select id={`min-${r.childId}`} value={r.minutes} disabled={r.status !== 'present' || !!visit.invoiceId} onChange={(e) => update(r.childId, { minutes: Number(e.target.value) })} className="h-9 rounded-full border border-forest/15 bg-white px-3 text-sm disabled:opacity-50">
                        {[0, 15, 20, 30, 45, 60].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-charcoal-soft">
            {rows.filter((r) => r.status === 'present').length} present · {sum(rows.map((r) => r.minutes))} minutes delivered{pending ? ` · ${pending} not marked` : ''}
          </p>
          {visit.status !== 'completed' ? (
            <Button onClick={complete}>
              <CheckCircle2 aria-hidden /> Complete visit
            </Button>
          ) : (
            <p role="status" className="flex items-center gap-1.5 text-sm font-semibold text-forest">
              <CheckCircle2 className="size-4" aria-hidden /> {saved ? 'Saved — ready for the site’s invoice.' : 'Visit completed.'}
            </p>
          )}
        </div>
      </Card>
    </>
  )
}

/* ---------- Term report ---------- */

export function TermReport() {
  return (
    <Guard area="sites">
      <TermReportInner />
    </Guard>
  )
}

function TermReportInner() {
  const { id } = useParams()
  const { s } = useStudio()
  const site = s.sites.find((x) => x.id === id)
  if (!site) return <Empty>Site not found.</Empty>
  const visits = s.siteVisits.filter((v) => v.siteId === site.id && v.status === 'completed').sort((a, b) => a.date.localeCompare(b.date))
  const from = visits[0]?.date
  const to = visits[visits.length - 1]?.date
  return (
    <>
      <PageHeader eyebrow="Term report" title={site.name} actions={<PrintButton />} />
      <Card className="print-card mx-auto max-w-4xl">
        <DocHeader title="Attendance & service report" subtitle={from ? `${fullDate(from)} – ${fullDate(to!)}` : ''} />
        <dl className="mb-6 grid gap-x-8 sm:grid-cols-2">
          <Row k="Site" v={site.name} />
          <Row k="Therapist" v={therapistName(site.recurrence.therapistId)} />
          <Row k="Schedule" v={`${site.recurrence.label}, ${formatTime(site.recurrence.start)}–${formatTime(site.recurrence.end)}`} />
          <Row k="Visits delivered" v={visits.length} />
        </dl>
        <DataTable
          caption="Attendance by child"
          columns={['Child', 'Present', 'Absent', 'Excused', 'Minutes']}
          rows={site.childIds.map((cid) => {
            const ch = s.children.find((c) => c.id === cid)!
            const recs = visits.flatMap((v) => v.attendance.filter((a) => a.childId === cid))
            return [`${ch.firstName} ${ch.lastName}`, recs.filter((r) => r.status === 'present').length, recs.filter((r) => r.status === 'absent').length, recs.filter((r) => r.status === 'excused').length, sum(recs.map((r) => r.minutes))]
          })}
        />
        <p className="mt-6 text-sm text-charcoal-soft">
          Total minutes delivered: <b className="text-charcoal">{sum(visits.flatMap((v) => v.attendance.map((a) => a.minutes)))}</b>. Prepared by Treatment Studio for {site.contact.name}. Fictional demo data.
        </p>
      </Card>
    </>
  )
}

