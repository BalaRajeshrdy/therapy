import { Link, useParams } from 'react-router-dom'
import { CalendarHeart, Check } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { DurationChip, ModeChip, ServiceCard } from '@/components/services/ServiceCard'
import { TherapistAvatar } from '@/components/therapists/TherapistCard'
import { Reveal } from '@/components/ui/decor'
import { Button } from '@/components/ui/button'
import { treatmentBySlug, treatments } from '@/data/treatments'
import { fullName } from '@/data/therapists'
import { therapistsFor } from '@/utils/scheduling'
import { useNextOpening } from '@/hooks/useNextOpening'
import NotFound from './NotFound'

export default function ServiceDetails() {
  const { slug } = useParams()
  const t = treatmentBySlug(slug)
  const next = useNextOpening(t?.id)
  if (!t) return <NotFound />
  const team = therapistsFor(t)

  return (
    <>
      <PageHero
        eyebrow={t.category}
        title={t.name}
        intro={t.shortDescription}
        crumbs={[{ to: '/', label: 'Home' }, { to: '/services', label: 'Our Services' }, { label: t.shortName }]}
        image={t.image}
        tone={t.accent}
      >
        <div className="flex flex-wrap items-center gap-3">
          <DurationChip minutes={t.durationMinutes} className="py-2" />
          <ModeChip mode={t.mode} className="py-2" />
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to={`/booking?treatment=${t.id}`}>
              <CalendarHeart aria-hidden /> Book this assessment
            </Link>
          </Button>
        </div>
        {next && <p className="mt-4 text-sm text-charcoal-soft">Next opening: <strong className="text-forest">{next}</strong></p>}
      </PageHero>

      <section className="section pt-6">
        <div className="container grid gap-12 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <Reveal className="prose-warm">
              <h2 className="mb-5 text-4xl">About this assessment</h2>
              {t.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Reveal>

            <Reveal className="mt-14">
              <h2 className="text-4xl">What to expect</h2>
              <ol className="mt-8 grid gap-4 sm:grid-cols-2">
                {t.whatToExpect.map((s, i) => (
                  <li key={s.title} className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-forest/5">
                    <span className="font-serif text-3xl text-sage-dark">0{i + 1}</span>
                    <h3 className="mt-3 font-sans text-lg font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-charcoal-soft">{s.body}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[2rem] bg-forest p-7 text-ivory">
              <h2 className="font-sans text-lg font-semibold text-ivory">Highlights</h2>
              <ul className="mt-4 space-y-3">
                {t.highlights.map((h) => (
                  <li key={h} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sage text-forest-dark">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2rem] bg-white p-7 shadow-soft ring-1 ring-forest/5">
              <h2 className="font-sans text-lg font-semibold">Ideal for</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {t.idealFor.map((x) => (
                  <li key={x} className="rounded-full bg-sage-light px-3.5 py-1.5 text-sm font-medium text-forest">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2rem] bg-white p-7 shadow-soft ring-1 ring-forest/5">
              <h2 className="font-sans text-lg font-semibold">Therapists offering this</h2>
              <ul className="mt-4 space-y-3">
                {team.map((th) => (
                  <li key={th.id}>
                    <Link to={`/booking?treatment=${t.id}&therapist=${th.id}`} className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-ivory">
                      <TherapistAvatar therapist={th} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-forest">{fullName(th)}</span>
                        <span className="block truncate text-xs text-charcoal-soft">{th.credentials}</span>
                      </span>
                      <span className="text-sm font-semibold text-forest-light">Book</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <h2 className="text-4xl">Other assessments</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {treatments
              .filter((x) => x.id !== t.id)
              .map((x) => (
                <ServiceCard key={x.id} treatment={x} />
              ))}
          </div>
        </div>
      </section>
    </>
  )
}
