import { Link } from 'react-router-dom'
import { ArrowRight, CalendarHeart, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Blob, Reveal, Sparkle } from '@/components/ui/decor'
import { clinic } from '@/data/clinic'
import { images } from '@/data/images'
import { useNextOpening } from '@/hooks/useNextOpening'

export function BookingCTA({ title = 'Ready to help your child thrive?' }: { title?: string }) {
  const next = useNextOpening()
  return (
    <section className="section pt-0">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-forest px-6 py-14 text-ivory sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            <Blob className="-right-24 -top-32 w-[420px] opacity-20" fill="#A8B9A5" />
            <Blob className="-bottom-40 left-1/3 w-[360px] opacity-10" variant={1} fill="#F6EBC8" />
            <Sparkle className="absolute right-[42%] top-10 size-5 opacity-60" color="#F6EBC8" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <span className="eyebrow text-sage-light before:bg-sage">Book online in minutes</span>
                <h2 className="mt-4 text-balance text-4xl leading-[1.08] text-ivory sm:text-5xl">{title}</h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/80">
                  Choose an assessment, pick a therapist and find a time that suits your family — in-clinic, remote or at home.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="light">
                    <Link to="/booking">
                      <CalendarHeart aria-hidden /> Book an Appointment
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outlineLight">
                    <a href={clinic.phoneHref}>
                      <Phone aria-hidden /> {clinic.phone}
                    </a>
                  </Button>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="overflow-hidden rounded-[2rem] rounded-bl-[6rem] ring-8 ring-ivory/10">
                  <img src={images.sprinklerJoy} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </div>
                {next && (
                  <Link
                    to="/booking"
                    className="absolute -bottom-6 -left-8 flex items-center gap-3 rounded-2xl bg-ivory px-5 py-4 text-forest shadow-lift transition-transform hover:-translate-y-1"
                  >
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage-dark opacity-60" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-forest-light" />
                    </span>
                    <span className="text-sm">
                      <span className="block text-charcoal-soft">Next opening</span>
                      <span className="font-semibold">{next}</span>
                    </span>
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
