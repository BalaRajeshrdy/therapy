import { Link } from 'react-router-dom'
import { ArrowRight, Compass, HandHeart, Leaf, Lightbulb, Smile, Users } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { Blob, Reveal, SectionHeading } from '@/components/ui/decor'
import { Button } from '@/components/ui/button'
import { TherapistCard } from '@/components/therapists/TherapistCard'
import { BookingCTA } from '@/components/home/BookingCTA'
import { images } from '@/data/images'
import { therapists } from '@/data/therapists'
import { clinic } from '@/data/clinic'

const values = [
  { Icon: HandHeart, title: 'Compassion', body: 'Every child and family is met with warmth, patience and respect — no judgement, ever.' },
  { Icon: Smile, title: 'Joyful learning', body: 'Children grow best when they feel safe and are having fun. Play is at the heart of everything we do.' },
  { Icon: Users, title: 'Partnership', body: 'Parents, caregivers and educators are essential members of the team. We work together.' },
  { Icon: Lightbulb, title: 'Curiosity', body: 'We keep learning, drawing on current research and creative ideas to support each child.' },
  { Icon: Compass, title: 'Individuality', body: 'There’s no one-size-fits-all. Each plan reflects your child’s strengths, interests and goals.' },
  { Icon: Leaf, title: 'Inclusion', body: 'We celebrate neurodiversity and work to make therapy accessible for families across Peel Region.' },
]

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Helping children grow, thrive and shine"
        intro="Maple Sprout Paediatric Therapy is a family-centred occupational therapy clinic in Mississauga, Ontario, supporting children from toddlerhood through the teen years."
        crumbs={[{ to: '/', label: 'Home' }, { label: 'About Us' }]}
        image={images.familyOutdoors}
      />

      <section className="section pt-8">
        <div className="container grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="Our story" title="Born from a simple belief: every child deserves to feel capable" />
            <Reveal delay={0.1} className="prose-warm mt-6">
              <p>
                Maple Sprout began with a conversation between two occupational therapists who wanted something different for families — a clinic that felt less like an appointment and more like a second home. A place where children are greeted by name, parents feel heard, and therapy feels like play.
              </p>
              <p>
                Today, our multilingual team supports families across {clinic.serviceArea.join(', ')}. Whether we meet in our sensory-friendly clinic, over video or in your living room, our goal is always the same: to help your child build the skills and confidence to participate fully in everyday life.
              </p>
            </Reveal>
            <Reveal delay={0.2} className="mt-8">
              <Button asChild>
                <Link to="/therapists">
                  Meet our therapists <ArrowRight aria-hidden />
                </Link>
              </Button>
            </Reveal>
          </div>
          <Reveal className="relative grid grid-cols-2 gap-4">
            <img src={images.kidsSmiling} alt="Three young children smiling and laughing together" loading="lazy" className="col-span-2 aspect-[16/10] w-full rounded-[2rem] object-cover" />
            <img src={images.playroom} alt="A bright, colourful therapy playroom" loading="lazy" className="aspect-square w-full rounded-[2rem] rounded-bl-[5rem] object-cover" />
            <div className="flex flex-col justify-center rounded-[2rem] bg-forest p-6 text-ivory">
              <p className="font-serif text-4xl text-butter">“</p>
              <p className="font-serif text-xl leading-snug text-ivory">We celebrate every small step — because small steps lead to big leaps.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section relative overflow-hidden bg-lavender/60">
        <Blob className="-right-40 -top-24 w-[480px] opacity-60" fill="#FFFFFF" />
        <div className="container relative">
          <SectionHeading eyebrow="Our values" title="What guides us every day" />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={(i % 3) * 0.08}>
                <div className="h-full rounded-[2rem] bg-white p-7 shadow-soft transition-transform duration-300 hover:-translate-y-1">
                  <Icon className="size-8 text-forest-light" aria-hidden />
                  <h3 className="mt-5 text-2xl">{title}</h3>
                  <p className="mt-2 leading-relaxed text-charcoal-soft">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-10 rounded-[2.5rem] bg-white p-8 shadow-soft sm:p-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <span className="eyebrow">Our clinic</span>
            <h2 className="mt-4 text-4xl">A space designed for little explorers</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
            {[
              ['Sensory gym', 'Swings, crash mats, climbing wall and a calming sensory nook.'],
              ['Fine motor studio', 'Child-sized tables, art supplies, puzzles and handwriting tools.'],
              ['Family lounge', 'A comfortable space for siblings and caregivers, with Wi-Fi and books.'],
              ['Accessible & welcoming', 'Step-free entrance, accessible washroom and free on-site parking.'],
            ].map(([t, b]) => (
              <div key={t} className="border-l-2 border-sage pl-5">
                <h3 className="font-sans text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-charcoal-soft">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-sage-light/50">
        <div className="container">
          <SectionHeading eyebrow="Our team" title="The people behind the play" />
          <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {therapists.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.08}>
                <TherapistCard therapist={t} compact />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <div className="h-20" />
      <BookingCTA />
    </>
  )
}
