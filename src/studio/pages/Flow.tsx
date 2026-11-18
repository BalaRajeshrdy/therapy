import { Link } from 'react-router-dom'
import { PhoneCall, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addDaysISO as addDays, formatTime } from '@/utils/time'
import { cn } from '@/lib/utils'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { Card, CardTitle, Empty, PageHeader, Pill, TextLink } from '../ui'
import { childName, familyById, isOverdue, invoiceBalance, therapistName, audit } from '../engine'
import { inMonth, noteTasks } from '../selectors'
import { fullDate, hoursUntil, money, sum, today } from '../util'
import { serviceById } from '../reference'

export default function Flow() {
  return (
    <Guard area="flow">
      <FlowInner />
    </Guard>
  )
}

function FlowInner() {
  const { s, act } = useStudio()
  const t = today()
  const now = Date.now()
  const upcoming7 = s.appointments.filter((a) => a.status === 'scheduled' && a.date >= t && a.date <= addDays(t, 7))
  const flagged = s.appointments.filter((a) => a.flaggedForCall && a.status === 'scheduled' && !a.familyConfirmed)
  const todays = s.appointments.filter((a) => a.date === t && a.status !== 'cancelled').length + s.siteVisits.filter((v) => v.date === t).length
  const activeChildren = s.children.filter((c) => c.familyId && c.status === 'active')
  const needsRebook = activeChildren.filter((c) => !s.appointments.some((a) => a.childId === c.id && a.date >= t && a.status === 'scheduled'))
  const plansOpen = s.plans.filter((p) => p.status === 'offered')
  const outstanding = sum(s.invoices.map(invoiceBalance))
  const overdue = s.invoices.filter((i) => isOverdue(i, t)).length

  const steps = [
    { n: 1, label: 'Enquiry', value: s.enquiries.filter((e) => e.status === 'new').length, note: 'new enquiries', to: '/studio/enquiries', tone: 'sage' },
    { n: 2, label: 'Intake', value: s.forms.filter((f) => f.status === 'requested').length, note: 'forms awaiting family', to: '/studio/enquiries', tone: 'sage' },
    { n: 3, label: 'Book', value: upcoming7.length, note: 'visits next 7 days', to: '/studio/schedule', tone: 'sage' },
    { n: 4, label: 'Remind', value: s.outbox.filter((m) => m.kind === 'reminder' && now - new Date(m.at).getTime() < 48 * 3600_000).length, note: `reminders sent · ${flagged.length} to call`, to: '/studio/automation', tone: 'butter' },
    { n: 5, label: 'Visit', value: todays, note: 'visits today', to: '/studio/visits', tone: 'butter' },
    { n: 6, label: 'Note', value: noteTasks(s).length, note: 'notes to write', to: '/studio/notes', tone: 'butter' },
    { n: 7, label: 'Progress', value: s.ratings.filter((r) => r.date >= addDays(t, -7)).length, note: 'goal ratings this week', to: '/studio/clients', tone: 'peach' },
    { n: 8, label: 'Invoice', value: s.invoices.filter((i) => inMonth(i.issuedOn, t)).length, note: 'invoices this month', to: '/studio/billing', tone: 'peach' },
    { n: 9, label: 'Payment', value: money(outstanding), note: `outstanding · ${overdue} overdue`, to: '/studio/billing', tone: 'peach' },
    { n: 10, label: 'Rebook', value: needsRebook.length + plansOpen.length, note: 'need a next visit or plan', to: '#rebook', tone: 'lavender' },
    { n: 11, label: 'Report', value: s.events.find((e) => e.ruleId === 'month-end') ? '✓' : '—', note: 'month-end report', to: '/studio/report', tone: 'lavender' },
  ] as const
  const toneCls = { sage: 'bg-sage', butter: 'bg-butter', peach: 'bg-peach', lavender: 'bg-lavender' }

  const confirm = (id: string, how: 'confirmed' | 'called') =>
    act((c) => {
      const a = c.s.appointments.find((x) => x.id === id)!
      a.familyConfirmed = how === 'confirmed'
      a.flaggedForCall = how === 'called' ? false : a.flaggedForCall
      if (how === 'confirmed') a.flaggedForCall = false
      audit(c, how === 'confirmed' ? 'Family confirmed visit by phone' : 'Called family — left message', `${childName(c.s, a.childId)} · ${a.date}`)
    })

  return (
    <>
      <PageHeader eyebrow="Front desk" title="One connected flow" intro="Each step triggers the next. Rules automate the routine work; people approve anything clinical or sent to families." />
      <Card className="bg-forest text-ivory" aria-label="Clinic flow">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {steps.map((st) => (
            <li key={st.n}>
              <Link to={st.to} className="group flex h-full flex-col rounded-2xl bg-ivory/5 p-4 ring-1 ring-ivory/10 transition-colors hover:bg-ivory/10">
                <span className="flex items-center gap-2">
                  <span className={cn('grid size-8 place-items-center rounded-full font-serif text-forest', toneCls[st.tone])}>{st.n}</span>
                  <span className="font-semibold">{st.label}</span>
                </span>
                <span className="mt-3 font-serif text-3xl">{st.value}</span>
                <span className="mt-1 text-xs text-ivory/75">{st.note}</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-sm italic text-butter">Automated by rules · AI drafts where it saves time · A person approves anything clinical or sent to families</p>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card aria-labelledby="calls-h">
          <CardTitle id="calls-h">
            <span className="flex items-center gap-2">
              <PhoneCall className="size-5 text-terracotta" aria-hidden /> Unconfirmed visits to call
            </span>
          </CardTitle>
          {flagged.length ? (
            <ul className="space-y-3">
              {flagged.map((a) => {
                const fam = familyById(s, a.familyId)
                return (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ivory p-4">
                    <div>
                      <p className="font-semibold text-forest">{childName(s, a.childId)}</p>
                      <p className="text-sm text-charcoal-soft">
                        {fullDate(a.date)} · {formatTime(a.start)} · {therapistName(a.therapistId)} · in {Math.max(0, Math.round(hoursUntil(a.date, a.start)))} h
                      </p>
                      <p className="text-sm text-charcoal-soft">
                        {fam?.guardians[0].name} · {fam?.guardians[0].phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="soft" onClick={() => confirm(a.id, 'called')}>
                        Left message
                      </Button>
                      <Button size="sm" onClick={() => confirm(a.id, 'confirmed')}>
                        <CheckCircle2 aria-hidden /> Confirmed
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Empty icon={CheckCircle2}>Every visit in the next 24 hours is confirmed.</Empty>
          )}
        </Card>

        <Card aria-labelledby="rebook-h">
          <CardTitle id="rebook-h">
            <span id="rebook">Rebook &amp; treatment plans</span>
          </CardTitle>
          <ul className="space-y-3">
            {plansOpen.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-lavender/60 p-4">
                <div>
                  <p className="font-semibold text-forest">{childName(s, p.childId)}</p>
                  <p className="text-sm text-charcoal-soft">
                    Plan offered: {p.weeks} × {serviceById(p.serviceId)?.shortName} — waiting for the family to pick a weekly time
                  </p>
                </div>
                <TextLink to={`/studio/children/${p.childId}`}>Open plan</TextLink>
              </li>
            ))}
            {needsRebook.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ivory p-4">
                <div>
                  <p className="font-semibold text-forest">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-sm text-charcoal-soft">No upcoming visit · {therapistName(c.therapistId)}</p>
                </div>
                <Link to={`/studio/schedule?child=${c.id}`} className="flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
                  Book next visit <ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
            {!plansOpen.length && !needsRebook.length && <Empty>Every active child has a next visit booked.</Empty>}
          </ul>
          <p className="mt-4 text-xs text-charcoal-soft">
            <Pill tone="lavender">Tip</Pill> Complete Leo Tran’s extended assessment in <TextLink to="/studio/visits">Today’s visits</TextLink> to see a treatment plan offered automatically.
          </p>
        </Card>
      </div>
    </>
  )
}
