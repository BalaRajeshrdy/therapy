import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BadgeCheck, Ban, CreditCard, FileText, Layers, Mail, Play, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { Card, CardTitle, DataTable, Empty, Notice, PageHeader, Pill, PrintButton, Row, Stat, Tabs, TextLink } from '../ui'
import { audit, familyById, invoiceBalance, isOverdue, recordPayment, runBatch, send, therapistName } from '../engine'
import { familyBalance, paidOnTime } from '../selectors'
import { therapistProfessional } from '../reference'
import { daysBetween, fullDate, money, shortDate, sum, today } from '../util'
import type { Invoice, Payment } from '../types'
import { DocHeader } from './Documents'

const billToName = (s: ReturnType<typeof useStudio>['s'], inv: Invoice) => (inv.billTo.kind === 'family' ? `${familyById(s, inv.billTo.id)?.name} family` : s.sites.find((x) => x.id === inv.billTo.id)?.name ?? '')

export default function Billing() {
  return (
    <Guard area="billing">
      <BillingInner />
    </Guard>
  )
}

type Tab = 'invoices' | 'batch' | 'packages' | 'statements' | 'payments'

function BillingInner() {
  const { s } = useStudio()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'invoices'
  const t = today()
  const outstanding = sum(s.invoices.map(invoiceBalance))
  const overdue = s.invoices.filter((i) => isOverdue(i, t))
  const paid = s.invoices.filter((i) => i.status === 'paid' && i.total > 0)
  return (
    <>
      <PageHeader eyebrow="Module 4 · Billing" title="Invoices and receipts that write themselves" intro="Completed visits, no-shows and late cancels are billed by policy. Batch per family or per site, issue insurance-ready receipts, and let reminders chase overdue balances." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={money(outstanding)} label="Outstanding" icon={Wallet} />
        <Stat value={overdue.length} label="Overdue invoices" tone="peach" />
        <Stat value={`${Math.round((paid.filter(paidOnTime).length / Math.max(1, paid.length)) * 100)}%`} label="Paid on time" tone="sage" />
        <Stat value={s.invoices.length} label="Invoices issued" tone="lavender" />
      </div>
      <Notice tone="lavender">Fees are placeholder demo values set in Settings — not real prices.</Notice>
      <div className="mt-5">
        <Tabs<Tab>
          label="Billing sections"
          value={tab}
          onChange={(v) => setParams({ tab: v })}
          items={[
            { id: 'invoices', label: 'Invoices' },
            { id: 'batch', label: 'Batch invoicing' },
            { id: 'payments', label: 'Payments & receipts' },
            { id: 'statements', label: 'Statements' },
            { id: 'packages', label: 'Packages' },
          ]}
        />
      </div>
      {tab === 'invoices' && <InvoiceList />}
      {tab === 'batch' && <BatchRun />}
      {tab === 'payments' && <Payments />}
      {tab === 'statements' && <Statements />}
      {tab === 'packages' && <Packages />}
    </>
  )
}

function InvoiceList() {
  const { s } = useStudio()
  const t = today()
  const [filter, setFilter] = useState<'open' | 'overdue' | 'paid' | 'all'>('open')
  const [q, setQ] = useState('')
  const list = s.invoices
    .filter((i) => (filter === 'all' ? true : filter === 'paid' ? i.status === 'paid' : filter === 'overdue' ? isOverdue(i, t) : invoiceBalance(i) > 0))
    .filter((i) => `${i.number} ${billToName(s, i)}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn) || b.number.localeCompare(a.number))
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter invoices" className="flex gap-1">
          {(['open', 'overdue', 'paid', 'all'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${filter === f ? 'bg-forest text-ivory' : 'bg-ivory text-forest'}`}>
              {f}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="inv-q">
          Search invoices
        </label>
        <Input id="inv-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number or name" className="h-10 max-w-xs" />
      </div>
      {list.length ? (
        <DataTable
          caption="Invoices"
          columns={['Invoice', 'Bill to', 'Issued', 'Due', 'Total', 'Balance', 'Status']}
          rows={list.slice(0, 60).map((i) => [
            <TextLink key={i.id} to={`/studio/invoices/${i.id}`}>
              {i.number}
            </TextLink>,
            billToName(s, i),
            shortDate(i.issuedOn),
            shortDate(i.dueOn),
            money(i.total),
            money(invoiceBalance(i)),
            <InvoiceStatus key={'s' + i.id} inv={i} />,
          ])}
        />
      ) : (
        <Empty>No invoices match.</Empty>
      )}
    </Card>
  )
}

