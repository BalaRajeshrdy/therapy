import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Clock, House, Video } from 'lucide-react'
import type { SessionMode, Treatment } from '@/types'
import { Button } from '@/components/ui/button'
import { accentBg } from '@/components/ui/decor'
import { formatDuration } from '@/utils/time'
import { cn } from '@/lib/utils'

export const modeIcon: Record<SessionMode, typeof Video> = { 'In-Clinic': Building2, Virtual: Video, 'In-Home': House }
export const modeLabel: Record<SessionMode, string> = { 'In-Clinic': 'In-Clinic', Virtual: 'Remote (Virtual)', 'In-Home': 'In-Home' }

export function ModeChip({ mode, className }: { mode: SessionMode; className?: string }) {
  const Icon = modeIcon[mode]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-forest ring-1 ring-forest/10', className)}>
      <Icon className="size-3.5" aria-hidden /> {modeLabel[mode]}
    </span>
  )
}

export function DurationChip({ minutes, className }: { minutes: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-forest ring-1 ring-forest/10', className)}>
      <Clock className="size-3.5" aria-hidden /> {formatDuration(minutes)}
    </span>
  )
}

/** "OT Assessment – In-Clinic": keeps the part after the dash together so "In-Clinic" never splits at its hyphen. */
export function NoBreakName({ name }: { name: string }) {
  const [head, ...rest] = name.split(' – ')
  if (!rest.length) return <>{name}</>
  return (
    <>
      {head} – <span className="whitespace-nowrap">{rest.join(' – ').replace(/ \(/, ' (')}</span>
    </>
  )
}

export function ServiceCard({ treatment, className }: { treatment: Treatment; className?: string }) {
  const Icon = modeIcon[treatment.mode]
  return (
    <article className={cn('group flex h-full flex-col overflow-hidden rounded-4xl bg-white shadow-soft ring-1 ring-forest/5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift', className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={treatment.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/40 via-transparent to-transparent" />
        <div className={cn('absolute left-4 top-4 grid size-12 place-items-center rounded-2xl text-forest shadow-soft', accentBg[treatment.accent])}>
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <DurationChip minutes={treatment.durationMinutes} />
          <ModeChip mode={treatment.mode} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-light">{treatment.category}</p>
        <h3 className="mt-2 text-[1.55rem] leading-tight">
          <NoBreakName name={treatment.name} />
        </h3>
        <p className="mt-3 flex-1 leading-relaxed text-charcoal-soft">{treatment.shortDescription}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild size="sm">
            <Link to={`/booking?treatment=${treatment.id}`} aria-label={`Book ${treatment.name}`}>
              Book Now
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/services/${treatment.slug}`} aria-label={`Learn more about ${treatment.name}`}>
              Learn More <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
