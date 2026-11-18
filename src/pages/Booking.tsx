import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { startOfMonth } from 'date-fns'
import { AlertTriangle, ArrowDown, CalendarSearch, Check, ChevronDown, Globe2, Loader2, Lock, MousePointerClick, PencilLine, Sparkles, Users } from 'lucide-react'
import type { ClientDetails, ISODate, TimeSlot, Treatment } from '@/types'
import { treatments, treatmentById } from '@/data/treatments'
import { therapists, therapistById, fullName } from '@/data/therapists'
import { useDemoStore } from '@/hooks/useDemoStore'
import { bookingWindow, nextAvailable, pickTherapist, slotsFor, dayStatus, therapistsFor } from '@/utils/scheduling'
import { clinicToday, formatLongDate, formatMediumDate, formatTime, fromISODate } from '@/utils/time'
import { Calendar } from '@/components/booking/Calendar'
import { TimeSlots } from '@/components/booking/TimeSlots'
import { StepIndicator } from '@/components/booking/StepIndicator'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { ClientForm } from '@/components/booking/ClientForm'
import { WaitlistCard } from '@/components/booking/WaitlistCard'
import { DurationChip, ModeChip, modeIcon } from '@/components/services/ServiceCard'
import { TherapistAvatar } from '@/components/therapists/TherapistCard'
import { Button } from '@/components/ui/button'
import { Blob, DemoBadge, accentBg } from '@/components/ui/decor'
import { cn } from '@/lib/utils'

type Stage = 'select' | 'details' | 'review'
interface ChosenSlot {
  time: string
  endTime: string
  therapistId: string
}

const emptyClient = (mode: ClientDetails['sessionMode']): ClientDetails => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  childFirstName: '',
  clientType: 'new',
  sessionMode: mode,
  message: '',
  consent: false,
})

