import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck2, CalendarOff, Hourglass, RotateCcw, Stethoscope, Trash2, TriangleAlert, Users, Ban } from 'lucide-react'
import { useDemoStore } from '@/hooks/useDemoStore'
import { therapists, therapistById, fullName } from '@/data/therapists'
import { treatments, treatmentById } from '@/data/treatments'
import { availabilityFor } from '@/data/availability'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DemoBadge } from '@/components/ui/decor'
import { TherapistAvatar } from '@/components/therapists/TherapistCard'
import { addDaysISO, clinicToday, formatMediumDate, formatTime, formatDuration } from '@/utils/time'
import { bookingWindow, mockBusy } from '@/utils/scheduling'
import { ontarioHolidays } from '@/utils/holidays'
import { cn } from '@/lib/utils'

const TABS = ['Appointments', 'Waitlist', 'Blocked dates', 'Therapists', 'Treatments'] as const
type Tab = (typeof TABS)[number]
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DemoAdmin() {
  const store = useDemoStore()
  const [tab, setTab] = useState<Tab>('Appointments')
  const [confirmReset, setConfirmReset] = useState(false)
  const today = clinicToday()

  const mockCount = useMemo(() => {
    let n = 0
    for (let i = 1; i <= 14; i++) for (const t of therapists) n += mockBusy(t.id, addDaysISO(today, i)).length
    return n
  }, [today])

  const confirmed = store.bookings.filter((b) => b.status === 'confirmed')
  const stats = [
    { Icon: CalendarCheck2, k: 'Demo bookings', v: confirmed.length, tone: 'bg-sage-light' },
    { Icon: Hourglass, k: 'Waitlist requests', v: store.waitlist.length, tone: 'bg-lavender' },
    { Icon: CalendarOff, k: 'Admin-blocked days', v: store.adminBlocked.length, tone: 'bg-peach' },
    { Icon: Users, k: 'Mock appts (next 14 days)', v: mockCount, tone: 'bg-butter' },
  ]

  return (
    <div className="container pb-24 pt-10 sm:pt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Demo admin</span>
          <h1 className="mt-3 text-4xl sm:text-5xl">Clinic dashboard</h1>
          <p className="mt-2 max-w-2xl text-charcoal-soft">A lightweight, frontend-only view of demo data stored in this browser.</p>
        </div>
        <Button variant="secondary" onClick={() => setConfirmReset(true)}>
          <RotateCcw aria-hidden /> Reset demo data
        </Button>
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-butter/70 p-4 text-sm text-[#5a4b17]">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          <strong>Not a secure administration area.</strong> There is no login and no backend — anyone using this browser can see and change this data. It exists only to demonstrate how the booking flow could be managed.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ Icon, k, v, tone }) => (
          <div key={k} className={cn('rounded-3xl p-5', tone)}>
            <Icon className="size-5 text-forest" aria-hidden />
            <p className="mt-3 font-serif text-4xl text-forest">{v}</p>
            <p className="text-sm text-charcoal-soft">{k}</p>
          </div>
        ))}
      </div>

      <div className="scrollbar-none mt-10 flex gap-2 overflow-x-auto" role="tablist" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls="admin-panel"
            onClick={() => setTab(t)}
            className={cn('shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors', tab === t ? 'bg-forest text-ivory' : 'bg-white text-forest ring-1 ring-forest/10 hover:ring-forest/30')}
          >
            {t}
          </button>
        ))}
      </div>

      <div id="admin-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-6 rounded-[2rem] bg-white p-4 shadow-soft ring-1 ring-forest/5 sm:p-8">
        {tab === 'Appointments' && <Appointments />}
        {tab === 'Waitlist' && <WaitlistTab />}
        {tab === 'Blocked dates' && <Blocked />}
        {tab === 'Therapists' && <TherapistsTab />}
        {tab === 'Treatments' && <TreatmentsTab />}
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent title="Reset all demo data?" description="This clears demo bookings, waitlist requests and admin-blocked dates from this browser.">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Keep data
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                store.resetDemo()
                setConfirmReset(false)
              }}
            >
              Reset demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border-2 border-dashed border-forest/10 px-6 py-12 text-center text-charcoal-soft">{children}</p>
}

