import { PageHero } from '@/components/layout/PageHero'
import { TherapistCard } from '@/components/therapists/TherapistCard'
import { Reveal } from '@/components/ui/decor'
import { BookingCTA } from '@/components/home/BookingCTA'
import { therapists } from '@/data/therapists'

export default function Therapists() {
  return (
    <>
      <PageHero
        eyebrow="Our therapists"
        title="Meet the team who’ll cheer your child on"
        intro="Our occupational therapists bring diverse backgrounds, languages and specialties — and a shared belief in every child’s potential."
        crumbs={[{ to: '/', label: 'Home' }, { label: 'Our Therapists' }]}
        tone="lavender"
      />
      <section className="section pt-4">
        <div className="container">
          <p className="mb-10 rounded-2xl bg-butter/70 px-5 py-3 text-sm text-[#5a4b17]">
            <strong>Demo note:</strong> these are fictional therapist profiles created for presentation. Photos are stock images of models, and credentials are placeholders.
          </p>
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {therapists.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.08}>
                <TherapistCard therapist={t} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <BookingCTA title="Found the right fit? Book with your favourite therapist." />
    </>
  )
}
