import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarHeart } from 'lucide-react'
import type { Therapist } from '@/types'
import { accentBg, DemoBadge } from '@/components/ui/decor'
import { fullName } from '@/data/therapists'
import { cn } from '@/lib/utils'

export function TherapistCard({ therapist, className, compact }: { therapist: Therapist; className?: string; compact?: boolean }) {
  return (
    <article className={cn('group relative flex h-full flex-col', className)}>
      <div className={cn('relative overflow-hidden rounded-[2rem]', accentBg[therapist.accent])}>
        <Link to={`/therapists/${therapist.slug}`} tabIndex={-1} aria-hidden>
          <img
            src={therapist.image}
            alt=""
            loading="lazy"
            className="aspect-[4/5] w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </Link>
        <DemoBadge className="absolute left-4 top-4">Demo profile</DemoBadge>
        <Link
          to={`/booking?therapist=${therapist.id}`}
          className="absolute bottom-4 right-4 flex translate-y-2 items-center gap-1.5 rounded-full bg-ivory/95 px-4 py-2 text-sm font-semibold text-forest opacity-0 shadow-soft backdrop-blur transition-all duration-300 hover:bg-white focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
          aria-label={`Book with ${fullName(therapist)}`}
        >
          <CalendarHeart className="size-4" aria-hidden /> Book
        </Link>
      </div>
      <div className="mt-5 flex flex-1 flex-col px-1">
        <h3 className="text-2xl leading-tight">
          <Link to={`/therapists/${therapist.slug}`} className="inline-flex items-start gap-1.5 hover:text-forest-light">
            {fullName(therapist)}
            <ArrowUpRight className="mt-1 size-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </Link>
        </h3>
        <p className="mt-1 text-sm font-medium text-forest-light">{therapist.credentials}</p>
        <p className="mt-0.5 text-sm text-charcoal-soft">{therapist.title}</p>
        {!compact && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Specializations">
            {therapist.specializations.slice(0, 3).map((s) => (
              <li key={s} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-forest ring-1 ring-forest/10">
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

export function TherapistAvatar({ therapist, size = 48, className }: { therapist: Therapist; size?: number; className?: string }) {
  return (
    <img
      src={therapist.image.replace(/w=\d+/, 'w=160').replace(/h=\d+/, 'h=160')}
      alt=""
      width={size}
      height={size}
      className={cn('shrink-0 rounded-full object-cover object-top ring-2 ring-white', accentBg[therapist.accent], className)}
      style={{ width: size, height: size }}
    />
  )
}