export function InvoiceStatus({ inv }: { inv: Invoice }) {
  const t = today()
  if (inv.status === 'void') return <Pill tone="ivory" icon={Ban}>Void</Pill>
  if (inv.status === 'paid') return <Pill icon={BadgeCheck}>Paid</Pill>
  if (isOverdue(inv, t)) return <Pill tone="alert">{daysBetween(inv.dueOn, t)} days overdue</Pill>
  return <Pill tone="butter">Open</Pill>
}

function BatchRun() {
  const { s, act } = useStudio()
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [scope, setScope] = useState<'families' | 'sites' | 'all'>('all')
  const [made, setMade] = useState<Invoice[] | null>(null)
  const uninvoicedVisits = s.appointments.filter((a) => !a.invoiceId && a.familyId && ['completed', 'no-show', 'late-cancel'].includes(a.status))
  const uninvoicedSite = s.siteVisits.filter((v) => v.status === 'completed' && !v.invoiceId)
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <Card aria-labelledby="batch-h">
        <CardTitle id="batch-h">
          <span className="flex items-center gap-2">
            <Layers className="size-5 text-terracotta" aria-hidden /> Run a batch
          </span>
        </CardTitle>
        <p className="mb-4 text-sm text-charcoal-soft">
          Waiting to be invoiced: <b>{uninvoicedVisits.length}</b> family visits (monthly-billed families) and <b>{uninvoicedSite.length}</b> completed site visits.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Period">
            {(p) => (
              <Select {...p} value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
                <option value="daily">Daily (today)</option>
                <option value="weekly">Weekly (last 7 days)</option>
                <option value="monthly">Monthly (last calendar month)</option>
              </Select>
            )}
          </Field>
          <Field label="Bill to">
            {(p) => (
              <Select {...p} value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
                <option value="all">Families and sites</option>
                <option value="families">Per family</option>
                <option value="sites">Per school, hospital or agency</option>
              </Select>
            )}
          </Field>
        </div>
        <Button className="mt-5" onClick={() => setMade(act((c) => runBatch(c, period, scope)))}>
          <Play aria-hidden /> Generate invoices
        </Button>
      </Card>
      <Card aria-labelledby="res-h">
        <CardTitle id="res-h">Result</CardTitle>
        {made == null ? (
          <Empty>Run a batch to see the invoices it creates.</Empty>
        ) : made.length ? (
          <div role="status">
            <p className="mb-3 text-sm font-semibold text-forest">
              Created {made.length} invoice{made.length > 1 ? 's' : ''}.
            </p>
            <DataTable columns={['Invoice', 'Bill to', 'Lines', 'Total']} rows={made.map((i) => [<TextLink key={i.id} to={`/studio/invoices/${i.id}`}>{i.number}</TextLink>, billToName(s, i), i.lines.length, money(i.total)])} />
          </div>
        ) : (
          <p role="status" className="text-sm text-charcoal-soft">
            Nothing to invoice for that period — everything is already billed.
          </p>
        )}
      </Card>
    </div>
  )
}

function Payments() {
  const { s } = useStudio()
  const pays = s.invoices.flatMap((i) => i.payments.map((p) => ({ p, i }))).sort((a, b) => b.p.date.localeCompare(a.p.date) || b.p.receiptNo.localeCompare(a.p.receiptNo))
  return (
    <Card>
      <DataTable
        caption="Payments"
        columns={['Receipt', 'Date', 'From', 'Method', 'Amount', 'Invoice']}
        rows={pays.slice(0, 50).map(({ p, i }) => [
          <TextLink key={p.id} to={`/studio/invoices/${i.id}?view=receipt`}>
            {p.receiptNo}
          </TextLink>,
          shortDate(p.date),
          billToName(s, i),
          p.method,
          money(p.amount),
          i.number,
        ])}
      />
    </Card>
  )
}

function Statements() {
  const { s } = useStudio()
  return (
    <Card>
      <DataTable
        caption="Family balances"
        columns={['Family', 'Invoices', 'Balance', 'Overdue', '']}
        rows={s.families.map((f) => {
          const invs = s.invoices.filter((i) => i.billTo.kind === 'family' && i.billTo.id === f.id)
          return [
            `${f.name} family`,
            invs.length,
            money(familyBalance(s, f.id)),
            invs.filter((i) => isOverdue(i, today())).length,
            <TextLink key={f.id} to={`/studio/statements/${f.id}`}>
              Statement
            </TextLink>,
          ]
        })}
      />
      <p className="mt-3 text-xs text-charcoal-soft">On the 1st of each month, statements are generated and sent automatically to every family with a balance.</p>
    </Card>
  )
}

