import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  Car,
  ClipboardList,
  DoorOpen,
  FileSignature,
  GitBranch,
  Home,
  Inbox,
  ListChecks,
  Lock,
  MessageSquare,
  NotebookPen,
  Receipt,
  Route,
  ScrollText,
  Settings as SettingsIcon,
  ShieldCheck,
  TrendingUp,
  Users,
  Workflow,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { therapists, fullName } from '@/data/therapists'
import { useStudio } from './store'
import { areaLabels, can, permissions, platformName, roleLabels, type Area } from './reference'
import type { Role } from './types'
import { Card } from './ui'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  area: Area
  end?: boolean
}

const staffNav: NavItem[] = [
  { to: '/studio/dashboard', label: 'Owner dashboard', icon: BarChart3, area: 'dashboard' },
  { to: '/studio/flow', label: 'Clinic flow', icon: GitBranch, area: 'flow' },
  { to: '/studio/visits', label: 'Today’s visits', icon: Route, area: 'visits' },
  { to: '/studio/schedule', label: 'Schedule', icon: CalendarDays, area: 'schedule' },
  { to: '/studio/rooms', label: 'Rooms', icon: DoorOpen, area: 'rooms' },
  { to: '/studio/sites', label: 'Sites & attendance', icon: Building2, area: 'sites' },
  { to: '/studio/clients', label: 'Families', icon: Users, area: 'clients' },
  { to: '/studio/notes', label: 'Session notes', icon: NotebookPen, area: 'notes' },
  { to: '/studio/billing', label: 'Billing', icon: Receipt, area: 'billing' },
  { to: '/studio/waitlist', label: 'Waitlist', icon: ListChecks, area: 'waitlist' },
  { to: '/studio/enquiries', label: 'Enquiries & intake', icon: Inbox, area: 'enquiries' },
  { to: '/studio/automation', label: 'Automation', icon: Workflow, area: 'automation' },
  { to: '/studio/ai', label: 'AI assistant', icon: Bot, area: 'ai' },
  { to: '/studio/mileage', label: 'Mileage', icon: Car, area: 'mileage' },
  { to: '/studio/settings', label: 'Settings & access', icon: SettingsIcon, area: 'settings' },
  { to: '/studio/audit', label: 'Audit trail', icon: ScrollText, area: 'audit' },
]

const parentNav: NavItem[] = [
  { to: '/studio/family', label: 'Family home', icon: Home, area: 'family', end: true },
  { to: '/studio/family/progress', label: 'Goals & progress', icon: TrendingUp, area: 'family' },
  { to: '/studio/family/billing', label: 'Invoices & receipts', icon: Receipt, area: 'family' },
  { to: '/studio/family/forms', label: 'Forms & consent', icon: FileSignature, area: 'family' },
  { to: '/studio/family/messages', label: 'Messages', icon: MessageSquare, area: 'family' },
]

export const roleHome: Record<Role, string> = {
  owner: '/studio/dashboard',
  frontdesk: '/studio/flow',
  therapist: '/studio/visits',
  parent: '/studio/family',
}

