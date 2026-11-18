import { useSearchParams } from 'react-router-dom'
import { PageHero } from '@/components/layout/PageHero'
import { WaitlistForm } from '@/components/booking/WaitlistForm'

export default function Waitlist() {
  const [params] = useSearchParams()
  return (
    <>
      <PageHero
        eyebrow="Waitlist"
        title="Can’t find a suitable appointment?"
        intro="Join our waitlist and we’ll contact you when a suitable opening becomes available."
        crumbs={[{ to: '/', label: 'Home' }, { to: '/booking', label: 'Booking' }, { label: 'Waitlist' }]}
        tone="lavender"
      />
      <section className="container pb-24">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-forest/5 sm:p-10">
          <WaitlistForm defaultTreatmentId={params.get('treatment') ?? undefined} defaultTherapistId={params.get('therapist') ?? undefined} />
        </div>
      </section>
    </>
  )
}
