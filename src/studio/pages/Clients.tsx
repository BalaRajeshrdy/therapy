import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { differenceInYears, parseISO } from 'date-fns'
import { AlertTriangle, CheckCircle2, FileText, Languages, Package, Plus, Search, Send, Star, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { formatTime } from '@/utils/time'
import { cn } from '@/lib/utils'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { Card, CardTitle, DataTable, Empty, LineChart, Notice, PageHeader, Pill, StatusPill, TextLink } from '../ui'
import { acceptPlan, audit, childName, familyById, homeProgramMessage, issueInvoice, noShowCount, therapistName } from '../engine'
import { familyBalance, familyInvoices } from '../selectors'
import { activityLibrary, activityTitle } from '../messages'
import { domains, languages, seriesColors, serviceById } from '../reference'
import { addDaysISO } from '@/utils/time'
import { fullDate, money, round2, shortDate, sid, today } from '../util'
import type { Domain } from '../types'

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Clients() {
  return (
    <Guard area="clients">
      <ClientsInner />
    </Guard>
  )
}

function ClientsInner() {
  const { s, viewer } = useStudio()
  const [q, setQ] = useState('')
  const t = today()
  const fams = s.families.filter((f) => {
    const kids = s.children.filter((c) => c.familyId === f.id)
    if (viewer.role === 'therapist' && !kids.some((k) => k.therapistId === viewer.therapistId)) return false
    const hay = `${f.name} ${f.guardians.map((g) => g.name).join(' ')} ${kids.map((k) => k.firstName).join(' ')}`.toLowerCase()
    return hay.includes(q.toLowerCase())
  })
  return (
    <>
      <PageHeader eyebrow="Families" title={viewer.role === 'therapist' ? 'My caseload' : 'Families & children'} intro="Family profiles with several children, preferred language, billing preference, forms and balances." />
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-charcoal-soft" aria-hidden />
        <label className="sr-only" htmlFor="fam-search">
          Search families
        </label>
        <Input id="fam-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by family, parent or child" className="pl-10" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {fams.map((f) => {
          const kids = s.children.filter((c) => c.familyId === f.id)
          const bal = familyBalance(s, f.id)
          const flags = noShowCount(s, f.id, t)
          const pendingForms = s.forms.filter((x) => x.familyId === f.id && x.status === 'requested').length
          return (
            <Card key={f.id} as="article" aria-label={`${f.name} family`}>
              <Link to={`/studio/clients/${f.id}`} className="font-serif text-xl text-forest hover:underline">
                {f.name} family
              </Link>
              <p className="text-sm text-charcoal-soft">{f.guardians.map((g) => g.name).join(' & ')}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {kids.map((k) => (
                  <li key={k.id}>
                    <Link to={`/studio/children/${k.id}`} className="inline-flex items-center gap-1 rounded-full bg-sage-light px-3 py-1 text-sm font-semibold text-forest hover:bg-sage/60">
                      {k.firstName} · {differenceInYears(parseISO(t), parseISO(k.dob))}y
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="ivory" icon={Languages}>
                  {languages[f.language].label}
                </Pill>
                {f.billing === 'monthly' && <Pill tone="lavender">Monthly billing</Pill>}
                {bal > 0 && <Pill tone="peach">{money(bal)} due</Pill>}
                {flags >= 2 && (
                  <Pill tone="alert" icon={AlertTriangle}>
                    No-show flag
                  </Pill>
                )}
                {pendingForms > 0 && <Pill tone="butter">{pendingForms} form{pendingForms > 1 ? 's' : ''} pending</Pill>}
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}

/* ---------- Family profile ---------- */

export function FamilyDetail() {
  return (
    <Guard area="clients">
      <FamilyDetailInner />
    </Guard>
  )
}

function FamilyDetailInner() {
  const { id } = useParams()
  const { s, act, viewer } = useStudio()
  const f = familyById(s, id)
  if (!f) return <Empty>Family not found.</Empty>
  const t = today()
  const kids = s.children.filter((c) => c.familyId === f.id)
  const appts = s.appointments.filter((a) => a.familyId === f.id)
  const upcoming = appts.filter((a) => a.date >= t && a.status === 'scheduled').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const recent = appts.filter((a) => a.date < t).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  const invs = familyInvoices(s, f.id).sort((a, b) => b.issuedOn.localeCompare(a.issuedOn))
  const flags = noShowCount(s, f.id, t)
  const staffBilling = viewer.role !== 'therapist'
  const pkgs = s.packages.filter((p) => p.familyId === f.id)
  const sellPackage = () =>
    act((c) => {
      const fee = c.s.settings.fees['ot-session-clinic']
      const amount = round2(fee * 10 * 0.9)
      const pkg = { id: sid('pkg'), familyId: f.id, name: '10-session package', sessions: 10, used: 0, purchasedOn: today() }
      c.s.packages.push(pkg)
      const inv = issueInvoice(c, { kind: 'family', id: f.id }, [{ id: sid('ln'), description: '10-session package (10% package discount)', date: today(), qty: 1, unitPrice: amount, amount }], 'per-visit')
      c.s.packages[c.s.packages.length - 1].invoiceId = inv.id
      audit(c, 'Sold 10-session package', `${f.name} family · ${inv.number}`)
    })
  return (
    <>
      <PageHeader
        eyebrow="Family profile"
        title={`${f.name} family`}
        intro={`${f.address}, ${f.city} · since ${shortDate(f.createdAt.slice(0, 10))} · source: ${f.source}`}
        actions={
          staffBilling && (
            <Button asChild variant="secondary" size="sm">
              <Link to={`/studio/statements/${f.id}`}>
                <FileText aria-hidden /> Statement
              </Link>
            </Button>
          )
        }
      />
      {flags >= 2 && (
        <div className="mb-5">
          <Notice tone="peach" icon={AlertTriangle}>
            <b>No-show flag:</b> {flags} missed or late-cancelled visits in the last 90 days. Consider a reminder call before each visit.
          </Notice>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card aria-labelledby="g-h">
          <CardTitle id="g-h">Guardians &amp; preferences</CardTitle>
          {f.guardians.map((g) => (
            <div key={g.email} className="mb-3 rounded-2xl bg-ivory p-3 text-sm">
              <p className="font-semibold text-forest">
                {g.name} <span className="font-normal text-charcoal-soft">· {g.relationship}</span>
              </p>
              <p className="text-charcoal-soft">
                {g.email} · {g.phone}
              </p>
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Field label="Family language" hint="Reminders, invoices and home programs are sent in this language">
              {(p) => (
                <Select {...p} value={f.language} onChange={(e) => act((c) => { familyById(c.s, f.id)!.language = e.target.value as typeof f.language; audit(c, `Set family language to ${languages[e.target.value as typeof f.language].label}`, `${f.name} family`) })}>
                  {Object.entries(languages).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} — {v.native}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {staffBilling && (
              <Field label="Billing">
                {(p) => (
                  <Select {...p} value={f.billing} onChange={(e) => act((c) => { familyById(c.s, f.id)!.billing = e.target.value as 'per-visit' | 'monthly'; audit(c, `Billing set to ${e.target.value}`, `${f.name} family`) })}>
                    <option value="per-visit">Invoice after every visit</option>
                    <option value="monthly">Monthly batch invoice</option>
                  </Select>
                )}
              </Field>
            )}
          </div>
        </Card>

        <Card aria-labelledby="k-h">
          <CardTitle id="k-h">Children</CardTitle>
          <ul className="space-y-3">
            {kids.map((k) => (
              <li key={k.id}>
                <Link to={`/studio/children/${k.id}`} className="block rounded-2xl bg-sage-light/60 p-4 hover:bg-sage-light">
                  <p className="font-semibold text-forest">
                    {k.firstName} {k.lastName}
                  </p>
                  <p className="text-sm text-charcoal-soft">
                    {differenceInYears(parseISO(t), parseISO(k.dob))} years · {k.grade} · {therapistName(k.therapistId)}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-sage-dark">{k.status === 'assessment' ? 'Assessment stage' : 'In therapy'}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card aria-labelledby="fm-h">
          <CardTitle id="fm-h">Forms &amp; consent</CardTitle>
          <ul className="space-y-2 text-sm">
            {s.forms
              .filter((x) => x.familyId === f.id)
              .map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-2 rounded-2xl bg-ivory p-3">
                  <span className="font-semibold capitalize text-forest">{x.kind} form</span>
                  {x.status === 'completed' ? (
                    <Pill icon={CheckCircle2}>Signed {x.signature ? `by ${x.signature.name.split(' ')[0]}` : ''}</Pill>
                  ) : (
                    <Pill tone="butter">Awaiting family</Pill>
                  )}
                </li>
              ))}
          </ul>
          {staffBilling && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-forest">Packages</p>
              {pkgs.map((p) => (
                <div key={p.id} className="mb-2 rounded-2xl bg-lavender/60 p-3 text-sm">
                  <p className="flex items-center gap-1.5 font-semibold text-forest">
                    <Package className="size-4" aria-hidden /> {p.name}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={p.sessions} aria-valuenow={p.used} aria-label={`${p.used} of ${p.sessions} sessions used`}>
                    <div className="h-full rounded-full bg-forest" style={{ width: `${(p.used / p.sessions) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-charcoal-soft">
                    {p.used} of {p.sessions} used · bought {shortDate(p.purchasedOn)}
                  </p>
                </div>
              ))}
              <Button size="sm" variant="soft" onClick={sellPackage}>
                <Plus aria-hidden /> Sell 10-session package
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card aria-labelledby="ua-h">
          <CardTitle id="ua-h">Upcoming visits</CardTitle>
          {upcoming.length ? (
            <DataTable columns={['Date', 'Child', 'Service', 'Status']} rows={upcoming.slice(0, 8).map((a) => [`${shortDate(a.date)} · ${formatTime(a.start)}`, childName(s, a.childId), serviceById(a.serviceId)?.shortName, <StatusPill key={a.id} status={a.status} />])} />
          ) : (
            <Empty>No upcoming visits.</Empty>
          )}
          <h3 className="mb-3 mt-6 font-sans font-bold text-forest">Recent visits</h3>
          <DataTable columns={['Date', 'Child', 'Outcome']} rows={recent.map((a) => [shortDate(a.date), childName(s, a.childId), <StatusPill key={a.id} status={a.status} />])} />
        </Card>
        {staffBilling ? (
          <Card aria-labelledby="inv-h">
            <CardTitle id="inv-h" action={<span className="text-sm font-semibold text-forest">Balance {money(familyBalance(s, f.id))}</span>}>
              Invoices
            </CardTitle>
            <DataTable columns={['Invoice', 'Issued', 'Total', 'Balance']} rows={invs.slice(0, 10).map((i) => [<TextLink key={i.id} to={`/studio/invoices/${i.id}`}>{i.number}</TextLink>, shortDate(i.issuedOn), money(i.total), money(i.total - i.payments.reduce((n, p) => n + p.amount, 0))])} />
          </Card>
        ) : (
          <Card>
            <Empty>Billing is visible to the owner and front desk.</Empty>
          </Card>
        )}
      </div>
    </>
  )
}

/* ---------- Child profile: goals, ratings, home program ---------- */

export function ChildDetail() {
  return (
    <Guard area="clients">
      <ChildDetailInner />
    </Guard>
  )
}

function ChildDetailInner() {
  const { id } = useParams()
  const { s, act, viewer } = useStudio()
  const ch = s.children.find((c) => c.id === id)
  const [newGoal, setNewGoal] = useState({ domain: 'Fine motor' as Domain, title: '', target: '' })
  const [scores, setScores] = useState<Record<string, number>>({})
  const [rated, setRated] = useState(false)
  const [addAct, setAddAct] = useState('')
  const [sent, setSent] = useState(false)
  if (!ch) return <Empty>Child not found.</Empty>
  const t = today()
  const fam = familyById(s, ch.familyId)
  const goals = s.goals.filter((g) => g.childId === ch.id)
  const dates = [...new Set(s.ratings.filter((r) => goals.some((g) => g.id === r.goalId)).map((r) => r.date))].sort()
  const plan = s.plans.find((p) => p.childId === ch.id && p.status === 'offered')
  const acceptedPlan = s.plans.find((p) => p.childId === ch.id && p.status === 'accepted')
  const acts = s.homeActivities.filter((h) => h.childId === ch.id)
  const notes = s.notes.filter((n) => n.childId === ch.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const lastSession = s.appointments.filter((a) => a.childId === ch.id && a.status === 'completed').sort((a, b) => b.date.localeCompare(a.date))[0]
  const canClinical = viewer.role === 'owner' || viewer.role === 'therapist'
  const ratedToday = lastSession && s.ratings.some((r) => r.appointmentId === lastSession.id)
  const last7 = Array.from({ length: 7 }, (_, i) => addDaysISO(t, i - 6))

  const saveRatings = () => {
    if (!lastSession) return
    act((c) => {
      for (const g of goals) {
        const v = scores[g.id]
        if (!v) continue
        c.s.ratings = c.s.ratings.filter((r) => !(r.goalId === g.id && r.appointmentId === lastSession.id))
        c.s.ratings.push({ id: sid('r'), goalId: g.id, date: lastSession.date, score: v, appointmentId: lastSession.id })
      }
      audit(c, 'Rated goals for session', `${ch.firstName} · ${lastSession.date}`)
    })
    setRated(true)
  }
  const addGoal = () => {
    if (newGoal.title.trim().length < 3) return
    act((c) => {
      c.s.goals.push({ id: sid('g'), childId: ch.id, domain: newGoal.domain, title: newGoal.title.trim(), target: newGoal.target.trim() || newGoal.title.trim(), createdAt: today(), status: 'active' })
      audit(c, 'Added goal', `${ch.firstName}: ${newGoal.title}`)
    })
    setNewGoal({ domain: 'Fine motor', title: '', target: '' })
  }

  return (
    <>
      <PageHeader
        eyebrow={`Module 3 · Goals & progress · ${fam ? `${fam.name} family` : s.sites.find((x) => x.id === ch.siteId)?.name ?? ''}`}
        title={`${ch.firstName} ${ch.lastName}`}
        intro={`${differenceInYears(parseISO(t), parseISO(ch.dob))} years · ${ch.grade ?? ''} · ${therapistName(ch.therapistId)}`}
        actions={
          canClinical && (
            <>
              <Button asChild size="sm" variant="secondary">
                <Link to={`/studio/children/${ch.id}/report?audience=parent`}>
                  <FileText aria-hidden /> Parent report
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to={`/studio/children/${ch.id}/report?audience=school`}>
                  <FileText aria-hidden /> School report
                </Link>
              </Button>
            </>
          )
        }
      />

      {plan && (
        <Card className="mb-6 bg-lavender/60" aria-labelledby="plan-h">
          <CardTitle id="plan-h">Treatment plan offered</CardTitle>
          <p className="text-sm text-charcoal">
            {plan.weeks} weekly {serviceById(plan.serviceId)?.name} sessions with {therapistName(plan.therapistId)}. The family can choose a time in their portal, or book one here on their behalf:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.options.map((o) => (
              <Button key={`${o.weekday}${o.start}`} size="sm" onClick={() => act((c) => acceptPlan(c, plan.id, o))}>
                Every {WD[o.weekday]} at {formatTime(o.start)}
              </Button>
            ))}
          </div>
        </Card>
      )}
      {acceptedPlan && (
        <div className="mb-6">
          <Notice tone="sage" icon={CheckCircle2}>
            Plan accepted: every {WD[acceptedPlan.accepted!.weekday]} at {formatTime(acceptedPlan.accepted!.start)} for {acceptedPlan.weeks} weeks — booked as a recurring series.
          </Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card aria-labelledby="goals-h">
          <CardTitle id="goals-h">
            <span className="flex items-center gap-2">
              <Target className="size-5 text-terracotta" aria-hidden /> Goals by domain
            </span>
          </CardTitle>
          {dates.length > 1 ? (
            <LineChart title={`Goal ratings by session (1–5) · ${ch.firstName}`} labels={dates.map((_, i) => `S${i + 1}`)} series={goals.map((g, i) => ({ name: `${g.domain}: ${g.title.toLowerCase()}`, color: seriesColors[i % 4], values: dates.map((d) => s.ratings.find((r) => r.goalId === g.id && r.date === d)?.score ?? null) }))} />
          ) : (
            <Empty>Ratings will chart here after a few sessions.</Empty>
          )}
          <ul className="mt-5 space-y-2">
            {goals.map((g) => {
              const latest = s.ratings.filter((r) => r.goalId === g.id).sort((a, b) => b.date.localeCompare(a.date))[0]
              return (
                <li key={g.id} className="flex items-start justify-between gap-3 rounded-2xl bg-ivory p-3 text-sm">
                  <div className="min-w-0">
                    <Pill tone="lavender">{g.domain}</Pill>
                    <p className="mt-1 font-semibold text-forest">{g.title}</p>
                    <p className="text-charcoal-soft">Target: {g.target}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-serif text-2xl text-forest">{latest?.score ?? '—'}<span className="text-sm text-charcoal-soft">/5</span></p>
                    {g.status === 'met' ? <Pill icon={Star}>Met</Pill> : canClinical && <button type="button" className="text-xs font-semibold text-forest underline-offset-4 hover:underline" onClick={() => act((c) => { c.s.goals.find((x) => x.id === g.id)!.status = 'met'; audit(c, 'Marked goal met', g.title) })}>Mark met</button>}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          {canClinical && lastSession && goals.length > 0 && (
            <Card aria-labelledby="rate-h">
              <CardTitle id="rate-h">Rate the latest session</CardTitle>
              <p className="mb-3 text-sm text-charcoal-soft">
                {fullDate(lastSession.date)} · simple 1–5 scale {ratedToday && !rated && '· already rated (you can update)'}
              </p>
              <div className="space-y-3">
                {goals.filter((g) => g.status === 'active').map((g) => (
                  <fieldset key={g.id}>
                    <legend className="text-sm font-semibold text-forest">{g.title}</legend>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => (
                        <button key={v} type="button" aria-pressed={scores[g.id] === v} onClick={() => setScores({ ...scores, [g.id]: v })} className={cn('size-9 rounded-full text-xs font-bold ring-1 ring-forest/15', scores[g.id] === v ? 'bg-forest text-ivory' : 'bg-white text-forest hover:bg-sage-light')}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              <Button className="mt-4" size="sm" onClick={saveRatings} disabled={!Object.keys(scores).length}>
                Save ratings
              </Button>
              {rated && <p role="status" className="mt-2 text-sm font-semibold text-forest">Ratings saved — the chart and reports are updated.</p>}
            </Card>
          )}

          {canClinical && (
            <Card aria-labelledby="ng-h">
              <CardTitle id="ng-h">Add a goal</CardTitle>
              <div className="space-y-3">
                <Field label="Domain">
                  {(p) => (
                    <Select {...p} value={newGoal.domain} onChange={(e) => setNewGoal({ ...newGoal, domain: e.target.value as Domain })}>
                      {domains.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Goal">{(p) => <Input {...p} value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Cutting along a line" />}</Field>
                <Field label="Target" optional>{(p) => <Input {...p} value={newGoal.target} onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })} />}</Field>
                <Button size="sm" onClick={addGoal}>
                  <Plus aria-hidden /> Add goal
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card aria-labelledby="hp-h">
          <CardTitle
            id="hp-h"
            action={
              fam && (
                <Button size="sm" variant="soft" disabled={sent} onClick={() => { act((c) => homeProgramMessage(c, ch.id)); setSent(true) }}>
                  <Send aria-hidden /> {sent ? `Sent in ${languages[fam.language].label}` : `Send to family (${languages[fam.language].label})`}
                </Button>
              )
            }
          >
            Home program
          </CardTitle>
          <ul className="space-y-2">
            {acts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ivory p-3 text-sm">
                <div>
                  <p className="font-semibold text-forest">{a.title}</p>
                  <p className="text-xs text-charcoal-soft">
                    {a.domain} · {a.frequency}
                  </p>
                  {fam && fam.language !== 'en' && (
                    <p className="text-xs text-charcoal-soft" dir={languages[fam.language].dir} lang={fam.language}>
                      {activityTitle(a.key, fam.language)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1" aria-label={`Done ${a.completions.filter((d) => last7.includes(d)).length} of the last 7 days`}>
                  {last7.map((d) => (
                    <span key={d} className={cn('size-3 rounded-full', a.completions.includes(d) ? 'bg-forest' : 'bg-forest/10')} title={d} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {canClinical && (
            <div className="mt-3 flex gap-2">
              <label htmlFor="add-act" className="sr-only">
                Add activity
              </label>
              <Select id="add-act" value={addAct} onChange={(e) => setAddAct(e.target.value)} className="h-10">
                <option value="">Add an activity…</option>
                {activityLibrary.filter((x) => !acts.some((a) => a.key === x.key)).map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.title.en}
                  </option>
                ))}
              </Select>
              <Button size="sm" disabled={!addAct} onClick={() => { const lib = activityLibrary.find((x) => x.key === addAct)!; act((c) => { c.s.homeActivities.push({ id: sid('ha'), childId: ch.id, key: lib.key, title: lib.title.en, domain: lib.domain, frequency: lib.frequency, completions: [] }); audit(c, 'Added home activity', `${ch.firstName}: ${lib.title.en}`) }); setAddAct('') }}>
                Add
              </Button>
            </div>
          )}
          <p className="mt-3 text-xs text-charcoal-soft">Parents tick activities off in their portal; dots show the last 7 days.</p>
        </Card>

        {canClinical ? (
          <Card aria-labelledby="notes-h">
            <CardTitle id="notes-h">Session notes</CardTitle>
            <ul className="space-y-2">
              {notes.slice(0, 8).map((n) => {
                const a = s.appointments.find((x) => x.id === n.appointmentId)
                return (
                  <li key={n.id} className="flex items-center justify-between gap-2 rounded-2xl bg-ivory p-3 text-sm">
                    <span>
                      <b className="text-forest">{a ? shortDate(a.date) : ''}</b> · {serviceById(a?.serviceId)?.shortName}
                    </span>
                    <span className="flex items-center gap-2">
                      {n.status === 'signed' ? <Pill>Signed</Pill> : <Pill tone="butter">Draft</Pill>}
                      <TextLink to={`/studio/notes/${n.appointmentId}`}>Open</TextLink>
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        ) : (
          <Card>
            <Empty>Clinical notes are visible to therapists and the owner only.</Empty>
          </Card>
        )}
      </div>
    </>
  )
}