function Appointments() {
  const { bookings, cancelBooking } = useDemoStore()
  if (!bookings.length)
    return (
      <Empty>
        No demo bookings yet. <Link to="/booking" className="font-semibold text-forest underline">Make one</Link> to see it here.
      </Empty>
    )
  const sorted = [...bookings].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <caption className="sr-only">Demo appointments</caption>
        <thead className="border-b border-forest/10 text-xs uppercase tracking-wider text-charcoal-soft">
          <tr>
            {['Reference', 'Date & time', 'Treatment', 'Therapist', 'Client', 'Status', ''].map((h) => (
              <th key={h} scope="col" className="px-3 py-3 font-semibold">
                {h || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-forest/5">
          {sorted.map((b) => {
            const th = therapistById(b.therapistId)
            return (
              <tr key={b.id} className="align-middle">
                <td className="px-3 py-4 font-mono text-xs font-semibold tracking-wider text-forest">
                  <Link to={`/manage-booking/${b.reference}`} className="hover:underline">
                    {b.reference}
                  </Link>
                </td>
                <td className="px-3 py-4">
                  {formatMediumDate(b.date)}
                  <span className="block text-xs text-charcoal-soft">
                    {formatTime(b.startTime)} – {formatTime(b.endTime)}
                  </span>
                </td>
                <td className="px-3 py-4">{treatmentById(b.treatmentId)?.shortName}</td>
                <td className="px-3 py-4">
                  {th && (
                    <span className="flex items-center gap-2">
                      <TherapistAvatar therapist={th} size={28} /> {fullName(th)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-4">
                  {b.client.firstName} {b.client.lastName}
                  <span className="block text-xs text-charcoal-soft">{b.client.email}</span>
                </td>
                <td className="px-3 py-4">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', b.status === 'confirmed' ? 'bg-sage-light text-forest' : 'bg-peach text-terracotta')}>{b.status}</span>
                </td>
                <td className="px-3 py-4 text-right">
                  {b.status === 'confirmed' && (
                    <Button size="sm" variant="ghost" onClick={() => cancelBooking(b.id)} aria-label={`Cancel booking ${b.reference}`}>
                      <Ban aria-hidden /> Cancel
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function WaitlistTab() {
  const { waitlist, setWaitlistStatus, removeWaitlistEntry } = useDemoStore()
  if (!waitlist.length) return <Empty>No waitlist requests yet. Submit one from the booking page.</Empty>
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {waitlist.map((w) => (
        <li key={w.id} className="rounded-3xl border border-forest/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-forest">{w.name}</p>
              <p className="truncate text-sm text-charcoal-soft">
                {w.email} · {w.phone}
              </p>
            </div>
            <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', w.status === 'waiting' ? 'bg-lavender text-forest' : 'bg-sage-light text-forest')}>{w.status}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-charcoal-soft">Treatment</dt>
              <dd className="font-medium">{treatmentById(w.preferredTreatmentId)?.shortName}</dd>
            </div>
            <div>
              <dt className="text-xs text-charcoal-soft">Therapist</dt>
              <dd className="font-medium">{w.preferredTherapistId === 'any' ? 'No preference' : fullName(therapistById(w.preferredTherapistId)!)}</dd>
            </div>
            <div>
              <dt className="text-xs text-charcoal-soft">Days</dt>
              <dd className="font-medium">{w.preferredDays.sort().map((d) => DAY[d]).join(', ')}</dd>
            </div>
            <div>
              <dt className="text-xs text-charcoal-soft">Time</dt>
              <dd className="font-medium capitalize">{w.preferredTime}</dd>
            </div>
          </dl>
          {w.message && <p className="mt-3 rounded-xl bg-ivory p-3 text-sm text-charcoal-soft">{w.message}</p>}
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="soft" onClick={() => setWaitlistStatus(w.id, w.status === 'waiting' ? 'contacted' : 'waiting')}>
              Mark {w.status === 'waiting' ? 'contacted' : 'waiting'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => removeWaitlistEntry(w.id)} aria-label={`Remove waitlist request from ${w.name}`}>
              <Trash2 aria-hidden /> Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Blocked() {
  const { adminBlocked, blockDate, unblockDate } = useDemoStore()
  const { earliest, latest } = bookingWindow()
  const [date, setDate] = useState(earliest)
  const [who, setWho] = useState<string>('all')
  const [reason, setReason] = useState('')
  const holidays = useMemo(() => {
    const y = Number(earliest.slice(0, 4))
    return [...ontarioHolidays(y), ...ontarioHolidays(y + 1)].filter((h) => h.date >= earliest && h.date <= latest)
  }, [earliest, latest])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!date) return
    blockDate(date, who, reason.trim())
    setReason('')
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl bg-ivory p-5">
        <h2 className="font-sans text-lg font-semibold">Block a date</h2>
        <Field label="Date">{(p) => <Input {...p} type="date" min={earliest} max={latest} value={date} onChange={(e) => setDate(e.target.value)} required />}</Field>
        <Field label="Applies to">
          {(p) => (
            <Select {...p} value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="all">Entire clinic</option>
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {fullName(t)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Reason" optional>
          {(p) => <Input {...p} placeholder="e.g. Staff training" value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
        <Button type="submit">
          <CalendarOff aria-hidden /> Block date
        </Button>
        <p className="text-xs text-charcoal-soft">Blocked dates immediately disappear from the booking calendar.</p>
      </form>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-sans text-lg font-semibold">Admin-blocked dates</h2>
          {adminBlocked.length ? (
            <ul className="mt-3 divide-y divide-forest/5 rounded-2xl border border-forest/10">
              {[...adminBlocked]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span>
                      <strong className="text-forest">{formatMediumDate(b.date)}</strong> · {b.therapistId === 'all' ? 'Entire clinic' : fullName(therapistById(b.therapistId)!)}
                      <span className="block text-xs text-charcoal-soft">{b.reason}</span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => unblockDate(b.id)}>
                      Unblock
                    </Button>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-charcoal-soft">None yet.</p>
          )}
        </div>
        <div>
          <h2 className="font-sans text-lg font-semibold">Ontario statutory holidays in booking window</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {holidays.map((h) => (
              <li key={h.id} className="rounded-full bg-peach px-3 py-1.5 text-xs font-medium text-forest">
                {formatMediumDate(h.date)} · {h.reason}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-charcoal-soft">Therapists also have deterministic mock “out of office” days generated automatically.</p>
        </div>
      </div>
    </div>
  )
}

function TherapistsTab() {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {therapists.map((t) => {
        const a = availabilityFor(t.id)
        return (
          <li key={t.id} className="rounded-3xl border border-forest/10 p-5">
            <div className="flex items-center gap-3">
              <TherapistAvatar therapist={t} size={48} />
              <div>
                <p className="font-semibold text-forest">{fullName(t)}</p>
                <p className="text-xs text-charcoal-soft">{t.credentials}</p>
              </div>
              <DemoBadge className="ml-auto">Fictional</DemoBadge>
            </div>
            <h3 className="mt-4 font-sans text-xs font-semibold uppercase tracking-wider text-charcoal-soft">Weekly schedule</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(a?.weekly ?? {}).map(([d, ws]) => (
                <li key={d} className="flex gap-3">
                  <span className="w-10 font-semibold text-forest">{DAY[Number(d)]}</span>
                  <span>{ws!.map((w) => `${formatTime(w.start)} – ${formatTime(w.end)}`).join(', ')}</span>
                </li>
              ))}
            </ul>
            {a?.modeDays?.['In-Home'] && <p className="mt-2 text-xs text-charcoal-soft">In-home visits: {a.modeDays['In-Home'].map((d) => DAY[d]).join(', ')}</p>}
            <p className="mt-3 text-xs text-charcoal-soft">
              Offers: {t.treatmentIds.map((id) => treatmentById(id)?.shortName).join(' · ')}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

function TreatmentsTab() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <caption className="sr-only">Treatments</caption>
        <thead className="border-b border-forest/10 text-xs uppercase tracking-wider text-charcoal-soft">
          <tr>
            <th scope="col" className="px-3 py-3">Treatment</th>
            <th scope="col" className="px-3 py-3">Duration</th>
            <th scope="col" className="px-3 py-3">Mode</th>
            <th scope="col" className="px-3 py-3">Therapists</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-forest/5">
          {treatments.map((t) => (
            <tr key={t.id}>
              <th scope="row" className="px-3 py-4 font-semibold text-forest">
                <span className="flex items-center gap-2">
                  <Stethoscope className="size-4 text-sage-dark" aria-hidden /> {t.name}
                </span>
              </th>
              <td className="px-3 py-4">{formatDuration(t.durationMinutes)}</td>
              <td className="px-3 py-4">{t.mode}</td>
              <td className="px-3 py-4">
                <span className="flex -space-x-2">
                  {therapists
                    .filter((th) => th.treatmentIds.includes(t.id))
                    .map((th) => (
                      <TherapistAvatar key={th.id} therapist={th} size={30} />
                    ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
