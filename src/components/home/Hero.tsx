import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CalendarHeart, Leaf, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Blob, Sparkle, Squiggle } from '@/components/ui/decor'
import { images } from '@/data/images'
import { therapists } from '@/data/therapists'
import { useNextOpening } from '@/hooks/useNextOpening'
import { TherapistAvatar } from '@/components/therapists/TherapistCard'

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const reduce = useReducedMotion()
  const next = useNextOpening()
  const fade = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease } })

  return (
    <section className="relative overflow-hidden">
      <div className="grain absolute inset-0 opacity-60" aria-hidden />
      <Blob className="-right-[18rem] -top-[14rem] w-[60rem] max-w-none" fill="#F4E5DA" />
      <Blob className="-bottom-[18rem] -left-[16rem] w-[38rem] max-w-none opacity-80" variant={1} fill="#E9E3F1" />

      <div className="container relative grid items-center gap-14 pb-20 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-16">
        <div className="relative z-10">
          <motion.span {...fade(0)} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-forest shadow-soft ring-1 ring-forest/5 backdrop-blur">
            <Leaf className="size-4 text-sage-dark" aria-hidden />
            Paediatric Occupational Therapy · Mississauga, ON
          </motion.span>

          <motion.h1 {...fade(0.08)} className="mt-7 text-balance text-[2.9rem] leading-[1.02] text-forest sm:text-[4.1rem] lg:text-[4.6rem]">
            Empowering Kids for a{' '}
            <span className="relative inline-block whitespace-nowrap italic text-forest-light">
              Bright Future!
              <Squiggle className="absolute -bottom-2 left-0 -z-10 h-4 w-full sm:-bottom-3 sm:h-5" color="#A8B9A5" />
            </span>
          </motion.h1>

          <motion.p {...fade(0.16)} className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-charcoal-soft sm:text-xl">
            Helping children grow, thrive, and shine through compassionate, personalized occupational therapy.
          </motion.p>

          <motion.div {...fade(0.24)} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/booking">
                <CalendarHeart aria-hidden /> Book an Appointment
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/services">
                Explore Our Services <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </Button>
          </motion.div>

          <motion.div {...fade(0.32)} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {therapists.map((t) => (
                  <TherapistAvatar key={t.id} therapist={t} size={44} className="ring-[3px] ring-ivory" />
                ))}
              </div>
              <p className="text-sm leading-tight text-charcoal-soft">
                <span className="block font-semibold text-forest">Caring OT team</span>
                English · French · Italian · Spanish
              </p>
            </div>
            <div className="hidden h-10 w-px bg-forest/15 sm:block" aria-hidden />
            <ul className="flex flex-wrap gap-2 text-sm font-medium text-forest">
              {['Ages 18 mo – 18 yrs', 'No referral needed'].map((x) => (
                <li key={x} className="rounded-full bg-sage-light/80 px-3.5 py-1.5">
                  {x}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1, ease }}
          className="relative mx-auto w-full max-w-[520px] lg:max-w-none"
        >
          <div className="absolute inset-x-6 -bottom-4 top-10 rounded-t-full rounded-b-[3rem] bg-sage" aria-hidden />
          <div className="relative overflow-hidden rounded-t-full rounded-b-[3rem] shadow-lift">
            <img src={images.heroChild} alt="A smiling young child with colourful paint on their cheeks, enjoying creative play" className="aspect-[5/6] w-full object-cover" loading="eager" />
          </div>

          {/* rotating badge */}
          <div className="absolute -left-4 top-8 hidden size-32 sm:block lg:-left-10" aria-hidden>
            <svg viewBox="0 0 120 120" className={reduce ? '' : 'animate-[spin_22s_linear_infinite]'}>
              <defs>
                <path id="circle" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
              </defs>
              <circle cx="60" cy="60" r="58" fill="#F6EBC8" />
              <text fontSize="11.5" fontWeight="600" letterSpacing="3.2" fill="#294B43">
                <textPath href="#circle">PLAY · GROW · THRIVE · SHINE ·</textPath>
              </text>
            </svg>
            <Sparkles className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 text-forest" />
          </div>

          {next && (
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease }}
              className="absolute -right-2 top-[18%] sm:-right-6"
            >
              <Link to="/booking" className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-5 shadow-lift ring-1 ring-forest/5 backdrop-blur transition-transform hover:-translate-y-1">
                <span className="grid size-11 place-items-center rounded-xl bg-sage-light text-forest">
                  <CalendarHeart className="size-5" aria-hidden />
                </span>
                <span className="text-sm leading-tight">
                  <span className="block text-xs text-charcoal-soft">Next available</span>
                  <span className="font-semibold text-forest">{next}</span>
                </span>
              </Link>
            </motion.div>
          )}

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease }}
            className="absolute -bottom-6 left-2 flex max-w-[260px] items-center gap-3 rounded-2xl bg-forest p-3 pr-5 text-ivory shadow-lift sm:-left-8"
          >
            <img src={images.heroPlay} alt="" className="size-14 rounded-xl object-cover" />
            <span className="text-sm leading-snug">
              <span className="block font-semibold">Play-based & child-led</span>
              <span className="text-ivory/75">Therapy that feels like fun</span>
            </span>
          </motion.div>
          <Sparkle className="absolute -right-2 bottom-24 size-6 opacity-70" color="#294B43" />
        </motion.div>
      </div>
    </section>
  )
}
