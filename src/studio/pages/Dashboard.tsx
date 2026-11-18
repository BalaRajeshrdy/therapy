import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck2, FileBarChart, ListChecks, Percent, Receipt, Send, Sparkles, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { AIBadge, BarChart, Card, CardTitle, DataTable, PageHeader, Stat, TextLink } from '../ui'
import { invoicedPerMonth, ownerMetrics, sessionsPerWeek, therapistTable } from '../selectors'
import { askDashboard, dashboardSuggestions, type DashAnswer } from '../ai'
import { money, stamp, today } from '../util'
import { seriesColors } from '../reference'

export default function Dashboard() {
  return (
    <Guard area="dashboard">
      <DashboardInner />
    </Guard>
  )
}

function DashboardInner() {
  const { s, waitlist } = useStudio()
  const t = today()
  const m = ownerMetrics(s, t, waitlist)
  return (
    <>
      <PageHeader
        eyebrow="Owner dashboard"
        title="The whole clinic at a glance"
        intro="Live from today’s schedule, attendance, billing and waitlist. Every number updates as visits are completed and payments recorded."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link to="/studio/report">
              <FileBarChart aria-hidden /> Monthly owner report
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat tone="forest" value={m.sessions} label="Sessions this month" hint={`${m.clinicSessions} family visits · ${m.siteVisits} site visits`} icon={CalendarCheck2} />
        <Stat tone="forest" value={`${m.noShowRate}%`} label="No-show rate" hint={`${m.noShows} this month`} icon={Percent} />
        <Stat tone="forest" value={m.waitlist} label="On waitlist" hint={<Link className="underline" to="/studio/waitlist">Auto-offers on</Link>} icon={ListChecks} />
        <Stat tone="forest" value={`${m.paidOnTime}%`} label="Invoices paid on time" hint={`${m.overdue} overdue now`} icon={Receipt} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat value={money(m.invoiced)} label="Invoiced this month" hint="Placeholder demo fees" icon={Receipt} />
        <Stat value={money(m.collected)} label="Collected this month" icon={Wallet} />
        <Stat value={money(m.outstanding)} label="Outstanding" hint={<Link className="underline" to="/studio/billing">View balances</Link>} icon={Wallet} tone="peach" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <BarChart title="Sessions per week" data={sessionsPerWeek(s, t)} unit="sessions" color={seriesColors[0]} />
        </Card>
        <Card>
          <BarChart title="Invoiced per month" data={invoicedPerMonth(s, t, 3)} unit="CAD" color={seriesColors[0]} format={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card aria-labelledby="team-h">
          <CardTitle id="team-h">Team this month</CardTitle>
          <DataTable
            columns={['Therapist', 'Sessions', 'Home visits', 'Site visits', 'Km', 'Notes due']}
            rows={therapistTable(s, t).map((r) => [r.name, r.sessions, r.home, r.siteVisits, r.km, r.notesDue ? <TextLink to="/studio/notes">{r.notesDue}</TextLink> : '0'])}
          />
        </Card>
        <AskDashboard />
      </div>

      <Card className="mt-6" aria-labelledby="auto-h">
        <CardTitle id="auto-h" action={<TextLink to="/studio/automation">Automation log</TextLink>}>
          What ran on its own
        </CardTitle>
        <ul className="divide-y divide-forest/5">
          {s.events.slice(0, 6).map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
              <span>
                <b className="text-forest">{e.title}</b> <span className="text-charcoal-soft">— {e.detail}</span>
              </span>
              <span className="text-xs text-charcoal-soft">{stamp(e.at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

export function AskDashboard() {
  const { s, waitlist } = useStudio()
  const [q, setQ] = useState('')
  const [answers, setAnswers] = useState<{ q: string; a: DashAnswer }[]>([])
  const ask = (question: string) => {
    if (!question.trim()) return
    setAnswers((prev) => [{ q: question, a: askDashboard(s, question, today(), waitlist.filter((w) => w.status === 'waiting').length) }, ...prev].slice(0, 3))
    setQ('')
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(q)
  }
  return (
    <Card aria-labelledby="ask-h">
      <CardTitle id="ask-h" action={<AIBadge>AI sample · answers from your data</AIBadge>}>
        <span className="flex items-center gap-2">
          <Sparkles className="size-5 text-terracotta" aria-hidden /> Ask the dashboard
        </span>
      </CardTitle>
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="ask-input" className="sr-only">
          Ask a question about the clinic
        </label>
        <Input id="ask-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="How many home visits did each therapist do in October?" />
        <Button type="submit" size="icon" aria-label="Ask" className="size-12 shrink-0">
          <Send aria-hidden />
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {dashboardSuggestions.map((sug) => (
          <button key={sug} type="button" onClick={() => ask(sug)} className="rounded-full bg-sage-light/70 px-3 py-1.5 text-xs font-medium text-forest hover:bg-sage-light">
            {sug}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="mt-4 space-y-4">
        {answers.map(({ q: question, a }, i) => (
          <div key={i} className="rounded-2xl bg-ivory p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">{question}</p>
            <p className="mt-1 font-semibold text-forest" data-testid="dash-answer">
              {a.answer}
            </p>
            {a.table && (
              <div className="mt-3">
                <DataTable columns={a.table.columns} rows={a.table.rows} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
