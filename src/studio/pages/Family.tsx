import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { differenceInYears, parseISO } from 'date-fns'
import { CalendarDays, CheckCircle2, FileSignature, Mail, MessageSquare, Receipt, TrendingUp, Wallet, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { formatTime, addDaysISO } from '@/utils/time'
import { cn } from '@/lib/utils'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { Card, CardTitle, DataTable, Empty, LineChart, Notice, PageHeader, Pill, SignaturePad, Stat, TextLink } from '../ui'
import { acceptPlan, audit, event, familyById, invoiceBalance, therapistName } from '../engine'
import { familyBalance, familyInvoices } from '../selectors'
import { activityTitle } from '../messages'
import { languages, seriesColors, serviceById } from '../reference'
import { fullDate, money, shortDate, stamp, today } from '../util'
import type { FormRequest, Lang } from '../types'
import { ApptDialog } from './Schedule'
import { InvoiceStatus } from './Billing'

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function useFamily() {
  const { s, viewer } = useStudio()
  return familyById(s, viewer.familyId)
}

export function FamilyHome() {
  return (
    <Guard area="family">
      <FamilyHomeInner />
    </Guard>
  )
}

function FamilyHomeInner() {
  const { s, act } = useStudio()
  const fam = useFamily()
  const [openId, setOpenId] = useState<string | null>(null)
  if (!fam) return <Empty>Family not found.</Empty>
  const t = today()
  const kids = s.children.filter((c) => c.familyId === fam.id)
  const upcoming = s.appointments.filter((a) => a.familyId === fam.id && a.date >= t && a.status === 'scheduled').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const bal = familyBalance(s, fam.id)
  const pendingForms = s.forms.filter((f) => f.familyId === fam.id && f.status === 'requested')
  const plans = s.plans.filter((p) => p.status === 'offered' && kids.some((k) => k.id === p.childId))
  const msgs = s.outbox.filter((m) => m.familyId === fam.id)
  return (
    <>
      <PageHeader eyebrow="Parent portal" title={`Hi ${fam.guardians[0].name.split(' ')[0]}!`} intro="Everything for your family in one place: visits, progress, invoices and forms." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={upcoming.length} label="Upcoming visits" icon={CalendarDays} tone="sage" />
        <Stat value={money(bal)} label="Balance due" icon={Wallet} tone={bal > 0 ? 'peach' : 'sage'} hint={bal > 0 ? <Link className="underline" to="/studio/family/billing">Pay or view invoices</Link> : 'All paid — thank you!'} />
        <Stat value={pendingForms.length} label="Forms to complete" icon={FileSignature} tone={pendingForms.length ? 'butter' : 'sage'} hint={pendingForms.length ? <Link className="underline" to="/studio/family/forms">Complete now</Link> : 'All signed'} />
        <Stat value={msgs.length} label="Messages" icon={MessageSquare} tone="lavender" hint={<Link className="underline" to="/studio/family/messages">In {languages[fam.language].label}</Link>} />
      </div>

      {plans.map((p) => {
        const ch = kids.find((k) => k.id === p.childId)!
        return (
          <Card key={p.id} className="mt-6 bg-lavender/60" aria-label="Treatment plan">
            <CardTitle>{ch.firstName}’s treatment plan</CardTitle>
            <p className="text-sm text-charcoal">
              Following the assessment, {therapistName(p.therapistId)} recommends {p.weeks} weekly {serviceById(p.serviceId)?.name} sessions. Choose a weekly time:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.options.map((o) => (
                <Button key={o.weekday + o.start} size="sm" onClick={() => act((c) => acceptPlan(c, p.id, o))}>
                  Every {WD[o.weekday]} at {formatTime(o.start)}
                </Button>
              ))}
            </div>
          </Card>
        )
      })}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card aria-labelledby="kids-h">
          <CardTitle id="kids-h">Your children</CardTitle>
          <ul className="space-y-3">
            {kids.map((k) => (
              <li key={k.id} className="rounded-2xl bg-sage-light/60 p-4">
                <p className="font-serif text-xl text-forest">
                  {k.firstName} {k.lastName}
                </p>
                <p className="text-sm text-charcoal-soft">
                  {differenceInYears(parseISO(t), parseISO(k.dob))} years · {therapistName(k.therapistId)}
                </p>
                <TextLink to={`/studio/family/progress#${k.id}`} className="mt-2 inline-block text-sm">
                  Goals &amp; progress →
                </TextLink>
              </li>
            ))}
          </ul>
        </Card>
        <Card aria-labelledby="up-h">
          <CardTitle id="up-h">Upcoming visits</CardTitle>
          {upcoming.length ? (
            <ul className="space-y-2">
              {upcoming.slice(0, 8).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ivory p-3">
                  <div>
                    <p className="font-semibold text-forest">
                      {fullDate(a.date)} · {formatTime(a.start)}
                    </p>
                    <p className="text-sm text-charcoal-soft">
                      {kids.find((k) => k.id === a.childId)?.firstName} · {serviceById(a.serviceId)?.name} · {therapistName(a.therapistId)}
                    </p>
                  </div>
                  <span className="flex items-center gap-2">
                    {!a.familyConfirmed && (
                      <Button size="sm" variant="soft" onClick={() => act((c) => { const x = c.s.appointments.find((y) => y.id === a.id)!; x.familyConfirmed = true; x.flaggedForCall = false; audit(c, 'Family confirmed visit', `${a.date} ${a.start}`) })}>
                        Confirm
                      </Button>
                    )}
                    {a.familyConfirmed && <Pill icon={CheckCircle2}>Confirmed</Pill>}
                    <Button size="sm" variant="secondary" onClick={() => setOpenId(a.id)}>
                      Change
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No upcoming visits.</Empty>
          )}
          <p className="mt-3 text-xs text-charcoal-soft">
            Need to cancel? Please give at least {s.settings.lateCancelHours} hours’ notice — later cancellations are charged {s.settings.lateCancelFeePct}% of the visit fee.
          </p>
        </Card>
      </div>
      {openId && <ApptDialog id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}

/* ---------- Progress & home program ---------- */

export function FamilyProgress() {
  return (
    <Guard area="family">
      <FamilyProgressInner />
    </Guard>
  )
}

function FamilyProgressInner() {
  const { s, act } = useStudio()
  const fam = useFamily()
  if (!fam) return null
  const t = today()
  const kids = s.children.filter((c) => c.familyId === fam.id)
  const last7 = Array.from({ length: 7 }, (_, i) => addDaysISO(t, i - 6))
  const toggle = (id: string) =>
    act((c) => {
      const h = c.s.homeActivities.find((x) => x.id === id)!
      h.completions = h.completions.includes(t) ? h.completions.filter((d) => d !== t) : [...h.completions, t]
      audit(c, h.completions.includes(t) ? 'Ticked home activity' : 'Unticked home activity', h.title)
    })
  return (
    <>
      <PageHeader eyebrow="Parent portal" title="Goals & progress" intro="See how your child is doing on each goal, and tick off home activities between sessions." />
      <div className="space-y-6">
        {kids.map((k) => {
          const goals = s.goals.filter((g) => g.childId === k.id)
          const dates = [...new Set(s.ratings.filter((r) => goals.some((g) => g.id === r.goalId)).map((r) => r.date))].sort()
          const acts = s.homeActivities.filter((h) => h.childId === k.id)
          return (
            <section key={k.id} id={k.id} aria-labelledby={`${k.id}-h`} className="scroll-mt-24">
              <h2 id={`${k.id}-h`} className="mb-3 font-serif text-2xl text-forest">
                {k.firstName}
              </h2>
              <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <Card>
                  {dates.length > 1 ? (
                    <LineChart title={`Goal ratings by session (1–5) · ${k.firstName}`} labels={dates.map((_, i) => `S${i + 1}`)} series={goals.map((g, i) => ({ name: `${g.domain}: ${g.title.toLowerCase()}`, color: seriesColors[i % 4], values: dates.map((d) => s.ratings.find((r) => r.goalId === g.id && r.date === d)?.score ?? null) }))} />
                  ) : (
                    <Empty icon={TrendingUp}>Progress charts appear after the first few sessions.</Empty>
                  )}
                  {goals.length > 0 && (
                    <Button asChild size="sm" variant="secondary" className="mt-4">
                      <Link to={`/studio/children/${k.id}/report`}>View progress report</Link>
                    </Button>
                  )}
                </Card>
                <Card aria-label={`${k.firstName}’s home program`}>
                  <CardTitle>Home program</CardTitle>
                  {acts.length ? (
                    <ul className="space-y-2">
                      {acts.map((a) => (
                        <li key={a.id} className="rounded-2xl bg-ivory p-3">
                          <label className="flex cursor-pointer items-start gap-3">
                            <input type="checkbox" checked={a.completions.includes(t)} onChange={() => toggle(a.id)} className="mt-1 size-5 accent-forest" />
                            <span className="flex-1">
                              <span className="block font-semibold text-forest" dir={languages[fam.language].dir}>
                                {fam.language === 'en' ? a.title : activityTitle(a.key, fam.language)}
                              </span>
                              {fam.language !== 'en' && <span className="block text-xs text-charcoal-soft">{a.title}</span>}
                              <span className="block text-xs text-charcoal-soft">{a.frequency} · done today</span>
                            </span>
                          </label>
                          <div className="ml-8 mt-2 flex gap-1" aria-label={`Done ${a.completions.filter((d) => last7.includes(d)).length} of the last 7 days`}>
                            {last7.map((d) => (
                              <span key={d} className={cn('size-3 rounded-full', a.completions.includes(d) ? 'bg-forest' : 'bg-forest/10')} />
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty>Your therapist will add activities after the next session.</Empty>
                  )}
                </Card>
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}

/* ---------- Billing ---------- */

export function FamilyBilling() {
  return (
    <Guard area="family">
      <FamilyBillingInner />
    </Guard>
  )
}

function FamilyBillingInner() {
  const { s } = useStudio()
  const fam = useFamily()
  if (!fam) return null
  const invs = familyInvoices(s, fam.id).sort((a, b) => b.issuedOn.localeCompare(a.issuedOn))
  const pkgs = s.packages.filter((p) => p.familyId === fam.id)
  const bal = familyBalance(s, fam.id)
  return (
    <>
      <PageHeader
        eyebrow="Parent portal"
        title="Invoices, receipts & statements"
        intro="Receipts include the therapist’s designation and registration number for insurance claims."
        actions={
          <Button asChild size="sm" variant="secondary">
            <Link to={`/studio/statements/${fam.id}`}>Statement</Link>
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat value={money(bal)} label="Balance due" tone={bal > 0 ? 'peach' : 'sage'} icon={Wallet} />
        <Stat value={invs.length} label="Invoices" tone="lavender" icon={Receipt} />
        {pkgs.map((p) => (
          <Stat key={p.id} value={`${p.sessions - p.used}`} label={`${p.name}: sessions left`} tone="butter" icon={Package} />
        ))}
      </div>
      <Card>
        {invs.length ? (
          <DataTable
            caption="Invoices"
            columns={['Invoice', 'Issued', 'Total', 'Balance', 'Status', '']}
            rows={invs.map((i) => [
              <TextLink key={i.id} to={`/studio/invoices/${i.id}`}>
                {i.number}
              </TextLink>,
              shortDate(i.issuedOn),
              money(i.total),
              money(invoiceBalance(i)),
              <InvoiceStatus key={'st' + i.id} inv={i} />,
              i.payments.length ? (
                <TextLink key={'r' + i.id} to={`/studio/invoices/${i.id}?view=receipt`}>
                  Receipt
                </TextLink>
              ) : invoiceBalance(i) > 0 ? (
                <TextLink key={'p' + i.id} to={`/studio/invoices/${i.id}`}>
                  Pay
                </TextLink>
              ) : (
                ''
              ),
            ])}
          />
        ) : (
          <Empty>No invoices yet.</Empty>
        )}
      </Card>
    </>
  )
}

/* ---------- Forms with e-signature ---------- */

export function FamilyForms() {
  return (
    <Guard area="family">
      <FamilyFormsInner />
    </Guard>
  )
}

function FamilyFormsInner() {
  const { s } = useStudio()
  const fam = useFamily()
  if (!fam) return null
  const forms = s.forms.filter((f) => f.familyId === fam.id).sort((a) => (a.kind === 'intake' ? -1 : 1))
  return (
    <>
      <PageHeader eyebrow="Parent portal" title="Intake & consent forms" intro="Complete these before your first visit. Please don’t include medical history — your therapist will talk this through with you at the assessment." />
      <div className="space-y-6">
        {forms.map((f) => (f.status === 'completed' ? <CompletedForm key={f.id} f={f} /> : f.kind === 'intake' ? <IntakeForm key={f.id} f={f} /> : <ConsentForm key={f.id} f={f} />))}
        {!forms.length && <Empty>No forms requested.</Empty>}
      </div>
    </>
  )
}

function CompletedForm({ f }: { f: FormRequest }) {
  return (
    <Card aria-label={`${f.kind} form`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-xl capitalize text-forest">{f.kind} form</p>
        <Pill icon={CheckCircle2}>Signed {f.completedAt ? stamp(f.completedAt) : ''}</Pill>
      </div>
      {f.signature && (
        <div className="mt-3 flex items-center gap-4">
          {f.signature.dataUrl && <img src={f.signature.dataUrl} alt={`Signature of ${f.signature.name}`} className="h-12 w-48 rounded-xl bg-ivory object-contain" />}
          <p className="text-sm text-charcoal-soft">{f.signature.name}</p>
        </div>
      )}
    </Card>
  )
}

function IntakeForm({ f }: { f: FormRequest }) {
  const { s, act } = useStudio()
  const fam = familyById(s, f.familyId)!
  const child = s.children.find((c) => c.id === f.childId) ?? s.children.find((c) => c.familyId === f.familyId)
  const [v, setV] = useState({ childFirst: child?.firstName === 'Child' ? '' : child?.firstName ?? '', childLast: child?.lastName.startsWith('(') ? fam.name : child?.lastName ?? fam.name, dob: '', grade: '', concerns: [] as string[], goals: '', language: fam.language as Lang, heard: 'Search engine', address: fam.address.startsWith('Address') ? '' : fam.address })
  const [err, setErr] = useState<Record<string, string>>({})
  const concerns = ['Fine motor (writing, buttons, scissors)', 'Gross motor (balance, coordination)', 'Sensory (noise, textures, movement)', 'Daily routines (dressing, mealtimes, sleep)', 'Attention & regulation', 'Play & social participation']
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (!v.childFirst.trim()) er.childFirst = 'Please enter your child’s first name.'
    if (!v.dob) er.dob = 'Please enter your child’s date of birth.'
    if (!v.concerns.length) er.concerns = 'Choose at least one area.'
    if (v.address.trim().length < 5) er.address = 'Please enter your home address.'
    setErr(er)
    if (Object.keys(er).length) return
    act((c) => {
      const form = c.s.forms.find((x) => x.id === f.id)!
      form.status = 'completed'
      form.completedAt = new Date().toISOString()
      form.answers = { ...v, concerns: v.concerns.join('; ') }
      const fm = familyById(c.s, f.familyId)!
      fm.language = v.language
      fm.address = v.address
      const ch = c.s.children.find((x) => x.id === child?.id)
      if (ch) {
        ch.firstName = v.childFirst.trim()
        ch.lastName = v.childLast.trim() || fm.name
        ch.dob = v.dob
        ch.grade = v.grade
      }
      event(c, 'booking-confirmed', `Intake completed · ${fm.name} family`, 'Child profile updated from the intake form', `/studio/clients/${fm.id}`)
      audit(c, 'Completed intake form', `${fm.name} family`)
    })
  }
  return (
    <Card aria-labelledby={`${f.id}-h`}>
      <CardTitle id={`${f.id}-h`}>Intake form</CardTitle>
      <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Child’s first name" error={err.childFirst}>{(p) => <Input {...p} value={v.childFirst} onChange={(e) => setV({ ...v, childFirst: e.target.value })} />}</Field>
        <Field label="Child’s last name">{(p) => <Input {...p} value={v.childLast} onChange={(e) => setV({ ...v, childLast: e.target.value })} />}</Field>
        <Field label="Date of birth" error={err.dob}>{(p) => <Input {...p} type="date" max={today()} value={v.dob} onChange={(e) => setV({ ...v, dob: e.target.value })} />}</Field>
        <Field label="School / grade" optional>{(p) => <Input {...p} value={v.grade} onChange={(e) => setV({ ...v, grade: e.target.value })} />}</Field>
        <Field label="Home address" error={err.address} className="sm:col-span-2" hint="Used for in-home visits and receipts">{(p) => <Input {...p} value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} />}</Field>
        <fieldset className="sm:col-span-2" aria-describedby={err.concerns ? `${f.id}-cerr` : undefined}>
          <legend className="text-sm font-semibold text-forest">What would you like help with?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {concerns.map((c) => (
              <label key={c} className="flex items-center gap-2 rounded-2xl border border-forest/10 bg-white px-3 py-2 text-sm">
                <input type="checkbox" checked={v.concerns.includes(c)} onChange={(e) => setV({ ...v, concerns: e.target.checked ? [...v.concerns, c] : v.concerns.filter((x) => x !== c) })} className="size-4 accent-forest" />
                {c}
              </label>
            ))}
          </div>
          {err.concerns && <p id={`${f.id}-cerr`} role="alert" className="mt-1 text-sm text-terracotta">{err.concerns}</p>}
        </fieldset>
        <Field label="Your goals for therapy" optional className="sm:col-span-2" hint="In a sentence or two — no medical details needed">{(p) => <Textarea {...p} value={v.goals} onChange={(e) => setV({ ...v, goals: e.target.value })} />}</Field>
        <Field label="Preferred language for messages">
          {(p) => (
            <Select {...p} value={v.language} onChange={(e) => setV({ ...v, language: e.target.value as Lang })}>
              {(Object.keys(languages) as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {languages[l].label} — {languages[l].native}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="How did you hear about us?">
          {(p) => (
            <Select {...p} value={v.heard} onChange={(e) => setV({ ...v, heard: e.target.value })}>
              {['Search engine', 'Physician', 'School', 'Friend or family', 'Social media', 'Other'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          )}
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit">Submit intake form</Button>
        </div>
      </form>
    </Card>
  )
}

function ConsentForm({ f }: { f: FormRequest }) {
  const { act } = useStudio()
  const fam = useFamily()!
  const [v, setV] = useState({ assessment: false, privacy: false, shareSchool: false, photos: false, name: fam.guardians[0].name })
  const [ink, setInk] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const submit = () => {
    if (!v.assessment || !v.privacy) return setErr('Please agree to the two required items.')
    if (v.name.trim().length < 2) return setErr('Please type your full name to sign.')
    if (!ink) return setErr('Please add your signature in the box.')
    act((c) => {
      const form = c.s.forms.find((x) => x.id === f.id)!
      form.status = 'completed'
      form.completedAt = new Date().toISOString()
      form.answers = { assessment: v.assessment, privacy: v.privacy, shareSchool: v.shareSchool, photos: v.photos }
      form.signature = { name: v.name.trim(), dataUrl: ink, at: form.completedAt }
      event(c, 'booking-confirmed', `Consent signed · ${fam.name} family`, `E-signature by ${v.name.trim()}${v.shareSchool ? '; school sharing allowed' : ''}`, `/studio/clients/${fam.id}`)
      audit(c, 'Signed consent form (e-signature)', `${fam.name} family`)
    })
  }
  const box = (k: 'assessment' | 'privacy' | 'shareSchool' | 'photos', label: string, required?: boolean) => (
    <label className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-white p-3 text-sm">
      <input type="checkbox" checked={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.checked })} className="mt-0.5 size-[18px] accent-forest" />
      <span>
        {label} {required ? <b className="text-terracotta">(required)</b> : <span className="text-charcoal-soft">(optional)</span>}
      </span>
    </label>
  )
  return (
    <Card aria-labelledby={`${f.id}-h`}>
      <CardTitle id={`${f.id}-h`}>Consent form</CardTitle>
      <div className="space-y-2">
        {box('assessment', 'I consent to occupational therapy assessment and treatment for my child.', true)}
        {box('privacy', 'I have read how the clinic collects, uses and protects my family’s personal information.', true)}
        {box('shareSchool', 'The therapist may share progress summaries with my child’s school.')}
        {box('photos', 'Photos or videos may be taken during sessions for my child’s home program.')}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SignaturePad onChange={setInk} label="Your signature" />
        <Field label="Type your full name">{(p) => <Input {...p} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />}</Field>
      </div>
      {err && (
        <p role="alert" className="mt-3 text-sm font-medium text-terracotta">
          {err}
        </p>
      )}
      <Button className="mt-4" onClick={submit}>
        <FileSignature aria-hidden /> Sign consent
      </Button>
      <p className="mt-2 text-xs text-charcoal-soft">Demo e-signature — stored only in this browser.</p>
    </Card>
  )
}

/* ---------- Messages ---------- */

export function FamilyMessages() {
  return (
    <Guard area="family">
      <FamilyMessagesInner />
    </Guard>
  )
}

function FamilyMessagesInner() {
  const { s } = useStudio()
  const fam = useFamily()
  if (!fam) return null
  const msgs = s.outbox.filter((m) => m.familyId === fam.id)
  return (
    <>
      <PageHeader eyebrow="Parent portal" title="Messages" intro={`Confirmations, reminders and receipts — in ${languages[fam.language].label}.`} />
      <Notice tone="lavender">Demo inbox: these are the messages the clinic system would send. Nothing is actually emailed or texted.</Notice>
      <ul className="mt-5 space-y-3">
        {msgs.slice(0, 40).map((m) => (
          <li key={m.id}>
            <Card as="article" className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold text-forest" dir={languages[m.lang].dir}>
                  {m.channel === 'sms' ? <MessageSquare className="size-4" aria-label="SMS" /> : <Mail className="size-4" aria-label="Email" />}
                  {m.subject}
                </p>
                <span className="text-xs text-charcoal-soft">{stamp(m.at)}</span>
              </div>
              <p className="mt-2 text-sm text-charcoal" dir={languages[m.lang].dir} lang={m.lang}>
                {m.body}
              </p>
            </Card>
          </li>
        ))}
        {!msgs.length && <Empty>No messages yet.</Empty>}
      </ul>
    </>
  )
}
