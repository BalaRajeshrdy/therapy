import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Blob, Sparkle } from '@/components/ui/decor'
import { cn } from '@/lib/utils'

export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  image,
  children,
  tone = 'peach',
}: {
  eyebrow: string
  title: ReactNode
  intro?: ReactNode
  crumbs: { to?: string; label: string }[]
  image?: string
  children?: ReactNode
  tone?: 'peach' | 'lavender' | 'sage' | 'butter'
}) {
  const reduce = useReducedMotion()
  const fill = { peach: '#F4E5DA', lavender: '#E9E3F1', sage: '#DCE5DA', butter: '#F6EBC8' }[tone]
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-20 sm:pt-14">
      <Blob className="-right-32 -top-48 w-[640px] opacity-90" fill={fill} />
      <Blob className="-bottom-60 -left-48 w-[420px] opacity-60" variant={2} fill={fill} />
      <Sparkle className="absolute left-[8%] top-24 hidden size-5 opacity-30 lg:block" />
      <div className={cn('container relative grid items-center gap-12', image && 'lg:grid-cols-[1.1fr_0.9fr]')}>
        <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-charcoal-soft">
              {crumbs.map((c, i) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  {c.to ? (
                    <Link to={c.to} className="hover:text-forest hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-forest">
                      {c.label}
                    </span>
                  )}
                  {i < crumbs.length - 1 && <ChevronRight className="size-3.5" aria-hidden />}
                </li>
              ))}
            </ol>
          </nav>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-4 max-w-3xl text-balance text-[2.6rem] leading-[1.05] sm:text-6xl">{title}</h1>
          {intro && <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-charcoal-soft">{intro}</p>}
          {children && <div className="mt-8">{children}</div>}
        </motion.div>
        {image && (
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="overflow-hidden rounded-[2.5rem] rounded-tr-[7rem] shadow-lift">
              <img src={image} alt="" className="aspect-[5/4] w-full object-cover" />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