export default function Booking() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { scheduleContext, createBooking } = useDemoStore()
  const today = clinicToday()
  const { earliest, latest } = bookingWindow(today)

  const treatment = treatmentById(params.get('treatment'))
  const therapistParam = params.get('therapist')
  const therapistSel: string | 'any' = therapistParam && therapistById(therapistParam) ? therapistParam : 'any'
  const selectedTherapist = therapistById(therapistSel)

  const [stage, setStage] = useState<Stage>('select')
  const [month, setMonth] = useState(() => startOfMonth(fromISODate(earliest)))
  const [date, setDate] = useState<ISODate | null>(null)
  const [slot, setSlot] = useState<ChosenSlot | null>(null)
  const [client, setClient] = useState<ClientDetails>(() => emptyClient(treatment?.mode ?? 'In-Clinic'))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  const ctx = useMemo(() => ({ ...scheduleContext, today }), [scheduleContext, today])

  // When treatment or therapist changes: jump to the first available date.
  useEffect(() => {
    setSlot(null)
    if (!treatment) {
      setDate(null)
      return
    }
    const first = nextAvailable(treatment, therapistSel, ctx)
    if (first) {
      setDate(first.date)
      setMonth(startOfMonth(fromISODate(first.date)))
    } else setDate(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treatment?.id, therapistSel])

  const getStatus = useCallback((d: ISODate) => (treatment ? dayStatus(treatment, therapistSel, d, ctx) : ({ kind: 'closed' } as const)), [treatment, therapistSel, ctx])
  const slots = useMemo(() => (treatment && date ? slotsFor(treatment, therapistSel, date, ctx) : []), [treatment, therapistSel, date, ctx])
  const next = useMemo(() => (treatment ? nextAvailable(treatment, therapistSel, ctx) : null), [treatment, therapistSel, ctx])

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })

  const chooseTreatment = (t: Treatment) => {
    const keepTherapist = selectedTherapist && selectedTherapist.treatmentIds.includes(t.id)
    updateParams({ treatment: t.id, therapist: keepTherapist ? therapistSel : null })
    setClient((c) => ({ ...c, sessionMode: t.mode }))
    setError(null)
  }
  const chooseTherapist = (id: string | 'any') => {
    updateParams({ therapist: id === 'any' ? null : id })
    setError(null)
  }
  const chooseSlot = (s: TimeSlot) => {
    if (!treatment || !date) return
    const therapistId = s.therapistIds.length === 1 ? s.therapistIds[0] : pickTherapist(s, date, ctx)
    setSlot({ time: s.time, endTime: s.endTime, therapistId })
    setError(null)
    setStage('details')
    requestAnimationFrame(scrollTop)
  }

  const confirm = async () => {
    if (!treatment || !date || !slot) return
    setSubmitting(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 900)) // gentle "processing" moment for the demo
    const res = createBooking({ treatmentId: treatment.id, therapistId: slot.therapistId, date, startTime: slot.time, client })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    navigate(`/booking/confirmation/${res.value.reference}`, { state: { justBooked: true } })
  }

  const currentStep = stage === 'review' ? 4 : stage === 'details' ? 3 : !treatment ? 0 : 2
  const onStepClick = (i: number) => {
    if (i <= 2) {
      setStage('select')
      requestAnimationFrame(() => scrollTo(i === 0 ? 'step-treatment' : i === 1 ? 'step-therapist' : 'step-date'))
    } else if (i === 3) setStage('details')
  }

  const slotTherapist = therapistById(slot?.therapistId)

  return (
    <div className="relative overflow-hidden pb-24">
      <Blob className="-right-60 -top-72 w-[760px] max-w-none opacity-80" fill="#F4E5DA" />
      <Blob className="-left-60 top-[40rem] w-[520px] max-w-none opacity-50" variant={1} fill="#E9E3F1" />

      {/* Header */}
      <div className="container relative pt-10 sm:pt-14" ref={topRef} style={{ scrollMarginTop: 96 }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Online booking</span>
            <h1 className="mt-3 text-[2.5rem] leading-[1.05] sm:text-6xl">Book an Appointment</h1>
            <p className="mt-4 max-w-xl text-lg text-charcoal-soft">Choose a treatment, pick your therapist and find a time that suits your family.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 font-medium text-forest shadow-soft">
              <Globe2 className="size-4 text-sage-dark" aria-hidden /> Times shown in Eastern Time (Toronto)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-butter px-3.5 py-2 font-medium text-[#5a4b17]">
              <Lock className="size-4" aria-hidden /> Demo — no real booking is created
            </span>
          </div>
        </div>
        <div className="mt-8 rounded-3xl bg-white/80 px-5 py-4 shadow-soft ring-1 ring-forest/5 backdrop-blur sm:px-6">
          <StepIndicator current={currentStep} onStepClick={onStepClick} />
        </div>
      </div>

      <div className="container relative mt-8">
        <AnimatePresence mode="wait" initial={false}>
          {stage === 'select' && (
            <motion.div
              key="select"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="grid gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] xl:gap-10"
            >
              {/* LEFT: therapist + treatment */}
              <div className="flex min-w-0 flex-col gap-8">
                <AnimatePresence initial={false}>
                  {selectedTherapist && (
                    <motion.div key={selectedTherapist.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }}>
                      <TherapistSpotlight therapistId={selectedTherapist.id} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <section id="step-treatment" aria-labelledby="h-treatment" className="scroll-mt-28">
                  <StepTitle n={1} id="h-treatment" title="Select a treatment" done={Boolean(treatment)} />
                  <div role="radiogroup" aria-labelledby="h-treatment" className="mt-4 flex flex-col gap-3">
                    {treatments.map((t) => (
                      <TreatmentOption
                        key={t.id}
                        treatment={t}
                        selected={treatment?.id === t.id}
                        notOfferedBy={selectedTherapist && !selectedTherapist.treatmentIds.includes(t.id) ? selectedTherapist.firstName : undefined}
                        onSelect={() => chooseTreatment(t)}
                      />
                    ))}
                  </div>
                </section>

                <section id="step-therapist" aria-labelledby="h-therapist" className="scroll-mt-28">
                  <StepTitle n={2} id="h-therapist" title="Select a therapist" done={Boolean(treatment)} />
                  <TherapistOptions treatment={treatment} selection={therapistSel} onSelect={chooseTherapist} ctx={ctx} />
                </section>

                <WaitlistCard treatmentId={treatment?.id} therapistId={therapistSel} className="hidden lg:block" />
              </div>

              {/* RIGHT: calendar + times */}
              <div className="min-w-0">
                <div className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-forest/5 sm:p-8 lg:sticky lg:top-28">
                  <section id="step-date" aria-labelledby="h-date" className="scroll-mt-28">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <StepTitle n={3} id="h-date" title="Choose a date" done={Boolean(date)} />
                      {next && (
                        <button
                          type="button"
                          onClick={() => {
                            setDate(next.date)
                            setMonth(startOfMonth(fromISODate(next.date)))
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-sage-light px-3.5 py-2 text-sm font-semibold text-forest transition-colors hover:bg-sage/60"
                        >
                          <Sparkles className="size-4" aria-hidden /> Next available: {formatMediumDate(next.date)}
                        </button>
                      )}
                    </div>

                    {treatment ? (
                      <div className="mt-6">
                        <div className="mb-5 flex flex-wrap gap-2">
                          <DurationChip minutes={treatment.durationMinutes} className="bg-sage-light/60 ring-0" />
                          <ModeChip mode={treatment.mode} className="bg-sage-light/60 ring-0" />
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-light/60 px-3 py-1 text-xs font-semibold text-forest">
                            <Users className="size-3.5" aria-hidden /> {selectedTherapist ? fullName(selectedTherapist) : 'Any available therapist'}
                          </span>
                        </div>
                        <Calendar month={month} onMonthChange={setMonth} selected={date} onSelect={setDate} getStatus={getStatus} minDate={earliest} maxDate={latest} today={today} />
                      </div>
                    ) : (
                      <EmptyCalendar />
                    )}
                  </section>

                  <div className="my-8 h-px bg-forest/10" />

                  <section id="step-time" aria-labelledby="h-time" className="scroll-mt-28" aria-live="polite">
                    <StepTitle n={4} id="h-time" title={date && treatment ? `Available times · ${formatLongDate(date)}` : 'Choose a time'} done={false} />
                    <div className="mt-5">
                      {!treatment ? (
                        <p className="flex items-center gap-3 rounded-2xl bg-ivory px-5 py-4 text-charcoal-soft">
                          <MousePointerClick className="size-5 shrink-0 text-sage-dark" aria-hidden />
                          Select a treatment to view available appointment times.
                        </p>
                      ) : !date ? (
                        <p className="rounded-2xl bg-ivory px-5 py-4 text-charcoal-soft">
                          {next ? 'Choose a highlighted date to see available times.' : 'No openings in the next few weeks. Please join our waitlist and we’ll be in touch.'}
                        </p>
                      ) : slots.length === 0 ? (
                        <p className="rounded-2xl bg-ivory px-5 py-4 text-charcoal-soft">No times are available on this date. Please choose another highlighted date.</p>
                      ) : (
                        <motion.div key={`${date}-${therapistSel}-${treatment.id}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
                          <TimeSlots slots={slots} onSelect={chooseSlot} showTherapists={therapistSel === 'any'} />
                          {treatment.durationMinutes > 60 && (
                            <p className="mt-5 text-xs text-charcoal-soft">Only times with a full {treatment.durationMinutes / 60}-hour window are shown for this extended assessment.</p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </section>
                </div>
                <WaitlistCard treatmentId={treatment?.id} therapistId={therapistSel} className="mt-8 lg:hidden" />
              </div>

              {/* Mobile sticky helper */}
              <MobileBar
                label={!treatment ? 'Start by choosing a treatment' : `${treatment.shortName}${date ? ` · ${formatMediumDate(date)}` : ''}`}
                action={!treatment ? 'Choose treatment' : !date ? 'Choose a date' : 'See times'}
                onClick={() => scrollTo(!treatment ? 'step-treatment' : !date ? 'step-date' : 'step-time')}
              />
            </motion.div>
          )}

          {stage === 'details' && treatment && date && slot && (
            <motion.div
              key="details"
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
              className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]"
            >
              <div className="order-2 rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-forest/5 sm:p-10 lg:order-1">
                <h2 className="text-3xl sm:text-4xl">Your details</h2>
                <p className="mt-2 text-charcoal-soft">Almost there! Tell us a little about who we’ll be meeting.</p>
                <div className="mt-8">
                  <ClientForm
                    initial={client}
                    mode={treatment.mode}
                    onBack={() => setStage('select')}
                    onSubmit={(c) => {
                      setClient(c)
                      setStage('review')
                      requestAnimationFrame(scrollTop)
                    }}
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="lg:sticky lg:top-28">
                  <BookingSummary treatment={treatment} therapist={slotTherapist} date={date} time={slot.time} endTime={slot.endTime}>
                    <div className="border-t border-forest/10 px-6 py-4 sm:px-7">
                      <Button variant="ghost" size="sm" onClick={() => setStage('select')}>
                        <PencilLine aria-hidden /> Change date or time
                      </Button>
                    </div>
                  </BookingSummary>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'review' && treatment && date && slot && (
            <motion.div
              key="review"
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
              className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
            >
              <BookingSummary treatment={treatment} therapist={slotTherapist} date={date} time={slot.time} endTime={slot.endTime} guardianName={`${client.firstName} ${client.lastName}`} title="Review your appointment" />
              <div className="flex flex-col gap-6 rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-forest/5 sm:p-8">
                <div>
                  <h2 className="text-3xl">Confirm your booking</h2>
                  <p className="mt-2 text-charcoal-soft">Please check everything looks right.</p>
                </div>
                <dl className="grid gap-4 rounded-2xl bg-ivory p-5 text-sm sm:grid-cols-2">
                  {[
                    ['Parent / Guardian', `${client.firstName} ${client.lastName}`],
                    ['Email', client.email],
                    ['Phone', client.phone],
                    ['Child', client.childFirstName || '—'],
                    ['Client type', client.clientType === 'new' ? 'New client' : 'Returning client'],
                    ['Session type', treatment.mode],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">{k}</dt>
                      <dd className="mt-0.5 break-words font-semibold text-forest">{v}</dd>
                    </div>
                  ))}
                  {client.message && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">Message</dt>
                      <dd className="mt-0.5 text-charcoal">{client.message}</dd>
                    </div>
                  )}
                </dl>
                <Button variant="link" size="sm" className="self-start" onClick={() => setStage('details')}>
                  <PencilLine aria-hidden /> Edit details
                </Button>

                <div className="flex gap-3 rounded-2xl bg-butter/70 p-4 text-sm text-[#5a4b17]">
                  <DemoBadge className="h-fit bg-white/70" />
                  <p>This is a demonstration. No real clinic booking, payment or email notification will be created.</p>
                </div>

                {error && (
                  <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-4 text-sm text-terracotta">
                    <p className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="size-4" aria-hidden /> {error}
                    </p>
                    <Button variant="secondary" size="sm" className="self-start" onClick={() => setStage('select')}>
                      Choose another time
                    </Button>
                  </div>
                )}

                <div className="mt-auto flex flex-col-reverse gap-3 border-t border-forest/10 pt-6 sm:flex-row sm:justify-between">
                  <Button variant="ghost" onClick={() => setStage('details')}>
                    Back
                  </Button>
                  <Button size="lg" onClick={confirm} disabled={submitting} aria-live="polite">
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden /> Confirming…
                      </>
                    ) : (
                      <>
                        <Check aria-hidden /> Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-center text-xs text-charcoal-soft">
                  {formatLongDate(date)} at {formatTime(slot.time)} with {slotTherapist ? fullName(slotTherapist) : 'your therapist'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ───────────── sub-components ───────────── */

function StepTitle({ n, id, title, done }: { n: number; id: string; title: string; done: boolean }) {
  return (
    <h2 id={id} className="flex items-center gap-3 font-sans text-lg font-semibold text-forest sm:text-xl">
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-sm transition-colors', done ? 'bg-forest text-ivory' : 'bg-sage-light text-forest')}>
        {done ? <Check className="size-4" aria-hidden /> : n}
      </span>
      <span>
        <span className="sr-only">Step {n}: </span>
        {title}
      </span>
    </h2>
  )
}

function TreatmentOption({ treatment, selected, onSelect, notOfferedBy }: { treatment: Treatment; selected: boolean; onSelect: () => void; notOfferedBy?: string }) {
  const [open, setOpen] = useState(false)
  const Icon = modeIcon[treatment.mode]
  return (
    <div
      className={cn(
        'relative rounded-3xl border bg-white transition-all duration-300',
        selected ? 'border-forest shadow-soft ring-4 ring-sage/30' : 'border-forest/10 hover:border-forest/30 hover:shadow-soft',
      )}
    >
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className="flex w-full items-start gap-4 rounded-3xl p-5 text-left">
        <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl text-forest', accentBg[treatment.accent])}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug text-forest">{treatment.name}</span>
          <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-charcoal-soft">
            <span>{treatment.durationMinutes} min</span>
            <span aria-hidden>·</span>
            <span>{treatment.mode === 'Virtual' ? 'Virtual' : treatment.mode}</span>
          </span>
          <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-charcoal-soft">{treatment.shortDescription}</span>
          {notOfferedBy && <span className="mt-2 block text-xs font-medium text-terracotta">Not offered by {notOfferedBy} — we’ll show therapists who do.</span>}
        </span>
        <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all', selected ? 'border-forest bg-forest text-ivory' : 'border-forest/25')} aria-hidden>
          {selected && <Check className="size-3.5" />}
        </span>
      </button>
      <div className="px-5 pb-4 pl-[5.25rem]">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
          {open ? 'Show less' : 'Read more'}
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <p className="pt-3 text-sm leading-relaxed text-charcoal-soft">{treatment.description[0]}</p>
              <ul className="mt-3 grid gap-1.5 text-sm text-forest">
                {treatment.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2">
                    <Check className="size-4 text-sage-dark" aria-hidden /> {h}
                  </li>
                ))}
              </ul>
              <Link to={`/services/${treatment.slug}`} className="mt-3 inline-block text-sm font-semibold text-forest-light underline underline-offset-4">
                Full service details
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TherapistOptions({ treatment, selection, onSelect, ctx }: { treatment?: Treatment; selection: string | 'any'; onSelect: (id: string | 'any') => void; ctx: Parameters<typeof nextAvailable>[2] }) {
  const list = treatment ? therapistsFor(treatment) : therapists
  const nextFor = (id: string) => (treatment ? nextAvailable(treatment, id, ctx) : null)
  return (
    <div role="radiogroup" aria-labelledby="h-therapist" className="mt-4 grid gap-2.5">
      <OptionRow selected={selection === 'any'} onClick={() => onSelect('any')}>
        <span className="flex -space-x-3">
          {list.slice(0, 3).map((t) => (
            <TherapistAvatar key={t.id} therapist={t} size={40} />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-forest">Any available therapist</span>
          <span className="block text-xs text-charcoal-soft">See the most appointment options</span>
        </span>
      </OptionRow>
      {list.map((t) => {
        const n = nextFor(t.id)
        return (
          <OptionRow key={t.id} selected={selection === t.id} onClick={() => onSelect(t.id)}>
            <TherapistAvatar therapist={t} size={44} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-forest">{fullName(t)}</span>
              <span className="block truncate text-xs text-charcoal-soft">{t.credentials}</span>
            </span>
            {treatment && (
              <span className="hidden shrink-0 text-right text-xs min-[400px]:block">
                <span className="block text-charcoal-soft">Next</span>
                <span className="font-semibold text-forest">{n ? formatMediumDate(n.date) : 'Waitlist'}</span>
              </span>
            )}
          </OptionRow>
        )
      })}
      {!treatment && <p className="px-1 text-xs text-charcoal-soft">Tip: choose a treatment first to see each therapist’s next opening.</p>}
    </div>
  )
}

function OptionRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-2xl border bg-white px-4 py-3 text-left transition-all duration-200',
        selected ? 'border-forest bg-sage-light/40 ring-4 ring-sage/30' : 'border-forest/10 hover:border-forest/30',
      )}
    >
      {children}
      <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border-2', selected ? 'border-forest bg-forest' : 'border-forest/25')} aria-hidden>
        {selected && <span className="size-1.5 rounded-full bg-ivory" />}
      </span>
    </button>
  )
}

function TherapistSpotlight({ therapistId }: { therapistId: string }) {
  const t = therapistById(therapistId)!
  const [more, setMore] = useState(false)
  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-soft ring-1 ring-forest/5" aria-label={`About ${fullName(t)}`}>
      <div className={cn('relative flex items-end gap-4 p-5 pb-0', accentBg[t.accent])}>
        <img src={t.image} alt={`Portrait for ${fullName(t)} (stock photo, demo profile)`} className="h-36 w-28 rounded-t-2xl object-cover object-top" />
        <div className="pb-5">
          <DemoBadge className="bg-white/80">Demo profile</DemoBadge>
          <h2 className="mt-2 text-2xl leading-tight">{fullName(t)}</h2>
          <p className="text-sm font-medium text-forest-light">{t.credentials}</p>
          <p className="text-xs text-charcoal-soft">{t.title}</p>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-charcoal-soft">{more ? t.bio.join(' ') : t.shortBio}</p>
        <button type="button" onClick={() => setMore((v) => !v)} className="mt-2 text-sm font-semibold text-forest underline underline-offset-4" aria-expanded={more}>
          {more ? 'Show less' : 'Read full bio'}
        </button>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Specializations">
          {t.specializations.slice(0, 4).map((s) => (
            <li key={s} className="rounded-full bg-ivory px-3 py-1 text-xs font-medium text-forest ring-1 ring-forest/10">
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-charcoal-soft">
          <strong className="text-forest">Languages:</strong> {t.languages.join(', ')} · <strong className="text-forest">Ages:</strong> {t.ageGroups}
        </p>
      </div>
    </article>
  )
}

function EmptyCalendar() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-3xl border-2 border-dashed border-forest/10 bg-ivory/60 px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-white text-forest shadow-soft">
        <CalendarSearch className="size-7" aria-hidden />
      </span>
      <p className="mt-5 font-serif text-2xl text-forest">Your calendar is waiting</p>
      <p className="mt-2 max-w-xs text-charcoal-soft">Select a treatment to view available appointment times.</p>
      <a href="#step-treatment" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest lg:hidden">
        Choose a treatment <ArrowDown className="size-4" aria-hidden />
      </a>
    </div>
  )
}

function MobileBar({ label, action, onClick }: { label: string; action: string; onClick: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-forest/10 bg-ivory/95 px-4 py-3 backdrop-blur-lg lg:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-forest">{label}</p>
        <Button size="sm" onClick={onClick} className="shrink-0">
          {action} <ArrowDown aria-hidden />
        </Button>
      </div>
    </div>
  )
}
