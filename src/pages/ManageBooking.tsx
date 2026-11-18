import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { startOfMonth } from 'date-fns'
import { ArrowLeft, CalendarClock, CalendarX2, ChevronRight, Search, X } from 'lucide-react'
import type { Booking, ISODate, TimeSlot } from '@/types'
import { useDemoStore } from '@/hooks/useDemoStore'
import { treatmentById } from '@/data/treatments'
import { therapistById, fullName } from '@/data/therapists'
import { PageHero } from '@/components/layout/PageHero'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { Calendar } from '@/components/booking/Calendar'
import { TimeSlots } from '@/components/booking/TimeSlots'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DemoBadge } from '@/components/ui/decor'
import { bookingWindow, dayStatus, nextAvailable, slotsFor } from '@/utils/scheduling'
import { clinicToday, formatLongDate, formatMediumDate, formatTime, fromISODate } from '@/utils/time'
import { cn } from '@/lib/utils'

export default function ManageBooking() {
  const { reference } = useParams()
  const { bookings, findBooking } = useDemoStore()
  const navigate = useNavigate()
  const booking = reference ? findBooking(reference) : undefined

  if (reference && booking) return <BookingManager booking={booking} />

  return (
    <>
      <PageHero
        eyebrow="Manage booking"
        title="View, reschedule or cancel"
        intro="Look up a demo booking with its reference, or choose from bookings made in this browser."
        crumbs={[{ to: '/', label: 'Home' }, { label: 'Manage Booking' }]}
        tone="sage"
      />
      <section className="container grid gap-10 pb-24 lg:grid-cols-[0.9fr_1.1fr]">
        <Lookup notFound={Boolean(reference && !booking)} onFound={(ref) => navigate(`/manage-booking/${ref}`)} findBooking={findBooking} />
        <div>
          <h2 className="font-sans text-lg font-semibold">Bookings on this device</h2>
          {bookings.length === 0 ? (
            <div className="mt-4 rounded-[2rem] border-2 border-dashed border-forest/10 p-10 text-center">
              <p className="text-charcoal-soft">No demo bookings yet.</p>
              <Button asChild className="mt-5">
                <Link to="/booking">Book an appointment</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3">
              {[...bookings]
                .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
                .map((b) => (
                  <li key={b.id}>
                    <BookingRow booking={b} />
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}

function BookingRow({ booking }: { booking: Booking }) {
  const t = treatmentById(booking.treatmentId)
  const th = therapistById(booking.therapistId)
  return (
    <Link to={`/manage-booking/${booking.reference}`} className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-forest/5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sage-light text-center leading-none text-forest">
        <span className="text-[0.65rem] font-semibold uppercase">{formatMediumDate(booking.date).split(',')[0]}</span>
        <span className="font-serif text-xl">{booking.date.slice(8)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-forest">{t?.name}</p>
        <p className="truncate text-sm text-charcoal-soft">
          {formatMediumDate(booking.date)} · {formatTime(booking.startTime)} · {th ? fullName(th) : ''}
        </p>
        <p className="mt-1 font-mono text-xs tracking-wider text-charcoal-soft">{booking.reference}</p>
      </div>
      <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', booking.status === 'confirmed' ? 'bg-sage-light text-forest' : 'bg-peach text-terracotta')}>
        {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
      </span>
      <ChevronRight className="hidden size-5 text-forest transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
    </Link>
  )
}

function Lookup({ onFound, findBooking, notFound }: { onFound: (ref: string) => void; findBooking: (r: string) => Booking | undefined; notFound: boolean }) {
  const [ref, setRef] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(notFound ? 'We couldn’t find a booking with that reference in this browser.' : '')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const b = findBooking(ref)
    if (!b) return setError('We couldn’t find a booking with that reference in this browser.')
    if (b.client.email.toLowerCase() !== email.trim().toLowerCase()) return setError('The email doesn’t match this booking.')
    onFound(b.reference)
  }
  return (
    <form onSubmit={submit} noValidate className="h-fit rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-forest/5 sm:p-8">
      <h2 className="text-3xl">Find your booking</h2>
      <p className="mt-2 text-sm text-charcoal-soft">Enter the reference from your confirmation and the email you used.</p>
      <div className="mt-6 grid gap-5">
        <Field label="Booking reference" error={error && !ref ? 'Please enter your reference.' : undefined}>
          {(p) => <Input {...p} placeholder="MSP-XXXXXX" className="font-mono uppercase tracking-wider" value={ref} onChange={(e) => setRef(e.target.value)} />}
        </Field>
        <Field label="Email address">
          {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        {error && ref && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            {error}
          </p>
        )}
        <Button type="submit">
          <Search aria-hidden /> Find booking
        </Button>
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-charcoal-soft">
        <DemoBadge /> Not secure — for demonstration only.
      </p>
    </form>
  )
}

function BookingManager({ booking }: { booking: Booking }) {
  const { cancelBooking, rescheduleBooking, scheduleContext } = useDemoStore()
  const navigate = useNavigate()
  const treatment = treatmentById(booking.treatmentId)!
  const therapist = therapistById(booking.therapistId)
  const [mode, setMode] = useState<'view' | 'reschedule'>('view')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const today = clinicToday()
  const { earliest, latest } = bookingWindow(today)
  const ctx = useMemo(() => ({ ...scheduleContext, today, excludeBookingId: booking.id }), [scheduleContext, today, booking.id])
  const [month, setMonth] = useState(() => startOfMonth(fromISODate(booking.date >= earliest ? booking.date : earliest)))
  const [date, setDate] = useState<ISODate | null>(null)
  const [newSlot, setNewSlot] = useState<TimeSlot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getStatus = useCallback((d: ISODate) => dayStatus(treatment, booking.therapistId, d, ctx), [treatment, booking.therapistId, ctx])
  const slots = useMemo(() => (date ? slotsFor(treatment, booking.therapistId, date, ctx) : []), [date, treatment, booking.therapistId, ctx])

  const startReschedule = () => {
    const n = nextAvailable(treatment, booking.therapistId, ctx)
    setDate(n?.date ?? null)
    if (n) setMonth(startOfMonth(fromISODate(n.date)))
    setNewSlot(null)
    setError(null)
    setMode('reschedule')
  }

  const saveReschedule = () => {
    if (!date || !newSlot) return
    const res = rescheduleBooking(booking.id, { date, startTime: newSlot.time })
    if (!res.ok) return setError(res.error)
    navigate(`/booking/confirmation/${booking.reference}`, { state: { rescheduled: true } })
  }

  const cancelled = booking.status === 'cancelled'

  return (
    <div className="container pb-24 pt-10 sm:pt-14">
      <Link to="/manage-booking" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All bookings
      </Link>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Manage booking</span>
          <h1 className="mt-3 text-4xl sm:text-5xl">{mode === 'reschedule' ? 'Choose a new time' : 'Your appointment'}</h1>
        </div>
        <span className={cn('w-fit rounded-full px-4 py-1.5 text-sm font-semibold', cancelled ? 'bg-peach text-terracotta' : 'bg-sage-light text-forest')}>
          {cancelled ? 'Cancelled' : 'Confirmed'}
        </span>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
        <BookingSummary
          treatment={treatment}
          therapist={therapist}
          date={booking.date}
          time={booking.startTime}
          endTime={booking.endTime}
          reference={booking.reference}
          guardianName={`${booking.client.firstName} ${booking.client.lastName}`}
          title={mode === 'reschedule' ? 'Current appointment' : 'Appointment details'}
          className="h-fit"
        />

        <AnimatePresence mode="wait">
          {mode === 'view' ? (
            <motion.div key="view" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
              {!cancelled ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ActionCard icon={CalendarClock} title="Reschedule" body="Pick a new date and time with the same therapist. Your current slot will be released." onClick={startReschedule} cta="Choose a new time" />
                  <ActionCard icon={CalendarX2} title="Cancel appointment" body="Release this time so another family can use it. We kindly ask for 24 hours’ notice." onClick={() => setConfirmCancel(true)} cta="Cancel booking" danger />
                </div>
              ) : (
                <div className="rounded-[2rem] bg-peach p-7">
                  <h2 className="text-2xl">This booking has been cancelled</h2>
                  <p className="mt-2 text-charcoal-soft">The time slot has been released. Would you like to book a new appointment?</p>
                  <Button asChild className="mt-5">
                    <Link to={`/booking?treatment=${treatment.id}&therapist=${booking.therapistId}`}>Book again</Link>
                  </Button>
                </div>
              )}
              <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-forest/5 sm:p-7">
                <h2 className="font-sans text-lg font-semibold">Booking history</h2>
                <ol className="mt-4 space-y-3 border-l-2 border-sage-light pl-5">
                  {booking.history.map((h, i) => (
                    <li key={i} className="relative text-sm">
                      <span className="absolute -left-[27px] top-1 size-3 rounded-full bg-forest ring-4 ring-white" aria-hidden />
                      <span className="font-semibold capitalize text-forest">{h.action}</span>
                      <span className="text-charcoal-soft"> · {new Date(h.at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {h.note && <p className="text-xs text-charcoal-soft">{h.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
              <p className="flex items-center gap-2 text-xs text-charcoal-soft">
                <DemoBadge /> Changes are saved in this browser only.
              </p>
            </motion.div>
          ) : (
            <motion.div key="reschedule" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-forest/5 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-charcoal-soft">
                  Showing availability for <strong className="text-forest">{therapist ? fullName(therapist) : 'your therapist'}</strong> · {treatment.name}
                </p>
                <button type="button" onClick={() => setMode('view')} className="rounded-full p-2 text-forest hover:bg-forest/5" aria-label="Cancel rescheduling">
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-6">
                <Calendar
                  month={month}
                  onMonthChange={setMonth}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d)
                    setNewSlot(null)
                  }}
                  getStatus={getStatus}
                  minDate={earliest}
                  maxDate={latest}
                  today={today}
                />
              </div>
              <div className="my-7 h-px bg-forest/10" />
              <h2 className="font-sans text-lg font-semibold">{date ? `Available times · ${formatLongDate(date)}` : 'Choose a date'}</h2>
              <div className="mt-4" aria-live="polite">
                {date && slots.length > 0 ? (
                  <TimeSlots slots={slots} selected={newSlot?.time} onSelect={setNewSlot} />
                ) : (
                  <p className="rounded-2xl bg-ivory px-5 py-4 text-charcoal-soft">{date ? 'No times on this date.' : 'Select a highlighted date.'}</p>
                )}
              </div>
              {error && (
                <p role="alert" className="mt-4 text-sm font-medium text-terracotta">
                  {error}
                </p>
              )}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-forest/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" onClick={() => setMode('view')}>
                  Keep current time
                </Button>
                <Button size="lg" disabled={!newSlot} onClick={saveReschedule}>
                  {newSlot && date ? `Move to ${formatMediumDate(date)}, ${formatTime(newSlot.time)}` : 'Select a new time'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent title="Cancel this appointment?" description={`${treatment.name} on ${formatLongDate(booking.date)} at ${formatTime(booking.startTime)}.`}>
          <p className="text-charcoal-soft">The time slot will be released and become available to other families. This can’t be undone, but you can always book again.</p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              Keep appointment
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                cancelBooking(booking.id)
                setConfirmCancel(false)
              }}
            >
              Yes, cancel booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ActionCard({ icon: Icon, title, body, cta, onClick, danger }: { icon: typeof X; title: string; body: string; cta: string; onClick: () => void; danger?: boolean }) {
  return (
    <div className={cn('flex flex-col rounded-[2rem] p-6 sm:p-7', danger ? 'bg-peach' : 'bg-sage-light')}>
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-forest shadow-soft">
        <Icon className="size-5" aria-hidden />
      </span>
      <h2 className="mt-5 text-2xl">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal-soft">{body}</p>
      <Button variant={danger ? 'secondary' : 'primary'} className="mt-5 self-start" onClick={onClick}>
        {cta}
      </Button>
    </div>
  )
}
