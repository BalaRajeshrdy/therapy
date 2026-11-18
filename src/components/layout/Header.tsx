import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarHeart, Menu, Phone, X, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/decor'
import { clinic } from '@/data/clinic'
import { cn } from '@/lib/utils'

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Our Services' },
  { to: '/therapists', label: 'Our Therapists' },
  { to: '/faq', label: 'FAQs' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <div className="no-print bg-forest text-ivory">
        <div className="container flex h-10 items-center justify-between gap-4 text-[0.8rem]">
          <p className="min-w-0 truncate">
            <span className="mr-2 rounded-full bg-butter px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#5a4b17]">Demo</span>
            <span className="text-ivory/85">Fictional clinic for presentation — no real bookings are made.</span>
          </p>
          <Link to="/studio" className="shrink-0 rounded-full bg-ivory/10 px-3 py-1 text-[0.75rem] font-semibold text-ivory hover:bg-ivory/20">
            Clinic system demo →
          </Link>
          <div className="hidden items-center gap-5 text-ivory/85 lg:flex">
            <a href={clinic.phoneHref} className="flex items-center gap-1.5 hover:text-white">
              <Phone className="size-3.5" aria-hidden /> {clinic.phone}
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden /> {clinic.address.city}, {clinic.address.provinceCode}
            </span>
          </div>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-300',
          scrolled ? 'border-b border-forest/10 bg-ivory/85 shadow-[0_8px_30px_-20px_rgba(41,75,67,0.35)] backdrop-blur-xl' : 'bg-ivory',
        )}
      >
        <a href="#main" className="sr-only rounded-full bg-forest px-4 py-2 text-ivory focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50">
          Skip to content
        </a>
        <div className={cn('container flex items-center justify-between gap-6 transition-all duration-300', scrolled ? 'h-[72px]' : 'h-[84px]')}>
          <Link to="/" aria-label={`${clinic.fullName} — home`}>
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'relative rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors',
                        isActive ? 'text-forest' : 'text-charcoal-soft hover:text-forest',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {l.label}
                        {isActive && (
                          <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-sage-light" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/booking">
                <CalendarHeart aria-hidden /> Book Appointment
              </Link>
            </Button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full bg-sage-light text-forest transition-colors hover:bg-sage/60 xl:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-ivory xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-peach/70 blur-2xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-lavender/80 blur-2xl" aria-hidden />
            <div className="container relative flex h-[84px] items-center justify-between">
              <Link to="/" aria-label="Home">
                <Logo />
              </Link>
              <button type="button" className="grid size-11 place-items-center rounded-full bg-forest text-ivory" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="container relative mt-4 flex-1 overflow-y-auto">
              <ul className="flex flex-col">
                {[...navLinks, { to: '/manage-booking', label: 'Manage Booking' }].map((l, i) => (
                  <motion.li key={l.to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                    <NavLink
                      to={l.to}
                      end={l.to === '/'}
                      className={({ isActive }) =>
                        cn('flex items-center justify-between border-b border-forest/10 py-4 font-serif text-[1.9rem] leading-tight', isActive ? 'text-forest' : 'text-forest/70')
                      }
                    >
                      {l.label}
                      <span className="text-base font-sans text-sage-dark" aria-hidden>
                        0{i + 1}
                      </span>
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="container relative flex flex-col gap-3 pb-8 pt-6">
              <Button asChild size="lg" className="w-full">
                <Link to="/booking">
                  <CalendarHeart aria-hidden /> Book an Appointment
                </Link>
              </Button>
              <div className="flex justify-center gap-6 text-sm text-charcoal-soft">
                <a href={clinic.phoneHref} className="flex items-center gap-1.5">
                  <Phone className="size-4" aria-hidden /> {clinic.phone}
                </a>
                <a href={`mailto:${clinic.email}`} className="flex items-center gap-1.5">
                  <Mail className="size-4" aria-hidden /> Email us
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
