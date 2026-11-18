import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { AssistantWidget } from './AssistantWidget'
import { clinic } from '@/data/clinic'

const titles: [RegExp, string][] = [
  [/^\/$/, `${clinic.fullName} | Mississauga, ON`],
  [/^\/about/, 'About Us'],
  [/^\/services\/.+/, 'Service Details'],
  [/^\/services/, 'Our Services'],
  [/^\/therapists\/.+/, 'Therapist Profile'],
  [/^\/therapists/, 'Our Therapists'],
  [/^\/faq/, 'Frequently Asked Questions'],
  [/^\/contact/, 'Contact Us'],
  [/^\/booking\/confirmation/, 'Booking Confirmed'],
  [/^\/booking/, 'Book an Appointment'],
  [/^\/manage-booking/, 'Manage Your Booking'],
  [/^\/waitlist/, 'Join Our Waitlist'],
  [/^\/demo-admin/, 'Demo Admin'],
]

export function Layout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  useEffect(() => {
    const match = titles.find(([re]) => re.test(pathname))?.[1]
    document.title = match && pathname !== '/' ? `${match} | ${clinic.fullName}` : match ?? clinic.fullName
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col [overflow-x:clip]">
      <Header />
      <main id="main" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <AssistantWidget />
    </div>
  )
}
