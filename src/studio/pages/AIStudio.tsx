import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, FileText, Languages, NotebookPen, Route, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, Textarea } from '@/components/ui/form'
import { therapists, fullName } from '@/data/therapists'
import { formatTime } from '@/utils/time'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { AIBadge, Card, CardTitle, Notice, PageHeader, Tabs } from '../ui'
import { draftSoap, sampleVoiceMemo, bestSlots } from '../ai'
import { renderMessage } from '../messages'
import { languages, services } from '../reference'
import { fullDate, today } from '../util'
import type { Lang, MessageKind, SoapNote } from '../types'
import { AssistantChat } from '../AssistantChat'
import { AskDashboard } from './Dashboard'

type Tab = 'assistant' | 'notes' | 'reports' | 'scheduling' | 'language' | 'dashboard'

export default function AIStudio() {
  return (
    <Guard area="ai">
      <AIInner />
    </Guard>
  )
}

function AIInner() {
  const { s, viewer } = useStudio()
  const [tab, setTab] = useState<Tab>('notes')
  const items: { id: Tab; label: React.ReactNode }[] = [
    { id: 'assistant', label: 'Website assistant' },
    { id: 'notes', label: 'Session note drafts' },
    { id: 'reports', label: 'Progress report writer' },
    { id: 'scheduling', label: 'Smart scheduling' },
    { id: 'language', label: 'Family language support' },
    ...(viewer.role !== 'therapist' ? [{ id: 'dashboard' as Tab, label: 'Ask the dashboard' }] : []),
  ]
  return (
    <>
      <PageHeader eyebrow="AI-enabled" title="AI drafts, the therapist approves" intro="Six assistants that save time on writing and admin. Every output is a draft that a person reviews before it is used or sent." />
      <div className="mb-5">
        <Notice tone="butter" icon={Sparkles}>
          <b>Demo AI:</b> these samples run on rules and templates inside your browser — no data is sent to any AI service. In production, a model with a Canadian-hosted, privacy-reviewed setup would draft, and the clinic would control consent.
        </Notice>
      </div>
      <Tabs label="AI assistants" value={tab} onChange={setTab} items={items} />
      {tab === 'assistant' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Bot className="size-5 text-terracotta" aria-hidden /> Website assistant
              </span>
            </CardTitle>
            <p className="text-sm text-charcoal">Answers parents’ questions from the clinic’s own FAQ content and guides them to the right booking. If it can’t help, it captures a call-back request straight into Enquiries.</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-charcoal-soft">
              <li>Never gives diagnostic or medical advice</li>
              <li>Points to 911 for emergencies</li>
              <li>Live on every public page — look for the chat button</li>
            </ul>
            <Button asChild className="mt-5" variant="secondary">
              <Link to="/">Open the public website</Link>
            </Button>
          </Card>
          <Card className="p-0 sm:p-0">
            <AssistantChat />
          </Card>
        </div>
      )}
      {tab === 'notes' && <NoteDraftDemo />}
      {tab === 'reports' && <ReportsDemo />}
      {tab === 'scheduling' && <SchedulingDemo />}
      {tab === 'language' && <LanguageDemo />}
      {tab === 'dashboard' && <AskDashboard />}
      <p className="mt-6 text-xs text-charcoal-soft">AI features can be switched off clinic-wide in production. Families: {s.families.length} · all fictional.</p>
    </>
  )
}

