import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Accent } from '@/types'

/** Gentle fade-and-rise when the element scrolls into view. */
export function Reveal({ children, delay = 0, y = 24, className, ...rest }: { children: ReactNode; delay?: number; y?: number; className?: string } & HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'center',
  className,
  light,
  as: Tag = 'h2',
}: {
  eyebrow?: string
  title: ReactNode
  intro?: ReactNode
  align?: 'center' | 'left'
  className?: string
  light?: boolean
  as?: 'h1' | 'h2'
}) {
  return (
    <Reveal className={cn('flex flex-col gap-4', align === 'center' ? 'mx-auto max-w-2xl items-center text-center' : 'max-w-xl', className)}>
      {eyebrow && <span className={cn('eyebrow', light && 'text-sage-light before:bg-sage')}>{eyebrow}</span>}
      <Tag className={cn('text-balance text-[2.1rem] leading-[1.1] sm:text-5xl', light && 'text-ivory')}>{title}</Tag>
      {intro && <p className={cn('text-pretty text-lg leading-relaxed', light ? 'text-ivory/80' : 'text-charcoal-soft')}>{intro}</p>}
    </Reveal>
  )
}

const blobPaths = [
  'M421 296Q383 342 339 386Q295 430 230 443Q165 456 120 405Q75 354 56 290Q37 226 76 171Q115 116 172 77Q229 38 296 55Q363 72 404 132Q445 192 452 246Q459 300 421 296Z',
  'M437 311Q411 372 352 410Q293 448 223 441Q153 434 102 381Q51 328 52 256Q53 184 101 127Q149 70 222 58Q295 46 350 92Q405 138 434 194Q463 250 437 311Z',
  'M398 321Q378 392 309 420Q240 448 168 428Q96 408 70 335Q44 262 75 193Q106 124 176 89Q246 54 316 84Q386 114 402 182Q418 250 398 321Z',
]

export function Blob({ className, variant = 0, fill = '#A8B9A5' }: { className?: string; variant?: 0 | 1 | 2; fill?: string }) {
  return (
    <svg viewBox="0 0 500 500" aria-hidden className={cn('pointer-events-none absolute', className)}>
      <path d={blobPaths[variant]} fill={fill} />
    </svg>
  )
}

/** Hand-drawn style squiggle accent */
export function Squiggle({ className, color = '#A8B9A5' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 20" fill="none" preserveAspectRatio="none" aria-hidden className={cn('pointer-events-none h-3', className)}>
      <path d="M2 12C14 2 22 2 32 10S52 18 62 10 82 2 92 10s20 8 26 2" stroke={color} strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 5 }} />
    </svg>
  )
}

export function Sparkle({ className, color = '#294B43' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('pointer-events-none', className)}>
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" fill={color} />
    </svg>
  )
}

export const accentBg: Record<Accent, string> = {
  sage: 'bg-sage-light',
  lavender: 'bg-lavender',
  peach: 'bg-peach',
  butter: 'bg-butter',
}
export const accentHex: Record<Accent, string> = {
  sage: '#A8B9A5',
  lavender: '#D3C8E3',
  peach: '#E8CDB9',
  butter: '#EBD89A',
}

export function DemoBadge({ className, children = 'Demo' }: { className?: string; children?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-butter px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[#6b5a1f]', className)}>
      {children}
    </span>
  )
}

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 44 44" className="size-10 shrink-0" aria-hidden>
        <rect width="44" height="44" rx="14" fill={light ? '#FAF8F5' : '#294B43'} />
        <path d="M22 35V21" stroke={light ? '#294B43' : '#FAF8F5'} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M22 22.5c0-6.5 4.3-10.8 10.8-10.8 0 6.5-4.3 10.8-10.8 10.8Z" fill="#A8B9A5" />
        <path d="M22 26.5c0-5.6-3.6-9.2-9.2-9.2 0 5.6 3.6 9.2 9.2 9.2Z" fill={light ? '#E8CDB9' : '#F4E5DA'} />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={cn('font-serif text-[1.45rem] tracking-tight', light ? 'text-ivory' : 'text-forest')}>Maple Sprout</span>
        <span className={cn('mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em]', light ? 'text-sage-light' : 'text-forest-light')}>Paediatric Therapy</span>
      </span>
    </span>
  )
}
