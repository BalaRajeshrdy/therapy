import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { ServiceCard, modeIcon } from '@/components/services/ServiceCard'
import { Reveal, SectionHeading } from '@/components/ui/decor'
import { Button } from '@/components/ui/button'
import { BookingCTA } from '@/components/home/BookingCTA'
import { treatments } from '@/data/treatments'
import { images } from '@/data/images'
import { formatDuration } from '@/utils/time'

export default function Services() {
  return (
    <>
      <PageHero
        eyebrow="Our services"
        title="Occupational therapy, tailored to your child"
        intro="Every journey starts with an assessment. Choose the setting that suits your family best — all assessments include a personalized plan and practical next steps."
        crumbs={[{ to: '/', label: 'Home' }, { label: 'Our Services' }]}
        image={images.guidedWriting}
        tone="sage"
      >
        <Button asChild size="lg">
          <Link to="/booking">Book an assessment</Link>
        </Button>
      </PageHero>

      <section className="section pt-6">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {treatments.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.08} className="h-full">
                <ServiceCard treatment={t} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeading eyebrow="Compare options" title="Which assessment is right for us?" intro="Not sure? Any option is a great place to start — and you can always switch settings later." />
          <Reveal className="mt-12 overflow-x-auto rounded-[2rem] ring-1 ring-forest/10">
            <table className="w-full min-w-[720px] text-left">
              <caption className="sr-only">Comparison of assessment options</caption>
              <thead className="bg-forest text-ivory">
                <tr>
                  <th scope="col" className="px-6 py-5 font-semibold">
                    Assessment
                  </th>
                  <th scope="col" className="px-6 py-5 font-semibold">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-5 font-semibold">
                    Setting
                  </th>
                  <th scope="col" className="px-6 py-5 font-semibold">
                    Ideal for
                  </th>
                  <th scope="col" className="px-6 py-5">
                    <span className="sr-only">Book</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((t, i) => {
                  const Icon = modeIcon[t.mode]
                  return (
                    <tr key={t.id} className={i % 2 ? 'bg-ivory' : 'bg-white'}>
                      <th scope="row" className="px-6 py-5 font-semibold text-forest">
                        <Link to={`/services/${t.slug}`} className="hover:underline">
                          {t.name}
                        </Link>
                      </th>
                      <td className="px-6 py-5">{formatDuration(t.durationMinutes)}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="size-4 text-forest-light" aria-hidden /> {t.mode === 'Virtual' ? 'Remote' : t.mode}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-charcoal-soft">
                        <ul className="space-y-1">
                          {t.idealFor.slice(0, 2).map((x) => (
                            <li key={x} className="flex items-center gap-1.5">
                              <Check className="size-3.5 text-sage-dark" aria-hidden /> {x}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button asChild size="sm" variant="secondary">
                          <Link to={`/booking?treatment=${t.id}`}>Book</Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Reveal>
          <p className="mt-4 text-center text-sm text-charcoal-soft">Fees are not shown on this demonstration website. Receipts suitable for extended health benefits would be provided in CAD.</p>
        </div>
      </section>
      <div className="h-24" />
      <BookingCTA />
    </>
  )
}