function RoleSwitcher() {
  const { viewer, setViewer, s } = useStudio()
  const roles: Role[] = ['owner', 'frontdesk', 'therapist', 'parent']
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="View the demo as" className="flex rounded-full bg-forest-dark/40 p-1">
        {roles.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={viewer.role === r}
            onClick={() => setViewer({ role: r })}
            className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm', viewer.role === r ? 'bg-ivory text-forest' : 'text-ivory/80 hover:text-white')}
          >
            {roleLabels[r]}
          </button>
        ))}
      </div>
      {viewer.role === 'therapist' && (
        <label className="flex items-center gap-2 text-xs text-ivory/80">
          <select aria-label="Therapist" value={viewer.therapistId} onChange={(e) => setViewer({ therapistId: e.target.value })} className="h-9 rounded-full border-0 bg-ivory/15 px-3 text-sm font-semibold text-ivory focus:outline-none focus:ring-2 focus:ring-ivory/60 [&>option]:text-charcoal">
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {fullName(t)}
              </option>
            ))}
          </select>
        </label>
      )}
      {viewer.role === 'parent' && (
        <label className="flex items-center gap-2 text-xs text-ivory/80">
          <select aria-label="Family" value={viewer.familyId} onChange={(e) => setViewer({ familyId: e.target.value })} className="h-9 rounded-full border-0 bg-ivory/15 px-3 text-sm font-semibold text-ivory focus:outline-none focus:ring-2 focus:ring-ivory/60 [&>option]:text-charcoal">
            {s.families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.guardians[0].name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

export function StudioLayout() {
  const { viewer, actor } = useStudio()
  const { pathname } = useLocation()
  const nav = viewer.role === 'parent' ? parentNav : staffNav.filter((n) => can(viewer.role, n.area))

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  useEffect(() => {
    const item = [...staffNav, ...parentNav].find((n) => pathname.startsWith(n.to))
    document.title = `${item?.label ?? 'Treatment Studio'} | ${platformName} demo`
  }, [pathname])

  return (
    <div className="min-h-dvh bg-[#F4F1EC] [overflow-x:clip]">
      <a href="#studio-main" className="sr-only rounded-full bg-forest px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50">
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-30 bg-forest text-ivory shadow-[0_8px_30px_-20px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to={roleHome[viewer.role]} className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-ivory text-forest">
                <ClipboardList className="size-5" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block font-serif text-lg">{platformName}</span>
                <span className="block text-[0.7rem] uppercase tracking-[0.14em] text-sage-light">Maple Sprout · clinic system</span>
              </span>
            </Link>
            <span className="hidden rounded-full bg-butter px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#5a4b17] sm:inline">Demo · fictional data</span>
          </div>
          <RoleSwitcher />
        </div>
        <nav aria-label="Studio" className="flex gap-1 overflow-x-auto border-t border-ivory/10 px-3 py-2 lg:hidden">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium', isActive ? 'bg-ivory text-forest' : 'text-ivory/80')}>
              <n.icon className="size-4" aria-hidden />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="flex">
        <aside className="no-print sticky top-[64px] hidden h-[calc(100dvh-64px)] w-64 shrink-0 flex-col overflow-y-auto border-r border-forest/10 bg-white/60 px-3 py-5 lg:flex" aria-label="Studio navigation">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-charcoal-soft">Signed in as</p>
          <p className="mb-4 px-3 text-sm font-semibold text-forest">{actor}</p>
          <nav aria-label="Studio sections">
            <ul className="space-y-0.5">
              {nav.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2 text-[0.92rem] font-medium transition-colors', isActive ? 'bg-forest text-ivory' : 'text-charcoal hover:bg-sage-light/60 hover:text-forest')}
                  >
                    <n.icon className="size-4 shrink-0" aria-hidden />
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto space-y-2 px-3 pt-6 text-xs text-charcoal-soft">
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-forest" aria-hidden /> Role-based access · every action audited
            </p>
            <Link to="/" className="flex items-center gap-1.5 font-semibold text-forest hover:underline">
              <ArrowLeft className="size-3.5" aria-hidden /> Back to public website
            </Link>
          </div>
        </aside>

        <main id="studio-main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function StudioIndex() {
  const { viewer } = useStudio()
  return <Navigate to={roleHome[viewer.role]} replace />
}

export function Guard({ area, children }: { area: Area; children: ReactNode }) {
  const { viewer } = useStudio()
  if (can(viewer.role, area)) return <>{children}</>
  return (
    <Card className="mx-auto mt-10 max-w-lg text-center">
      <Lock className="mx-auto size-8 text-terracotta" aria-hidden />
      <h1 className="mt-3 font-serif text-2xl text-forest">Not available for the {roleLabels[viewer.role].toLowerCase()} role</h1>
      <p className="mt-2 text-sm text-charcoal-soft">
        {areaLabels[area]} is limited to: {permissions[area].map((r) => roleLabels[r]).join(', ')}. Switch roles at the top to explore it.
      </p>
      <Link to={roleHome[viewer.role]} className="mt-5 inline-block font-semibold text-forest underline-offset-4 hover:underline">
        Go to your home screen
      </Link>
    </Card>
  )
}
