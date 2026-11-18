import { Link, useLocation, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarPlus, Download, Home, Info, Printer, Settings2, FileText, MessageCircleHeart, Sparkles } from 'lucide-react'
import { useDemoStore } from '@/hooks/useDemoStore'
import { treatmentById } from '@/data/treatments'
import { therapistById, fullName } from '@/data/therapists'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { Button } from '@/components/ui/button'
import { Blob, DemoBadge, Sparkle } from '@/components/ui/decor'
import { downloadICS, googleCalendarUrl } from '@/utils/calendarExport'
import { formatMediumDate } from '@/utils/time'

export default function BookingConfirmation() {
  const { reference = '' } = useParams()
  const { state } = useLocation() as { state?: { justBooked?: boolean; rescheduled?: boolean } }
  const { findBooking } = useDemoStore()
  const reduce = useReducedMotion()
  const booking = findBooking(reference)
  const treatment = treatmentById(booking?.treatmentId)
  const therapist = therapistById(booking?.therapistId)

  if (!booking || !treatment) {
    return (
      <div className="container flex flex-col items-center py-28 text-center">
        <h1 className="text-4xl">We couldn’t find that booking</h1>
        <p className="mt-3 max-w-md text-charcoal-soft">Demo bookings are stored in this browser only. If you cleared your data or used another device, the booking won’t appear here.</p>
        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link to="/booking">Book an appointment</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/manage-booking">Find a booking</Link>
          </Button>
        </div>
      </div>
    )
  }

  const cancelled = booking.status === 'cancelled'
  const heading = cancelled ? 'This booking was cancelled' : state?.rescheduled ? 'Your appointment has been rescheduled' : 'You’re all set!'

  return (
    <div className="relative overflow-hidden pb-24 pt-12 sm:pt-16">
      <Blob className="-left-48 -top-48 w-[600px] max-w-none opacity-80" fill="#DCE5DA" />
      <Blob className="-right-56 top-40 w-[520px] max-w-none opacity-70" variant={2} fill="#F4E5DA" />
      <div className="container relative">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="relative">
            {!cancelled && !reduce &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                  animate={{ opacity: [0, 1, 0], x: Math.cos((i / 6) * Math.PI * 2) * 80, y: Math.sin((i / 6) * Math.PI * 2) * 80, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.45 + i * 0.03 }}
                  aria-hidden
                >
                  <Sparkle className="size-4" color={['#A8B9A5', '#F6EBC8', '#E8CDB9'][i % 3]} />
                </motion.span>
              ))}
            <motion.div
              initial={reduce ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 15 }}
              className={`grid size-24 place-items-center rounded-full ${cancelled ? 'bg-peach' : 'bg-forest'} shadow-lift`}
            >
              <svg viewBox="0 0 52 52" className="size-12" aria-hidden>
                {cancelled ? (
                  <path d="M17 17l18 18M35 17L17 35" fill="none" stroke="#B5654A" strokeWidth="4.5" strokeLinecap="round" />
                ) : (
                  <motion.path
                    d="M14 27l8 8 16-17"
                    fill="none"
                    stroke="#FAF8F5"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                  />
                )}
              </svg>
            </motion.div>
          </div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}>
            <p className="eyebrow mt-8 justify-center">{cancelled ? 'Booking cancelled' : 'Booking confirmed'}</p>
            <h1 className="mt-3 text-balance text-4xl leading-tight sm:text-5xl">{heading}</h1>
            <p className="mt-4 text-lg text-charcoal-soft">
              {cancelled ? (
                'This time slot has been released for other families.'
              ) : (
                <>
                  Thank you, {booking.client.firstName}. We look forward to meeting {booking.client.childFirstName || 'your child'} on <strong className="text-forest">{formatMediumDate(booking.date)}</strong>.
                </>
              )}
            </p>
          </motion.div>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-soft ring-1 ring-forest/5">
            <span className="text-sm text-charcoal-soft">Demo booking reference</span>
            <span className="font-mono text-lg font-bold tracking-[0.15em] text-forest" data-testid="booking-reference">
              {booking.reference}
            </span>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <BookingSummary
              treatment={treatment}
              therapist={therapist}
              date={booking.date}
              time={booking.startTime}
              endTime={booking.endTime}
              guardianName={`${booking.client.firstName} ${booking.client.lastName}`}
              title={cancelled ? 'Cancelled appointment' : 'Confirmed appointment'}
            />
          </motion.div>

          <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="flex flex-col gap-6">
            {!cancelled && (
              <div className="no-print rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-forest/5 sm:p-7">
                <h2 className="font-sans text-lg font-semibold">Add to your calendar</h2>
                <div className="mt-4 grid gap-2.5">
                  <Button asChild variant="secondary" className="justify-start">
                    <a href={googleCalendarUrl(booking)} target="_blank" rel="noreferrer">
                      <CalendarPlus aria-hidden /> Google Calendar
                    </a>
                  </Button>
                  <Button variant="secondary" className="justify-start" onClick={() => downloadICS(booking)}>
                    <Download aria-hidden /> Apple / Outlook (.ics)
                  </Button>
                  <Button variant="secondary" className="justify-start" onClick={() => window.print()}>
                    <Printer aria-hidden /> Print confirmation
                  </Button>
                </div>
              </div>
            )}

            {!cancelled && (
              <div className="rounded-[2rem] bg-sage-light p-6 sm:p-7">
                <h2 className="font-sans text-lg font-semibold">What happens next</h2>
                <ul className="mt-4 space-y-4 text-sm leading-relaxed text-charcoal">
                  <li className="flex gap-3">
                    <FileText className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />A short intake form would be emailed to you 48 hours before your visit.
                  </li>
                  <li className="flex gap-3">
                    <MessageCircleHeart className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
                    {therapist ? `${therapist.firstName} would` : 'Your therapist would'} review your notes and prepare playful activities for {booking.client.childFirstName || 'your child'}.
                  </li>
                  <li className="flex gap-3">
                    <Sparkles className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
                    {treatment.mode === 'Virtual' ? 'A secure video link would arrive the day before.' : treatment.mode === 'In-Home' ? 'Your therapist would call to confirm your address and parking.' : 'Arrive 10 minutes early — free parking is available on site.'}
                  </li>
                </ul>
              </div>
            )}

            <div className="flex gap-3 rounded-2xl bg-butter/70 p-4 text-sm text-[#5a4b17]">
              <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
              <p>
                <DemoBadge className="mr-1 bg-white/70" /> This appointment is a demonstration. No real clinic booking or email notification has been created. It is saved in this browser only.
              </p>
            </div>

            <div className="no-print flex flex-wrap gap-3">
              <Button asChild>
                <Link to={`/manage-booking/${booking.reference}`}>
                  <Settings2 aria-hidden /> Manage booking
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">
                  <Home aria-hidden /> Back to home
                </Link>
              </Button>
            </div>
            {therapist && <p className="text-xs text-charcoal-soft">Therapist: {fullName(therapist)} (fictional demo profile)</p>}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
