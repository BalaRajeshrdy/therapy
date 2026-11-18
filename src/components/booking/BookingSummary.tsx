import type { ReactNode } from 'react'
import { CalendarDays, Clock, MapPin, UserRound, Stethoscope, Hash } from 'lucide-react'
import type { ISODate, SessionMode, Therapist, Treatment } from '@/types'
import { TherapistAvatar } from '@/components/therapists/TherapistCard'
import { modeIcon, modeLabel } from '@/components/services/ServiceCard'
import { fullName } from '@/data/therapists'
import { fullAddress } from '@/data/clinic'
import { formatDuration, formatLongDate, formatTime } from '@/utils/time'
import { cn } from '@/lib/utils'

export function locationFor(mode: SessionMode) {
  if (mode === 'Virtual') return 'Secure video link sent before your session'
  if (mode === 'In-Home') return 'At your home (Mississauga & surrounding area)'
  return fullAddress
}

export function SummaryRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-light text-forest">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">{label}</dt>
        <dd className="mt-0.5 break-words font-semibold text-forest">{value}</dd>
      </div>
    </div>
  )
}

export function BookingSummary({
  treatment,
  therapist,
  date,
  time,
  endTime,
  guardianName,
  reference,
  className,
  children,
  title = 'Your appointment',
}: {
  treatment: Treatment
  therapist?: Therapist
  date?: ISODate | null
  time?: string | null
  endTime?: string | null
  guardianName?: string
  reference?: string
  className?: string
  children?: ReactNode
  title?: string
}) {
  const ModeIcon = modeIcon[treatment.mode]
  return (
    <div className={cn('print-card overflow-hidden rounded-[2rem] bg-white shadow-soft ring-1 ring-forest/5', className)}>
      <div className="relative overflow-hidden bg-forest px-6 py-6 text-ivory sm:px-7">
        <div className="absolute -right-10 -top-10 size-36 rounded-full bg-sage/20" aria-hidden />
        <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-sage-light">{title}</p>
        <p className="relative mt-2 font-serif text-2xl leading-tight text-ivory">{treatment.name}</p>
        {therapist && (
          <div className="relative mt-4 flex items-center gap-3">
            <TherapistAvatar therapist={therapist} size={40} className="ring-ivory/30" />
            <div className="text-sm leading-tight">
              <p className="font-semibold">{fullName(therapist)}</p>
              <p className="text-ivory/70">{therapist.credentials}</p>
            </div>
          </div>
        )}
      </div>
      <dl className="grid gap-5 px-6 py-6 sm:px-7">
        {reference && <SummaryRow icon={Hash} label="Demo reference" value={<span className="font-mono tracking-wider">{reference}</span>} />}
        <SummaryRow icon={CalendarDays} label="Date" value={date ? formatLongDate(date) : <span className="font-normal text-charcoal-soft">Not selected yet</span>} />
        <SummaryRow
          icon={Clock}
          label="Time"
          value={time ? `${formatTime(time)}${endTime ? ` – ${formatTime(endTime)}` : ''} (Eastern Time)` : <span className="font-normal text-charcoal-soft">Not selected yet</span>}
        />
        <SummaryRow icon={Stethoscope} label="Duration" value={formatDuration(treatment.durationMinutes)} />
        <SummaryRow icon={ModeIcon} label="Session mode" value={modeLabel[treatment.mode]} />
        <SummaryRow icon={MapPin} label="Location" value={<span className="font-medium">{locationFor(treatment.mode)}</span>} />
        {guardianName && <SummaryRow icon={UserRound} label="Parent / Guardian" value={guardianName} />}
      </dl>
      {children}
    </div>
  )
}