function Packages() {
  const { s } = useStudio()
  return (
    <Card>
      {s.packages.length ? (
        <DataTable
          caption="Session packages"
          columns={['Family', 'Package', 'Used', 'Remaining', 'Purchased']}
          rows={s.packages.map((p) => [
            <TextLink key={p.id} to={`/studio/clients/${p.familyId}`}>
              {familyById(s, p.familyId)?.name} family
            </TextLink>,
            p.name,
            p.used,
            p.sessions - p.used,
            shortDate(p.purchasedOn),
          ])}
        />
      ) : (
        <Empty>No packages sold yet.</Empty>
      )}
      <p className="mt-3 text-xs text-charcoal-soft">Package sessions are applied automatically when visits are invoiced. Sell packages from a family’s profile.</p>
    </Card>
  )
}

/* ---------- Invoice / receipt ---------- */

export function InvoiceDetail() {
  const { id } = useParams()
  const { s, act, viewer } = useStudio()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'receipt' ? 'receipt' : 'invoice'
  const [payOpen, setPayOpen] = useState(false)
  const [reminded, setReminded] = useState(false)
  const inv = s.invoices.find((i) => i.id === id)
  const staff = viewer.role === 'owner' || viewer.role === 'frontdesk'
  if (!inv || (viewer.role === 'parent' && !(inv.billTo.kind === 'family' && inv.billTo.id === viewer.familyId)) || viewer.role === 'therapist') return <Empty>Invoice not available for this role.</Empty>
  const bal = invoiceBalance(inv)
  const fam = inv.billTo.kind === 'family' ? familyById(s, inv.billTo.id) : undefined
  const site = inv.billTo.kind === 'site' ? s.sites.find((x) => x.id === inv.billTo.id) : undefined
  const therapistsOnInvoice = [...new Set(inv.lines.map((l) => l.therapistId).filter(Boolean))] as string[]

  return (
    <>
      <PageHeader
        eyebrow={view === 'receipt' ? 'Receipt' : 'Invoice'}
        title={inv.number}
        actions={
          <>
            <PrintButton />
            {staff && bal > 0 && (
              <Button size="sm" onClick={() => setPayOpen(true)}>
                <Wallet aria-hidden /> Record payment
              </Button>
            )}
            {viewer.role === 'parent' && bal > 0 && (
              <Button size="sm" onClick={() => act((c) => recordPayment(c, inv.id, bal, 'Online (demo)'))}>
                <CreditCard aria-hidden /> Pay {money(bal)} (demo)
              </Button>
            )}
            {staff && bal > 0 && fam && (
              <Button size="sm" variant="secondary" disabled={reminded} onClick={() => { act((c) => { send(c, isOverdue(inv, today()) ? 'overdue' : 'invoice', familyById(c.s, fam.id), { number: inv.number, amount: bal, due: inv.dueOn, days: Math.max(0, daysBetween(inv.dueOn, today())) }); audit(c, 'Sent payment reminder', inv.number) }); setReminded(true) }}>
                <Mail aria-hidden /> {reminded ? 'Reminder sent' : 'Send reminder'}
              </Button>
            )}
            {staff && inv.status === 'issued' && inv.payments.length === 0 && (
              <Button size="sm" variant="ghost" onClick={() => act((c) => { const x = c.s.invoices.find((y) => y.id === inv.id)!; x.status = 'void'; audit(c, 'Voided invoice', inv.number) })}>
                <Ban aria-hidden /> Void
              </Button>
            )}
          </>
        }
      />
      <Tabs label="Document" value={view} onChange={(v) => setParams(v === 'receipt' ? { view: 'receipt' } : {})} items={[{ id: 'invoice', label: 'Invoice' }, { id: 'receipt', label: 'Insurance receipt', count: inv.payments.length }]} />
      {viewer.role === 'parent' && bal > 0 && <div className="no-print mb-4"><Notice tone="lavender">Demo payment — no card details are collected and no money moves.</Notice></div>}
      <Card className="print-card mx-auto max-w-4xl">
        <DocHeader title={view === 'receipt' ? 'Official receipt' : 'Invoice'} subtitle={view === 'receipt' ? inv.payments.map((p) => p.receiptNo).join(', ') || 'No payments yet' : `${inv.number} · issued ${fullDate(inv.issuedOn)}`} />
        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          <div className="text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-charcoal-soft">Bill to</p>
            {fam && (
              <p className="mt-1">
                <b>{fam.guardians[0].name}</b>
                <br />
                {fam.address}, {fam.city}, ON {fam.postalCode}
              </p>
            )}
            {site && (
              <p className="mt-1">
                <b>{site.name}</b>
                <br />
                Attn: Accounts payable · {site.billingEmail}
              </p>
            )}
          </div>
          <dl>
            <Row k="Status" v={<InvoiceStatus inv={inv} />} />
            <Row k="Due" v={fullDate(inv.dueOn)} />
            <Row k="Billing" v={inv.batch === 'per-visit' ? 'Per visit' : `${inv.batch[0].toUpperCase()}${inv.batch.slice(1)} batch`} />
          </dl>
        </div>
        <DataTable
          caption="Services"
          columns={['Date', 'Service', 'Therapist & designation', 'Qty', 'Amount']}
          rows={inv.lines.map((l) => [
            shortDate(l.date),
            l.description,
            l.therapistId ? `${therapistName(l.therapistId)}, ${therapistProfessional[l.therapistId].designation} · Reg. # ${therapistProfessional[l.therapistId].regNo}` : '—',
            l.qty,
            money(l.amount),
          ])}
        />
        <div className="mt-6 flex flex-col items-end gap-1 text-sm">
          <p>
            Total <b className="ml-4">{money(inv.total)}</b>
          </p>
          <p>
            Paid <b className="ml-4">{money(sum(inv.payments.map((p) => p.amount)))}</b>
          </p>
          <p className="font-serif text-2xl text-forest">Balance {money(bal)}</p>
        </div>
        {view === 'receipt' && (
          <div className="mt-6 rounded-2xl bg-sage-light/50 p-4 text-sm">
            <p className="font-bold uppercase tracking-wider text-forest">Payments received</p>
            {inv.payments.length ? (
              <ul className="mt-2 space-y-1">
                {inv.payments.map((p: Payment) => (
                  <li key={p.id}>
                    {p.receiptNo} · {fullDate(p.date)} · {p.method} · <b>{money(p.amount)}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2">No payments recorded yet.</p>
            )}
            <p className="mt-3 text-xs text-charcoal-soft">
              Services provided by {therapistsOnInvoice.map((tid) => `${therapistName(tid)} (${therapistProfessional[tid].designation}, Reg. # ${therapistProfessional[tid].regNo})`).join('; ') || 'clinic staff'}. Keep this receipt for your extended health insurance claim. Registration numbers shown are fictional placeholders.
            </p>
          </div>
        )}
        {inv.reminders.length > 0 && <p className="mt-4 text-xs text-charcoal-soft">Reminders sent: {inv.reminders.map((r) => `${r.day}-day`).join(', ')}.</p>}
        <p className="mt-4 text-xs text-charcoal-soft">Demo document — fictional clinic, fictional data, placeholder fees. HST: occupational therapy services are generally HST-exempt in Ontario.</p>
      </Card>
      {fam && staff && (
        <p className="no-print mt-4 text-center text-sm">
          <Link to={`/studio/statements/${fam.id}`} className="font-semibold text-forest hover:underline">
            <FileText className="mr-1 inline size-4" aria-hidden />
            Family statement
          </Link>
        </p>
      )}
      <PaymentDialog inv={inv} open={payOpen} onOpenChange={setPayOpen} />
    </>
  )
}

function PaymentDialog({ inv, open, onOpenChange }: { inv: Invoice; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { act } = useStudio()
  const bal = invoiceBalance(inv)
  const [amount, setAmount] = useState(String(bal))
  const [method, setMethod] = useState<Payment['method']>('e-Transfer')
  const [date, setDate] = useState(today())
  const [err, setErr] = useState('')
  useEffect(() => setAmount(String(bal)), [bal, open])
  const save = () => {
    const n = Number(amount)
    if (!(n > 0) || n > bal + 0.001) return setErr(`Enter an amount between $0.01 and ${money(bal)}.`)
    act((c) => recordPayment(c, inv.id, n, method, date))
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Record payment" description={`${inv.number} · balance ${money(bal)}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount (CAD)" error={err}>{(p) => <Input {...p} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
          <Field label="Method">
            {(p) => (
              <Select {...p} value={method} onChange={(e) => setMethod(e.target.value as Payment['method'])}>
                {(['e-Transfer', 'Credit card', 'Debit', 'Cash', 'Insurance (direct)'] as const).map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Date received">{(p) => <Input {...p} type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        </div>
        <p className="mt-3 text-xs text-charcoal-soft">An insurance-ready receipt is issued to the family automatically.</p>
        <Button className="mt-5 w-full" onClick={save}>
          Save payment
        </Button>
      </DialogContent>
    </Dialog>
  )
}
