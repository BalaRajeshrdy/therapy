import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Award, CalendarHeart, ChevronRight, Languages, Smile, Baby } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Blob, DemoBadge, Reveal, accentBg } from '@/components/ui/decor'
import { TherapistCard } from '@/components/therapists/TherapistCard'
import { DurationChip, ModeChip } from '@/components/services/ServiceCard'
import { therapistBySlug, therapists, fullName } from '@/data/therapists'
import { treatments } from '@/data/treatments'
import { useNextOpening } from '@/hooks/useNextOpening'
import { cn } from '@/lib/utils'
import NotFound from './NotFound'

export default function TherapistDetails() {
  const { slug } = useParams()
  const t = therapistBySlug(slug)
  const reduce = useReducedMotion()
  const next = useNextOpening(undefined, t?.id ?? 'any')
  if (!t) return <NotFound />
  const offered = treatments.filter((x) => t.treatmentIds.includes(x.id))
  const bookUrl = `/booking?therapist=${t.id}`

  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-10 sm:pt-14">
        <Blob className="-right-40 -top-48 w-[640px] max-w-none" fill="#F4E5DA" />
        <div className="container relative">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-charcoal-soft">
              <li className="flex items-center gap-1.5">
                <Link to="/" className="hover:underline">
                  Home
                </Link>
                <ChevronRight className="size-3.5" aria-hidden />
              </li>
              <li className="flex items-center gap-1.5">
                <Link to="/therapists" className="hover:underline">
                  Our Therapists
                </Link>
                <ChevronRight className="size-3.5" aria-hidden />
              </li>
              <li aria-current="page" className="font-medium text-forest">
                {fullName(t)}
              </li>
            </ol>
          </nav>

          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <motion.div initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className={cn('overflow-hidden rounded-[2.5rem] rounded-tl-[8rem]', accentBg[t.accent])}>
                <img src={t.image} alt={`Stock portrait used for the fictional profile of ${fullName(t)}`} className="aspect-[4/5] w-full object-cover object-top" />
              </div>
              <DemoBadge className="absolute left-5 top-5">Demo profile</DemoBadge>
              <div className="absolute -bottom-6 right-4 rounded-2xl bg-white px-5 py-4 shadow-lift sm:-right-6">
                <p className="font-serif text-3xl leading-none text-forest">{t.yearsExperience}+</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-forest-light">Years experience</p>
              </div>
            </motion.div>

            <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <span className="eyebrow">{t.title}</span>
              <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">{fullName(t)}</h1>
              <p className="mt-3 text-lg font-semibold text-forest-light">{t.credentials}</p>
              <p className="mt-6 text-xl leading-relaxed text-charcoal-soft">{t.shortBio}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link to={bookUrl}>
                    <CalendarHeart aria-hidden /> Book Appointment
                  </Link>
                </Button>
                {next && (
                  <p className="text-sm text-charcoal-soft">
                    Next opening: <strong className="text-forest">{next}</strong>
                  </p>
                )}
              </div>
              <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { Icon: Languages, k: 'Languages', v: t.languages.join(', ') },
                  { Icon: Baby, k: 'Ages', v: t.ageGroups },
                  { Icon: Smile, k: 'Favourite activity', v: t.favouriteActivity },
                ].map(({ Icon, k, v }) => (
                  <div key={k} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-forest/5">
                    <Icon className="size-5 text-sage-dark" aria-hidden />
                    <dt className="mt-3 text-xs font-semibold uppercase tracking-wider text-charcoal-soft">{k}</dt>
                    <dd className="mt-1 font-semibold leading-snug text-forest">{v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section pt-10">
        <div className="container grid gap-14 lg:grid-cols-[1.3fr_1fr]">
          <Reveal className="prose-warm">
            <h2 className="mb-6 text-4xl">About {t.firstName}</h2>
            {t.bio.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <h3 className="mb-4 mt-10 flex items-center gap-2 font-sans text-lg font-semibold">
              <Award className="size-5 text-sage-dark" aria-hidden /> Areas of focus
            </h3>
            <ul className="flex flex-wrap gap-2">
              {t.specializations.map((s) => (
                <li key={s} className="rounded-full bg-sage-light px-4 py-2 text-sm font-medium text-forest">
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-forest/5 sm:p-8 lg:sticky lg:top-28">
              <h2 className="font-sans text-lg font-semibold">Services offered by {t.firstName}</h2>
              <ul className="mt-5 space-y-3">
                {offered.map((x) => (
                  <li key={x.id}>
                    <Link to={`/booking?treatment=${x.id}&therapist=${t.id}`} className="group flex items-center gap-4 rounded-2xl border border-forest/10 p-4 transition-all hover:border-forest/40 hover:shadow-soft">
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-forest">{x.name}</span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          <DurationChip minutes={x.durationMinutes} className="bg-ivory ring-0" />
                          <ModeChip mode={x.mode} className="bg-ivory ring-0" />
                        </span>
                      </span>
                      <ArrowRight className="size-5 shrink-0 text-forest transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" size="lg">
                <Link to={bookUrl}>Book with {t.firstName}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section bg-[#F3F0F7]">
        <div className="container">
          <h2 className="text-4xl">Meet the rest of the team</h2>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {therapists
              .filter((x) => x.id !== t.id)
              .map((x) => (
                <TherapistCard key={x.id} therapist={x} compact />
              ))}
          </div>
        </div>
      </section>
    </>
  )
}
