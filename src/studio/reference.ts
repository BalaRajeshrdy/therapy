import type { AutomationRule, Domain, Lang, Role, Room, Settings, StudioService } from './types'
import { therapists } from '@/data/therapists'

export const platformName = 'Treatment Studio'

/** Studio services: the four public assessment types plus ongoing therapy sessions. */
export const services: StudioService[] = [
  { id: 'ot-assessment-clinic', name: 'OT Assessment – In-Clinic', shortName: 'Assessment · Clinic', kind: 'assessment', mode: 'In-Clinic', durationMinutes: 60 },
  { id: 'ot-assessment-remote', name: 'OT Assessment – Remote', shortName: 'Assessment · Virtual', kind: 'assessment', mode: 'Virtual', durationMinutes: 60 },
  { id: 'ot-assessment-home', name: 'OT Assessment – In-Home', shortName: 'Assessment · Home', kind: 'assessment', mode: 'In-Home', durationMinutes: 60 },
  { id: 'ot-assessment-home-extended', name: 'OT Assessment – In-Home (Extended)', shortName: 'Assessment · Home 2h', kind: 'assessment', mode: 'In-Home', durationMinutes: 120 },
  { id: 'ot-session-clinic', name: 'OT Session – In-Clinic', shortName: 'Session · Clinic', kind: 'session', mode: 'In-Clinic', durationMinutes: 45 },
  { id: 'ot-session-virtual', name: 'OT Session – Virtual', shortName: 'Session · Virtual', kind: 'session', mode: 'Virtual', durationMinutes: 45 },
  { id: 'ot-session-home', name: 'OT Session – In-Home', shortName: 'Session · Home', kind: 'session', mode: 'In-Home', durationMinutes: 60 },
]
export const serviceById = (id?: string) => services.find((s) => s.id === id)

export const rooms: Room[] = [
  { id: 'gym', name: 'Sensory Gym', features: 'Swings, climbing wall, crash mats' },
  { id: 'room-a', name: 'Room A · Fine Motor', features: 'Low tables, writing station' },
  { id: 'room-b', name: 'Room B · Quiet Room', features: 'Dimmable lights, calm corner' },
  { id: 'tele', name: 'Telehealth Booth', features: 'Camera, headset, document camera' },
]
export const roomById = (id?: string) => rooms.find((r) => r.id === id)

/** Placeholder demo fee schedule (CAD). Not real prices — the clinic sets its own in Settings. */
export const defaultSettings: Settings = {
  fees: {
    'ot-assessment-clinic': 200,
    'ot-assessment-remote': 180,
    'ot-assessment-home': 220,
    'ot-assessment-home-extended': 360,
    'ot-session-clinic': 140,
    'ot-session-virtual': 130,
    'ot-session-home': 165,
  },
  siteHourlyRate: 120,
  noShowFeePct: 100,
  lateCancelFeePct: 50,
  lateCancelHours: 24,
  mileageRate: 0.7,
  holdMinutes: 120,
  paymentTermsDays: 14,
  invoiceMode: 'per-visit',
  aiEnabled: true,
}

export const defaultRules: AutomationRule[] = [
  { id: 'booking-confirmed', trigger: 'Booking confirmed', action: 'Confirmation sent, intake & consent forms requested', enabled: true },
  { id: 'reminders', trigger: '48 h and 24 h before', action: 'Reminders; unconfirmed visits flagged for a call', enabled: true },
  { id: 'visit-completed', trigger: 'Visit completed', action: 'Note task created; invoice generated', enabled: true },
  { id: 'payment-recorded', trigger: 'Payment recorded', action: 'Insurance receipt issued to the family', enabled: true },
  { id: 'invoice-overdue', trigger: 'Invoice overdue', action: 'Polite reminders at 7, 14 and 30 days', enabled: true },
  { id: 'slot-cancelled', trigger: 'Slot cancelled', action: 'Offered to matching waitlist families with a hold timer', enabled: true },
  { id: 'assessment-done', trigger: 'Assessment done', action: 'Treatment plan with weekly slots offered', enabled: true },
  { id: 'month-end', trigger: '1st of the month', action: 'Owner report and family statements generated', enabled: true },
]

export const domains: Domain[] = ['Fine motor', 'Gross motor', 'Sensory', 'Self-care', 'Handwriting', 'Attention & regulation']

export const languages: Record<Lang, { label: string; native: string; dir?: 'rtl' }> = {
  en: { label: 'English', native: 'English' },
  fr: { label: 'French', native: 'Français' },
  es: { label: 'Spanish', native: 'Español' },
  pa: { label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  zh: { label: 'Mandarin (Simplified)', native: '简体中文' },
  ar: { label: 'Arabic', native: 'العربية', dir: 'rtl' },
}

/** Fictional staff personas for the role switcher. */
export const staff = {
  owner: { name: 'Priya Shah', title: 'Clinic owner' },
  frontdesk: { name: 'Marcus Bell', title: 'Front desk coordinator' },
}

/** Placeholder professional details printed on receipts. NOT real registration numbers. */
export const therapistProfessional: Record<string, { designation: string; regNo: string }> = Object.fromEntries(
  therapists.map((t, i) => [t.id, { designation: 'OT Reg. (Ont.)', regNo: `DEMO-${10421 + i * 117}` }]),
)

export const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  frontdesk: 'Front desk',
  therapist: 'Therapist',
  parent: 'Parent',
}

/** Role-based access: which areas each role can open. */
export type Area =
  | 'dashboard'
  | 'flow'
  | 'schedule'
  | 'rooms'
  | 'visits'
  | 'sites'
  | 'clients'
  | 'progress'
  | 'notes'
  | 'billing'
  | 'waitlist'
  | 'enquiries'
  | 'automation'
  | 'ai'
  | 'mileage'
  | 'settings'
  | 'audit'
  | 'family'

export const permissions: Record<Area, Role[]> = {
  dashboard: ['owner'],
  flow: ['owner', 'frontdesk'],
  schedule: ['owner', 'frontdesk', 'therapist'],
  rooms: ['owner', 'frontdesk'],
  visits: ['owner', 'frontdesk', 'therapist'],
  sites: ['owner', 'frontdesk', 'therapist'],
  clients: ['owner', 'frontdesk', 'therapist'],
  progress: ['owner', 'therapist'],
  notes: ['owner', 'therapist'],
  billing: ['owner', 'frontdesk'],
  waitlist: ['owner', 'frontdesk'],
  enquiries: ['owner', 'frontdesk'],
  automation: ['owner', 'frontdesk'],
  ai: ['owner', 'frontdesk', 'therapist'],
  mileage: ['owner', 'therapist'],
  settings: ['owner'],
  audit: ['owner'],
  family: ['parent'],
}
export const can = (role: Role, area: Area) => permissions[area].includes(role)

export const areaLabels: Record<Area, string> = {
  dashboard: 'Owner dashboard',
  flow: 'Clinic flow',
  schedule: 'Schedule',
  rooms: 'Room booking',
  visits: 'Home visits',
  sites: 'Sites & attendance',
  clients: 'Families',
  progress: 'Goals & progress',
  notes: 'Session notes',
  billing: 'Billing',
  waitlist: 'Waitlist',
  enquiries: 'Enquiries & intake',
  automation: 'Automation',
  ai: 'AI assistant',
  mileage: 'Mileage',
  settings: 'Settings',
  audit: 'Audit trail',
  family: 'Parent portal',
}

/** Validated categorical chart palette (dataviz reference slots 1–4). */
export const seriesColors = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100']
