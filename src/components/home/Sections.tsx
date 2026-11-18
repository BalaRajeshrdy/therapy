import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Brain,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Footprints,
  Hand,
  HeartHandshake,
  House,
  Languages,
  MapPin,
  PenLine,
  Puzzle,
  Quote,
  Shirt,
  Sparkles,
  Target,
  Video,
  Waves,
  Heart,
  MousePointerClick,
  UserRoundCheck,
  CalendarDays,
  MailCheck,
  Check,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Blob, DemoBadge, Reveal, SectionHeading, Sparkle, Squiggle } from '@/components/ui/decor'
import { ServiceCard } from '@/components/services/ServiceCard'
import { TherapistCard } from '@/components/therapists/TherapistCard'
import { FAQAccordion } from '@/components/ui/accordion'
import { images } from '@/data/images'
import { treatments } from '@/data/treatments'
import { therapists } from '@/data/therapists'
import { faqs } from '@/data/faqs'
import { clinic } from '@/data/clinic'
import { cn } from '@/lib/utils'

/* 1 ─ Welcome */
export function Welcome() {
  return (
    <section className="section">
      <div className="container grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative mr-10 overflow-hidden rounded-[2.5rem] rounded-bl-[7rem] shadow-lift sm:mr-20">
            <img src={images.guidedWriting} alt="A therapist guiding a young child through a writing activity at a small table" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </div>
          <div className="absolute -bottom-10 right-0 w-[45%] overflow-hidden rounded-[2rem] border-[6px] border-ivory shadow-lift">
            <img src={images.toysFlatlay} alt="" loading="lazy" className="aspect-square w-full object-cover" />
          </div>
          <div className="absolute -left-4 top-10 rounded-2xl bg-butter px-5 py-4 shadow-soft sm:-left-8">
            <p className="font-serif text-3xl leading-none text-forest">1:1</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-forest-light">Personalized care</p>
          </div>
        </Reveal>
        <div className="order-1 lg:order-2">
          <SectionHeading align="left" eyebrow="Welcome to our clinic" title="A warm, playful space where every child is celebrated" />
          <Reveal delay={0.1} className="prose-warm mt-6">
            <p>
              At Maple Sprout, we believe every child has their own way of learning, moving and seeing the world. Our occupational therapists partner with families to understand what makes your child unique — and to build the skills that help them feel capable and confident.
            </p>
            <p>
              Whether your child is learning to hold a pencil, navigating a busy classroom, or finding mornings a little tricky, we meet them where they are with patience, creativity and evidence-informed care.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { k: '18 mo+', v: 'Toddlers to teens' },
              { k: '3', v: 'Ways to connect' },
              { k: '4', v: 'Languages spoken' },
            ].map((s) => (
              <div key={s.v} className="rounded-3xl bg-white p-4 text-center shadow-soft ring-1 ring-forest/5 sm:p-5">
                <p className="font-serif text-3xl text-forest sm:text-4xl">{s.k}</p>
                <p className="mt-1 text-xs font-medium text-charcoal-soft sm:text-sm">{s.v}</p>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.3} className="mt-9">
            <Button asChild variant="secondary">
              <Link to="/about">
                Our story <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* 2 ─ Little hands, big dreams */
const skills = ['Fine motor skills', 'Handwriting', 'Sensory play', 'Self-regulation', 'Getting dressed', 'Scissor skills', 'Coordination', 'Mealtime routines', 'Focus & attention', 'Playground confidence']

export function LittleHands() {
  return (
    <section className="relative overflow-hidden bg-forest py-20 text-ivory sm:py-28">
      <Blob className="-left-40 -top-40 w-[520px] opacity-10" fill="#A8B9A5" />
      <Blob className="-bottom-52 -right-32 w-[480px] opacity-10" variant={2} fill="#F4E5DA" />
      <div className="container relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading
              light
              align="left"
              eyebrow="Our promise"
              title={
                <>
                  Helping little hands achieve <span className="italic text-butter">big dreams</span>
                </>
              }
              intro="Small skills open big doors. When a child can button a coat, write their name or join a game at recess, they gain something even more important — the belief that they can."
            />
            <Reveal delay={0.15} className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { t: 'Confidence first', d: 'We celebrate every win, so children feel proud of their progress.' },
                { t: 'Real-life goals', d: 'Therapy targets the moments that matter at home and school.' },
              ].map((x) => (
                <div key={x.t} className="rounded-3xl bg-ivory/[0.07] p-6 ring-1 ring-ivory/10">
                  <Check className="size-5 text-butter" aria-hidden />
                  <p className="mt-3 font-semibold text-ivory">{x.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ivory/75">{x.d}</p>
                </div>
              ))}
            </Reveal>
          </div>
          <Reveal delay={0.1} className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4 lg:max-w-none">
            <img src={images.drawingHands} alt="Child's hands drawing with markers" loading="lazy" className="aspect-[3/4] w-full rounded-[2rem] rounded-tl-[5rem] object-cover" />
            <div className="flex flex-col gap-4 pt-12">
              <img src={images.paintPlay} alt="Child finger-painting with bright colours" loading="lazy" className="aspect-square w-full rounded-[2rem] object-cover" />
              <img src={images.boyWriting} alt="A young boy practising handwriting" loading="lazy" className="aspect-square w-full rounded-[2rem] rounded-br-[5rem] object-cover" />
            </div>
            <Sparkle className="absolute -left-3 top-1/2 size-8" color="#F6EBC8" />
          </Reveal>
        </div>
      </div>
      <div className="relative mt-16 overflow-hidden border-y border-ivory/10 py-5" aria-hidden>
        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 motion-reduce:animate-none">
          {[...skills, ...skills].map((s, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap font-serif text-2xl text-ivory/80 sm:text-3xl">
              {s}
              <Sparkle className="size-4" color="#A8B9A5" />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 3 ─ Services */
export function ServicesPreview() {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            eyebrow="Our occupational therapy services"
            title="Assessments designed around your family"
            intro="Every journey begins with understanding. Choose the setting that feels right for your child — we’ll take it from there."
          />
          <Reveal>
            <Button asChild variant="secondary">
              <Link to="/services">
                View all services <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {treatments.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08} className="h-full">
              <ServiceCard treatment={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 4 ─ Why families choose us */
const reasons = [
  { Icon: Heart, title: 'Family-centred care', body: 'You know your child best. We build every plan together and keep you involved at each step.' },
  { Icon: Sparkles, title: 'Play-based sessions', body: 'Children learn best when they’re having fun, so our sessions feel like play — with purpose.' },
  { Icon: ClipboardCheck, title: 'Evidence-informed', body: 'Our approach draws on current research and standardized tools, explained in plain language.' },
  { Icon: Languages, title: 'Multilingual team', body: 'Sessions available in English, French, Italian and Spanish to support diverse families.' },
  { Icon: MapPin, title: 'Flexible locations', body: 'Visit our clinic, connect from home by video, or have us come to you.' },
  { Icon: CalendarCheck, title: 'Easy online booking', body: 'See real-time openings, book in minutes and manage appointments online.' },
]

export function WhyChooseUs() {
  return (
    <section className="section relative overflow-hidden bg-peach">
      <Blob className="-right-48 top-10 w-[520px] opacity-50" variant={1} fill="#FFFFFF" />
      <div className="container relative grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading align="left" eyebrow="Why families choose us" title="Care that feels like a partnership" intro="Parents tell us they leave every session feeling heard, equipped and hopeful. Here’s what makes our clinic different." />
          <Reveal delay={0.2} className="mt-8 hidden overflow-hidden rounded-[2rem] lg:block">
            <img src={images.familyOutdoors} alt="A parent laughing with two young children outdoors" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </Reveal>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {reasons.map(({ Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 2) * 0.08}>
              <div className={cn('group h-full rounded-[2rem] bg-white/80 p-7 ring-1 ring-forest/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lift', i % 2 === 1 && 'sm:translate-y-8')}>
                <span className="grid size-14 place-items-center rounded-2xl bg-forest text-ivory transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-6 text-2xl">{title}</h3>
                <p className="mt-2 leading-relaxed text-charcoal-soft">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 5 ─ How we help */
const areas = [
  { Icon: Hand, title: 'Fine motor skills', body: 'Grasp, scissor use, buttons, zippers and building.', tone: 'bg-sage-light' },
  { Icon: PenLine, title: 'Handwriting', body: 'Letter formation, spacing, pencil grip and stamina.', tone: 'bg-lavender' },
  { Icon: Waves, title: 'Sensory processing', body: 'Understanding and supporting sensory preferences.', tone: 'bg-peach' },
  { Icon: HeartHandshake, title: 'Emotional regulation', body: 'Tools for calm bodies and big feelings.', tone: 'bg-butter' },
  { Icon: Shirt, title: 'Self-care & routines', body: 'Dressing, mealtimes, toileting and bedtime.', tone: 'bg-butter' },
  { Icon: Footprints, title: 'Gross motor & coordination', body: 'Balance, strength, motor planning and play.', tone: 'bg-peach' },
  { Icon: Puzzle, title: 'Play & social skills', body: 'Turn-taking, imaginative play and friendships.', tone: 'bg-lavender' },
  { Icon: Target, title: 'Attention & focus', body: 'Strategies for learning, listening and organization.', tone: 'bg-sage-light' },
]

export function HowWeHelp() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow="How we help children" title="Building skills for the everyday moments that matter" intro="Occupational therapy supports the whole child. Here are some of the areas we most often work on together." />
        <div className="mt-14 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {areas.map(({ Icon, title, body, tone }, i) => (
            <Reveal key={title} delay={(i % 4) * 0.06}>
              <div className={cn('group relative h-full overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft sm:p-7', tone)}>
                <div className="absolute -right-8 -top-8 size-28 rounded-full bg-white/40 transition-transform duration-500 group-hover:scale-125" aria-hidden />
                <span className="relative grid size-12 place-items-center rounded-2xl bg-white text-forest shadow-soft">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="relative mt-8 text-[1.45rem] leading-tight">{title}</h3>
                <p className="relative mt-2 text-[0.95rem] leading-relaxed text-charcoal-soft">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 6 ─ Therapists */
export function TherapistsPreview() {
  return (
    <section className="section relative overflow-hidden bg-[#F3F0F7]">
      <Blob className="-left-40 top-20 w-[440px] opacity-70" variant={2} fill="#E9E3F1" />
      <div className="container relative">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading align="left" eyebrow="Meet our therapists" title="Kind, skilled people who love what they do" intro="Our team brings diverse backgrounds, languages and specialties — and a shared belief in every child’s potential." />
          <Reveal>
            <Button asChild variant="secondary">
              <Link to="/therapists">
                Meet the team <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {therapists.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <TherapistCard therapist={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 7 ─ Approach */
const steps = [
  { title: 'Listen', body: 'We start with your story — your child’s strengths, interests, challenges and your family’s priorities.' },
  { title: 'Assess', body: 'Through play and standardized tools, we build a clear picture of how your child learns and moves.' },
  { title: 'Plan together', body: 'We set meaningful, achievable goals with you, and map out the support that fits your routine.' },
  { title: 'Grow & celebrate', body: 'We track progress, adjust as your child grows, and celebrate every milestone along the way.' },
]

export function Approach() {
  return (
    <section className="section">
      <div className="container grid items-center gap-16 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="overflow-hidden rounded-[2.5rem] rounded-tr-[8rem] shadow-lift">
            <img src={images.playDough} alt="Colourful play-dough and wooden letters set out for a fine motor activity" loading="lazy" className="aspect-[4/5] w-full object-cover sm:aspect-[5/5]" />
          </div>
          <div className="absolute -bottom-8 right-4 max-w-[280px] rounded-3xl bg-white p-6 shadow-lift sm:right-10">
            <Quote className="size-6 text-sage-dark" aria-hidden />
            <p className="mt-3 font-serif text-xl leading-snug text-forest">Play is the work of childhood — and our favourite therapy tool.</p>
          </div>
        </Reveal>
        <div>
          <SectionHeading align="left" eyebrow="Our therapy approach" title="Thoughtful, step-by-step support" />
          <ol className="relative mt-10 space-y-2">
            <span className="absolute bottom-6 left-[27px] top-6 w-px border-l-2 border-dashed border-sage" aria-hidden />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <li className="relative flex gap-6 rounded-3xl p-3 transition-colors hover:bg-white">
                  <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-full bg-forest font-serif text-xl text-ivory ring-8 ring-ivory">0{i + 1}</span>
                  <div className="pt-2">
                    <h3 className="text-2xl">{s.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-charcoal-soft">{s.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* 8 ─ Modes */
const modes = [
  { Icon: Building2, title: 'In-Clinic', body: 'Our sensory-friendly Mississauga clinic is filled with swings, climbing gear and fine motor stations.', image: images.playroom, to: '/services/ot-assessment-in-clinic' },
  { Icon: Video, title: 'Remote', body: 'Secure video sessions bring expert support to your living room — ideal for coaching and school-aged kids.', image: images.remoteChild, to: '/services/ot-assessment-remote' },
  { Icon: House, title: 'In-Home', body: 'We come to you, working on real routines in the place they actually happen.', image: images.familyHome, to: '/services/ot-assessment-in-home' },
]

export function Modes() {
  return (
    <section className="section bg-butter/60">
      <div className="container">
        <SectionHeading eyebrow="Therapy where you are" title="In-clinic, remote and in-home therapy" intro={`Flexible options for families across ${clinic.serviceArea.slice(0, 4).join(', ')} and beyond.`} />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {modes.map(({ Icon, title, body, image, to }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <Link to={to} className="group relative block h-[420px] overflow-hidden rounded-[2.25rem] shadow-soft sm:h-[480px]">
                <img src={image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-ivory">
                  <span className="grid size-12 place-items-center rounded-2xl bg-ivory text-forest">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-3xl text-ivory">{title}</h3>
                  <p className="mt-2 leading-relaxed text-ivory/85">{body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-butter">
                    Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 9 ─ How to book */
const bookSteps = [
  { Icon: MousePointerClick, title: 'Choose a treatment', body: 'Pick the assessment and setting that suits your child.' },
  { Icon: UserRoundCheck, title: 'Select a therapist', body: 'Choose a favourite or let us match the first available.' },
  { Icon: CalendarDays, title: 'Pick a date & time', body: 'See live openings and choose what fits your week.' },
  { Icon: MailCheck, title: 'Confirm & relax', body: 'Get your booking reference and add it to your calendar.' },
]

export function HowToBook() {
  return (
    <section className="section">
      <div className="container grid items-center gap-16 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeading align="left" eyebrow="How to book an appointment" title="Booking takes less than two minutes" intro="No phone tag, no forms to print. Our online booking shows real openings so you can choose what works for your family." />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {bookSteps.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <li className="h-full rounded-3xl border border-forest/10 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-sage-light text-forest">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-serif text-3xl text-sage">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-sans text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">{body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.3} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/booking">Start booking</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href={clinic.phoneHref}>
                <Phone aria-hidden /> Prefer to call?
              </a>
            </Button>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <MiniBookingPreview />
        </Reveal>
      </div>
    </section>
  )
}

function MiniBookingPreview() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2)
  const available = new Set([3, 5, 6, 10, 12, 13, 17, 19, 20, 24, 26, 27])
  return (
    <div className="relative" aria-hidden>
      <div className="absolute -inset-5 rotate-3 rounded-[2.5rem] bg-lavender sm:-inset-8" />
      <div className="relative rotate-[-1.5deg] rounded-[2rem] bg-white p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between">
          <p className="font-serif text-2xl text-forest">Choose a date</p>
          <span className="rounded-full bg-sage-light px-3 py-1 text-xs font-semibold text-forest">In-Clinic · 60 min</span>
        </div>
        <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-charcoal-soft">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
          {days.map((d) => (
            <span
              key={d}
              className={cn(
                'grid aspect-square place-items-center rounded-xl text-sm',
                d < 1 || d > 30 ? 'text-transparent' : available.has(d) ? 'bg-sage-light font-semibold text-forest' : 'text-charcoal-soft/40',
                d === 12 && 'bg-forest text-ivory',
              )}
            >
              {d}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {['9:00 a.m.', '10:30 a.m.', '1:00 p.m.', '2:30 p.m.'].map((t, i) => (
            <span key={t} className={cn('rounded-full border px-4 py-2 text-sm font-semibold', i === 2 ? 'border-forest bg-forest text-ivory' : 'border-forest/15 text-forest')}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-6 -right-2 flex items-center gap-3 rounded-2xl bg-forest px-5 py-4 text-ivory shadow-lift sm:-right-6">
        <span className="grid size-9 place-items-center rounded-full bg-sage text-forest-dark">
          <Check className="size-5" />
        </span>
        <span className="text-sm font-semibold">Appointment confirmed!</span>
      </div>
    </div>
  )
}

/* 10 ─ Testimonials */
const testimonials = [
  { quote: 'Our daughter used to melt down every morning getting dressed. After a few months of strategies from our OT, mornings are calm — and she’s so proud of doing it herself.', name: 'Parent of a 5-year-old', place: 'Mississauga', tone: 'bg-white' },
  { quote: 'The remote sessions were a lifesaver with our schedule. Our son’s handwriting has improved so much that his teacher asked what we’d been doing!', name: 'Parent of an 8-year-old', place: 'Oakville', tone: 'bg-butter' },
  { quote: 'From the first visit, we felt heard. The in-home assessment helped us understand our son’s sensory needs in a way that finally made sense.', name: 'Parent of a 3-year-old', place: 'Brampton', tone: 'bg-white' },
]

export function Testimonials() {
  return (
    <section className="section relative overflow-hidden bg-sage-light">
      <Blob className="-right-40 -top-40 w-[520px] opacity-60" fill="#FFFFFF" />
      <div className="container relative">
        <SectionHeading eyebrow="Parent testimonials" title="Kind words from families" />
        <Reveal className="mt-4 flex justify-center">
          <DemoBadge>Demo content — illustrative testimonials, not from real clients</DemoBadge>
        </Reveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 0.1} className={cn(i === 1 && 'lg:-translate-y-6')}>
              <figure className={cn('flex h-full flex-col rounded-[2rem] p-8 shadow-soft', t.tone)}>
                <svg viewBox="0 0 40 32" className="h-8 w-10 text-sage-dark" aria-hidden>
                  <path fill="currentColor" d="M0 32V19.2C0 8.3 5.6 1.9 16.8 0l1.6 4.2C12 6 9 9.6 8.8 15.2H16V32H0Zm22.4 0V19.2C22.4 8.3 28 1.9 39.2 0l.8 4.2c-6.4 1.8-9.4 5.4-9.6 11H38V32H22.4Z" />
                </svg>
                <blockquote className="mt-6 flex-1 font-serif text-[1.35rem] leading-snug text-forest">“{t.quote}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-3 border-t border-forest/10 pt-5">
                  <span className="grid size-11 place-items-center rounded-full bg-forest font-serif text-lg text-ivory">{t.place.charAt(0)}</span>
                  <span className="text-sm">
                    <span className="block font-semibold text-forest">{t.name}</span>
                    <span className="text-charcoal-soft">{t.place}, ON</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 11 ─ FAQ */
export function FAQPreview() {
  return (
    <section className="section">
      <div className="container grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading align="left" eyebrow="Frequently asked questions" title="Answers for curious parents" intro="Starting therapy can bring up lots of questions. Here are the ones we hear most often." />
          <Reveal delay={0.15} className="mt-8 rounded-[2rem] bg-forest p-7 text-ivory">
            <Brain className="size-7 text-butter" aria-hidden />
            <p className="mt-4 font-serif text-2xl text-ivory">Still wondering if OT is right for your child?</p>
            <p className="mt-2 text-ivory/80">Give us a call — we’re happy to chat through your questions, no obligation.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="light" size="sm">
                <a href={clinic.phoneHref}>
                  <Phone aria-hidden /> {clinic.phone}
                </a>
              </Button>
              <Button asChild variant="outlineLight" size="sm">
                <Link to="/faq">All FAQs</Link>
              </Button>
            </div>
          </Reveal>
          <Squiggle className="mt-8 hidden w-28 lg:block" />
        </div>
        <Reveal delay={0.1}>
          <FAQAccordion items={faqs.slice(0, 6)} />
        </Reveal>
      </div>
    </section>
  )
}
