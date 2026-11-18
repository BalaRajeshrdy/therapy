import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock, Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react'
import { Logo, Blob } from '@/components/ui/decor'
import { clinic, fullAddress } from '@/data/clinic'
import { treatments } from '@/data/treatments'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative overflow-hidden bg-forest-dark text-ivory/80">
      <Blob className="-right-40 -top-40 w-[520px] opacity-[0.07]" fill="#A8B9A5" />
      <Blob className="-bottom-56 -left-40 w-[460px] opacity-[0.06]" variant={1} fill="#F4E5DA" />
      <div className="container relative grid gap-12 py-16 sm:py-20 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo light />
          <p className="mt-6 max-w-sm leading-relaxed">{clinic.shortDescription}</p>
          <div className="mt-6 flex gap-3">
            {[
              { Icon: Instagram, label: 'Instagram' },
              { Icon: Facebook, label: 'Facebook' },
              { Icon: Linkedin, label: 'LinkedIn' },
            ].map(({ Icon, label }) => (
              <a key={label} href="#" aria-label={`${label} (demo link)`} className="grid size-10 place-items-center rounded-full bg-ivory/10 transition-colors hover:bg-ivory/20 hover:text-white">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-sage-light">Explore</h2>
          <ul className="mt-5 space-y-3">
            {[
              ['/about', 'About Us'],
              ['/services', 'Our Services'],
              ['/therapists', 'Our Therapists'],
              ['/faq', 'FAQs'],
              ['/contact', 'Contact'],
              ['/manage-booking', 'Manage Booking'],
              ['/studio', 'Clinic system demo'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-sage-light">Services</h2>
          <ul className="mt-5 space-y-3">
            {treatments.map((t) => (
              <li key={t.id}>
                <Link to={`/services/${t.slug}`} className="transition-colors hover:text-white">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-sage-light">Visit Us</h2>
          <ul className="mt-5 space-y-4 text-[0.95rem]">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
              {fullAddress}
            </li>
            <li>
              <a href={clinic.phoneHref} className="flex gap-3 hover:text-white">
                <Phone className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
                {clinic.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${clinic.email}`} className="flex gap-3 break-all hover:text-white">
                <Mail className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
                {clinic.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
              <span>Mon–Thu 9–7 · Fri 8:30–3 · Sat 9–1</span>
            </li>
          </ul>
          <Link to="/booking" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-butter hover:text-white">
            Book an appointment <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="relative border-t border-ivory/10">
        <div className="container flex flex-col gap-3 py-6 text-xs text-ivory/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {clinic.fullName}. Demonstration website — fictional clinic, therapists and testimonials. Photos via Unsplash.
          </p>
          <div className="flex gap-5">
            <Link to="/demo-admin" className="hover:text-white">
              Demo admin
            </Link>
            <span>Privacy</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
