import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Layout } from '@/components/layout/Layout'
import { DemoStoreProvider } from '@/hooks/useDemoStore'
import { StudioProvider } from '@/studio/store'
import { StudioLayout, StudioIndex } from '@/studio/layout'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'

const About = lazy(() => import('@/pages/About'))
const Services = lazy(() => import('@/pages/Services'))
const ServiceDetails = lazy(() => import('@/pages/ServiceDetails'))
const Therapists = lazy(() => import('@/pages/Therapists'))
const TherapistDetails = lazy(() => import('@/pages/TherapistDetails'))
const Contact = lazy(() => import('@/pages/Contact'))
const FAQ = lazy(() => import('@/pages/FAQ'))
const Booking = lazy(() => import('@/pages/Booking'))
const BookingConfirmation = lazy(() => import('@/pages/BookingConfirmation'))
const ManageBooking = lazy(() => import('@/pages/ManageBooking'))
const Waitlist = lazy(() => import('@/pages/Waitlist'))
const DemoAdmin = lazy(() => import('@/pages/DemoAdmin'))

/* Treatment Studio (clinic system demo) */
const Dashboard = lazy(() => import('@/studio/pages/Dashboard'))
const Flow = lazy(() => import('@/studio/pages/Flow'))
const Visits = lazy(() => import('@/studio/pages/Visits'))
const Schedule = lazy(() => import('@/studio/pages/Schedule'))
const Rooms = lazy(() => import('@/studio/pages/Schedule').then((m) => ({ default: m.Rooms })))
const Sites = lazy(() => import('@/studio/pages/Sites'))
const SiteDetail = lazy(() => import('@/studio/pages/Sites').then((m) => ({ default: m.SiteDetail })))
const SiteVisitPage = lazy(() => import('@/studio/pages/Sites').then((m) => ({ default: m.SiteVisitPage })))
const TermReport = lazy(() => import('@/studio/pages/Sites').then((m) => ({ default: m.TermReport })))
const Clients = lazy(() => import('@/studio/pages/Clients'))
const FamilyDetail = lazy(() => import('@/studio/pages/Clients').then((m) => ({ default: m.FamilyDetail })))
const ChildDetail = lazy(() => import('@/studio/pages/Clients').then((m) => ({ default: m.ChildDetail })))
const Notes = lazy(() => import('@/studio/pages/Notes'))
const NoteEditor = lazy(() => import('@/studio/pages/Notes').then((m) => ({ default: m.NoteEditor })))
const Billing = lazy(() => import('@/studio/pages/Billing'))
const InvoiceDetail = lazy(() => import('@/studio/pages/Billing').then((m) => ({ default: m.InvoiceDetail })))
const OwnerReport = lazy(() => import('@/studio/pages/Documents').then((m) => ({ default: m.OwnerReport })))
const ProgressReportPage = lazy(() => import('@/studio/pages/Documents').then((m) => ({ default: m.ProgressReportPage })))
const StatementPage = lazy(() => import('@/studio/pages/Documents').then((m) => ({ default: m.StatementPage })))
const WaitlistPage = lazy(() => import('@/studio/pages/Ops').then((m) => ({ default: m.WaitlistPage })))
const EnquiriesPage = lazy(() => import('@/studio/pages/Ops').then((m) => ({ default: m.EnquiriesPage })))
const AutomationPage = lazy(() => import('@/studio/pages/Ops').then((m) => ({ default: m.AutomationPage })))
const MileagePage = lazy(() => import('@/studio/pages/Ops').then((m) => ({ default: m.MileagePage })))
const SettingsPage = lazy(() => import('@/studio/pages/Ops').then((m) => ({ default: m.SettingsPage })))
const AuditPage = lazy(() => import('@/studio/pages/Ops').then((m) => ({ default: m.AuditPage })))
const AIStudio = lazy(() => import('@/studio/pages/AIStudio'))
const FamilyHome = lazy(() => import('@/studio/pages/Family').then((m) => ({ default: m.FamilyHome })))
const FamilyProgress = lazy(() => import('@/studio/pages/Family').then((m) => ({ default: m.FamilyProgress })))
const FamilyBilling = lazy(() => import('@/studio/pages/Family').then((m) => ({ default: m.FamilyBilling })))
const FamilyForms = lazy(() => import('@/studio/pages/Family').then((m) => ({ default: m.FamilyForms })))
const FamilyMessages = lazy(() => import('@/studio/pages/Family').then((m) => ({ default: m.FamilyMessages })))

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading page">
      <span className="size-10 animate-spin rounded-full border-4 border-sage-light border-t-forest" />
    </div>
  )
}

const s = (el: React.ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: s(<About />) },
      { path: '/services', element: s(<Services />) },
      { path: '/services/:slug', element: s(<ServiceDetails />) },
      { path: '/therapists', element: s(<Therapists />) },
      { path: '/therapists/:slug', element: s(<TherapistDetails />) },
      { path: '/contact', element: s(<Contact />) },
      { path: '/faq', element: s(<FAQ />) },
      { path: '/booking', element: s(<Booking />) },
      { path: '/booking/confirmation/:reference', element: s(<BookingConfirmation />) },
      { path: '/manage-booking', element: s(<ManageBooking />) },
      { path: '/manage-booking/:reference', element: s(<ManageBooking />) },
      { path: '/waitlist', element: s(<Waitlist />) },
      { path: '/demo-admin', element: s(<DemoAdmin />) },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/studio',
    element: <StudioLayout />,
    children: [
      { index: true, element: <StudioIndex /> },
      { path: 'dashboard', element: s(<Dashboard />) },
      { path: 'report', element: s(<OwnerReport />) },
      { path: 'flow', element: s(<Flow />) },
      { path: 'visits', element: s(<Visits />) },
      { path: 'schedule', element: s(<Schedule />) },
      { path: 'rooms', element: s(<Rooms />) },
      { path: 'sites', element: s(<Sites />) },
      { path: 'sites/:id', element: s(<SiteDetail />) },
      { path: 'sites/:id/report', element: s(<TermReport />) },
      { path: 'site-visits/:id', element: s(<SiteVisitPage />) },
      { path: 'clients', element: s(<Clients />) },
      { path: 'clients/:id', element: s(<FamilyDetail />) },
      { path: 'children/:id', element: s(<ChildDetail />) },
      { path: 'children/:id/report', element: s(<ProgressReportPage />) },
      { path: 'notes', element: s(<Notes />) },
      { path: 'notes/:apptId', element: s(<NoteEditor />) },
      { path: 'billing', element: s(<Billing />) },
      { path: 'invoices/:id', element: s(<InvoiceDetail />) },
      { path: 'statements/:familyId', element: s(<StatementPage />) },
      { path: 'waitlist', element: s(<WaitlistPage />) },
      { path: 'enquiries', element: s(<EnquiriesPage />) },
      { path: 'automation', element: s(<AutomationPage />) },
      { path: 'ai', element: s(<AIStudio />) },
      { path: 'mileage', element: s(<MileagePage />) },
      { path: 'settings', element: s(<SettingsPage />) },
      { path: 'audit', element: s(<AuditPage />) },
      { path: 'family', element: s(<FamilyHome />) },
      { path: 'family/progress', element: s(<FamilyProgress />) },
      { path: 'family/billing', element: s(<FamilyBilling />) },
      { path: 'family/forms', element: s(<FamilyForms />) },
      { path: 'family/messages', element: s(<FamilyMessages />) },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <DemoStoreProvider>
        <StudioProvider>
          <RouterProvider router={router} />
        </StudioProvider>
      </DemoStoreProvider>
    </MotionConfig>
  )
}