function NoteDraftDemo() {
  const [bullets, setBullets] = useState(sampleVoiceMemo('Maya'))
  const [soap, setSoap] = useState<SoapNote | null>(null)
  const { s } = useStudio()
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <NotebookPen className="size-5 text-terracotta" aria-hidden /> Voice memo or bullets
          </span>
        </CardTitle>
        <label htmlFor="ai-bullets" className="sr-only">
          Bullets
        </label>
        <Textarea id="ai-bullets" value={bullets} onChange={(e) => setBullets(e.target.value)} className="min-h-[220px]" />
        <Button className="mt-3" onClick={() => setSoap(draftSoap({ bullets, child: 'Maya', serviceId: 'ot-session-home', minutes: 60, goals: s.goals.filter((g) => g.childId === 'c-maya') }))}>
          <Wand2 aria-hidden /> Draft structured SOAP note
        </Button>
        <p className="mt-3 text-sm text-charcoal-soft">
          To write a real note for a visit, open <Link className="font-semibold text-forest underline" to="/studio/notes">Session notes</Link>.
        </p>
      </Card>
      <Card>
        <CardTitle action={soap && <AIBadge />}>SOAP draft</CardTitle>
        {soap ? (
          <dl className="space-y-3 text-sm">
            {(['s', 'o', 'a', 'p'] as const).map((k) => (
              <div key={k}>
                <dt className="font-bold text-forest">{{ s: 'Subjective', o: 'Objective', a: 'Assessment', p: 'Plan' }[k]}</dt>
                <dd className="mt-0.5 text-charcoal" data-testid={`soap-${k}`}>
                  {soap[k]}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-charcoal-soft">The draft appears here. The therapist edits it and signs — nothing is filed until then.</p>
        )}
      </Card>
    </div>
  )
}

function ReportsDemo() {
  const { s } = useStudio()
  const kids = s.children.filter((c) => c.familyId && s.goals.some((g) => g.childId === c.id))
  const [cid, setCid] = useState(kids[0]?.id ?? '')
  return (
    <Card>
      <CardTitle>
        <span className="flex items-center gap-2">
          <FileText className="size-5 text-terracotta" aria-hidden /> Progress report writer
        </span>
      </CardTitle>
      <p className="text-sm text-charcoal">Writes a parent-friendly version and a school version from goal ratings, attendance and the home program. The therapist approves before sharing.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-semibold text-forest">
          Child
          <Select value={cid} onChange={(e) => setCid(e.target.value)} className="mt-1 h-11 w-64">
            {kids.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </Select>
        </label>
        <Button asChild>
          <Link to={`/studio/children/${cid}/report?audience=parent`}>Parent version</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to={`/studio/children/${cid}/report?audience=school`}>School version</Link>
        </Button>
      </div>
    </Card>
  )
}

function SchedulingDemo() {
  const { s } = useStudio()
  const [tid, setTid] = useState('julien-tremblay')
  const [svc, setSvc] = useState('ot-session-home')
  const [time, setTime] = useState<'any' | 'morning' | 'afternoon'>('any')
  const res = bestSlots(s, tid, svc, today(), { time })
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Route className="size-5 text-terracotta" aria-hidden /> Smart scheduling
          </span>
        </CardTitle>
        <p className="mb-4 text-sm text-charcoal">Ranks open times so therapist days have fewer gaps and home visits cluster on the same day. The same engine fills cancelled slots from the waitlist and orders home-visit routes.</p>
        <div className="grid gap-3">
          <Select aria-label="Therapist" value={tid} onChange={(e) => setTid(e.target.value)}>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {fullName(t)}
              </option>
            ))}
          </Select>
          <Select aria-label="Service" value={svc} onChange={(e) => setSvc(e.target.value)}>
            {services.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Family preference" value={time} onChange={(e) => setTime(e.target.value as typeof time)}>
            <option value="any">Any time</option>
            <option value="morning">Mornings</option>
            <option value="afternoon">Afternoons</option>
          </Select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link className="font-semibold text-forest underline" to="/studio/visits">
            Route order for today
          </Link>
          <Link className="font-semibold text-forest underline" to="/studio/waitlist">
            Waitlist fill
          </Link>
        </div>
      </Card>
      <Card>
        <CardTitle action={<AIBadge>AI sample</AIBadge>}>Best slots</CardTitle>
        <ol className="space-y-2">
          {res.map((r, i) => (
            <li key={r.date + r.start} className="flex items-center gap-3 rounded-2xl bg-ivory p-3">
              <span className="grid size-8 place-items-center rounded-full bg-forest font-serif text-ivory">{i + 1}</span>
              <div>
                <p className="font-semibold text-forest">
                  {fullDate(r.date)} · {formatTime(r.start)}
                </p>
                <p className="text-xs text-charcoal-soft">{r.reasons.join(' · ')}</p>
              </div>
            </li>
          ))}
          {!res.length && <p className="text-sm text-charcoal-soft">No open times in the next 3 weeks.</p>}
        </ol>
      </Card>
    </div>
  )
}

function LanguageDemo() {
  const [kind, setKind] = useState<MessageKind>('reminder')
  const [lang, setLang] = useState<Lang>('fr')
  const vars = { parent: 'Isabelle', child: 'Théo', therapist: 'Leah Thompson', service: 'OT Session – Virtual', date: today(), time: '13:00', amount: 140, number: 'INV-1042', due: today(), days: 14, hold: new Date(Date.now() + 7200_000).toISOString(), weeks: 10, month: today(), activities: 'Play-dough squeeze & pinch; Animal walks' }
  const en = renderMessage(kind, 'en', vars)
  const tr = renderMessage(kind, lang, vars)
  const kinds: MessageKind[] = ['reminder', 'confirmation', 'forms', 'invoice', 'receipt', 'overdue', 'waitlist-offer', 'plan', 'statement', 'report', 'home-program']
  return (
    <Card>
      <CardTitle action={<AIBadge>AI sample translation · review before sending</AIBadge>}>
        <span className="flex items-center gap-2">
          <Languages className="size-5 text-terracotta" aria-hidden /> Family language support
        </span>
      </CardTitle>
      <div className="mb-4 flex flex-wrap gap-3">
        <Select aria-label="Message" value={kind} onChange={(e) => setKind(e.target.value as MessageKind)} className="h-11 w-56">
          {kinds.map((k) => (
            <option key={k} value={k}>
              {k.replace('-', ' ')}
            </option>
          ))}
        </Select>
        <Select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="h-11 w-64">
          {(Object.keys(languages) as Lang[]).filter((l) => l !== 'en').map((l) => (
            <option key={l} value={l}>
              {languages[l].label} — {languages[l].native}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">English</p>
          <p className="mt-2 font-semibold text-forest">{en.subject}</p>
          <p className="mt-1 text-sm text-charcoal">{en.body}</p>
        </div>
        <div className="rounded-2xl bg-lavender/60 p-4" dir={languages[lang].dir} lang={lang}>
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">{languages[lang].native}</p>
          <p className="mt-2 font-semibold text-forest">{tr.subject}</p>
          <p className="mt-1 text-sm text-charcoal">{tr.body}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-charcoal-soft">Reminders, invoices, receipts and home programs go out automatically in each family’s language (set on the family profile).</p>
    </Card>
  )
}
