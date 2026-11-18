import type { ClockTime, ISODate, SessionMode } from '@/types'

/* Treatment Studio — clinic operations demo. All records are fictional. */

export type Role = 'owner' | 'frontdesk' | 'therapist' | 'parent'
export interface Viewer {
  role: Role
  therapistId: string
  familyId: string
}

export type Lang = 'en' | 'fr' | 'es' | 'pa' | 'zh' | 'ar'

export interface Guardian {
  name: string
  relationship: string
  email: string
  phone: string
}

export interface Family {
  id: string
  name: string
  guardians: Guardian[]
  address: string
  city: string
  postalCode: string
  /** Approximate coordinates (fictional) used for route ordering and mileage */
  geo: { lat: number; lng: number }
  language: Lang
  preferredChannel: 'email' | 'sms'
  billing: 'per-visit' | 'monthly'
  source: 'Website' | 'Online booking' | 'Physician referral' | 'School referral' | 'Waitlist' | 'Enquiry'
  createdAt: string
}

export interface Child {
  id: string
  familyId?: string
  /** Site roster children are billed to the site */
  siteId?: string
  firstName: string
  lastName: string
  dob: ISODate
  therapistId: string
  grade?: string
  status: 'assessment' | 'active' | 'discharged'
}

export type ServiceKind = 'assessment' | 'session'
export interface StudioService {
  id: string
  name: string
  shortName: string
  kind: ServiceKind
  mode: SessionMode
  durationMinutes: number
}

export type ApptStatus = 'scheduled' | 'checked-in' | 'completed' | 'no-show' | 'late-cancel' | 'cancelled'

export interface Signature {
  name: string
  dataUrl: string
  at: string
}

export interface Appointment {
  id: string
  childId: string
  familyId: string
  therapistId: string
  serviceId: string
  date: ISODate
  start: ClockTime
  end: ClockTime
  mode: SessionMode
  status: ApptStatus
  roomId?: string
  km?: number
  checkIn?: { at: string; lat?: number; lng?: number }
  checkOut?: { at: string; lat?: number; lng?: number }
  signature?: Signature
  seriesId?: string
  packageId?: string
  remindersSent: number[]
  familyConfirmed: boolean
  flaggedForCall?: boolean
  source: 'staff' | 'online' | 'plan' | 'waitlist' | 'recurring'
  bookingRef?: string
  bookingId?: string
  invoiceId?: string
  cancelledAt?: string
  outcomeNote?: string
}

export type SiteType = 'School' | 'Hospital' | 'Daycare' | 'Agency'
export interface Site {
  id: string
  name: string
  type: SiteType
  address: string
  contact: { name: string; role: string; email: string; phone: string }
  billingEmail: string
  billingTermsDays: number
  recurrence: { weekday: number; start: ClockTime; end: ClockTime; therapistId: string; label: string }
  childIds: string[]
}

export type AttendanceStatus = 'pending' | 'present' | 'absent' | 'excused'
export interface SiteVisit {
  id: string
  siteId: string
  therapistId: string
  date: ISODate
  start: ClockTime
  end: ClockTime
  status: 'scheduled' | 'completed'
  attendance: { childId: string; status: AttendanceStatus; minutes: number }[]
  invoiceId?: string
  checkIn?: string
  checkOut?: string
}

export type Domain = 'Fine motor' | 'Gross motor' | 'Sensory' | 'Self-care' | 'Handwriting' | 'Attention & regulation'
export interface Goal {
  id: string
  childId: string
  domain: Domain
  title: string
  target: string
  createdAt: ISODate
  status: 'active' | 'met'
}
export interface GoalRating {
  id: string
  goalId: string
  date: ISODate
  score: number
  appointmentId?: string
}

export interface HomeActivity {
  id: string
  childId: string
  key: string
  title: string
  domain: Domain
  frequency: string
  completions: ISODate[]
}

export interface SoapNote {
  s: string
  o: string
  a: string
  p: string
}
export interface SessionNote {
  id: string
  appointmentId: string
  childId: string
  therapistId: string
  status: 'draft' | 'signed'
  soap: SoapNote
  aiDrafted: boolean
  createdAt: string
  signedAt?: string
}

export interface InvoiceLine {
  id: string
  description: string
  date: ISODate
  therapistId?: string
  appointmentId?: string
  siteVisitId?: string
  qty: number
  unitPrice: number
  amount: number
}

export interface Payment {
  id: string
  amount: number
  method: 'e-Transfer' | 'Credit card' | 'Debit' | 'Cash' | 'Insurance (direct)' | 'Online (demo)'
  date: ISODate
  receiptNo: string
}

export interface Invoice {
  id: string
  number: string
  billTo: { kind: 'family' | 'site'; id: string }
  lines: InvoiceLine[]
  issuedOn: ISODate
  dueOn: ISODate
  status: 'issued' | 'paid' | 'void'
  total: number
  payments: Payment[]
  reminders: { day: 7 | 14 | 30; at: string }[]
  batch: 'per-visit' | 'daily' | 'weekly' | 'monthly'
  note?: string
}

export interface SessionPackage {
  id: string
  familyId: string
  name: string
  sessions: number
  used: number
  purchasedOn: ISODate
  invoiceId?: string
}

export interface FormRequest {
  id: string
  familyId: string
  childId?: string
  kind: 'intake' | 'consent'
  status: 'requested' | 'completed'
  requestedAt: string
  completedAt?: string
  answers?: Record<string, string | boolean>
  signature?: Signature
}

export interface Enquiry {
  id: string
  name: string
  email: string
  phone: string
  topic: string
  message: string
  createdAt: string
  status: 'new' | 'intake-sent' | 'converted' | 'closed'
  source: 'Contact form' | 'Website assistant' | 'Phone'
  familyId?: string
}

export interface WaitlistOffer {
  id: string
  waitlistId: string
  name: string
  email: string
  therapistId: string
  serviceId: string
  date: ISODate
  start: ClockTime
  end: ClockTime
  offeredAt: string
  expiresAt: string
  status: 'offered' | 'accepted' | 'declined' | 'expired'
  fromAppointmentId?: string
}

export interface TreatmentPlan {
  id: string
  childId: string
  therapistId: string
  serviceId: string
  createdAt: string
  weeks: number
  options: { weekday: number; start: ClockTime }[]
  status: 'offered' | 'accepted'
  accepted?: { weekday: number; start: ClockTime }
  seriesId?: string
}

export interface Room {
  id: string
  name: string
  features: string
}

export type RuleId =
  | 'booking-confirmed'
  | 'reminders'
  | 'visit-completed'
  | 'payment-recorded'
  | 'invoice-overdue'
  | 'slot-cancelled'
  | 'assessment-done'
  | 'month-end'

export interface AutomationRule {
  id: RuleId
  trigger: string
  action: string
  enabled: boolean
}

export interface AutomationEvent {
  id: string
  at: string
  ruleId: RuleId
  title: string
  detail: string
  link?: string
}

export type MessageKind =
  | 'confirmation'
  | 'forms'
  | 'reminder'
  | 'invoice'
  | 'receipt'
  | 'overdue'
  | 'waitlist-offer'
  | 'plan'
  | 'statement'
  | 'report'
  | 'home-program'
export interface OutboxMessage {
  id: string
  at: string
  channel: 'email' | 'sms'
  familyId?: string
  to: string
  subject: string
  body: string
  lang: Lang
  kind: MessageKind
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  action: string
  target: string
}

export interface Settings {
  fees: Record<string, number>
  siteHourlyRate: number
  noShowFeePct: number
  lateCancelFeePct: number
  lateCancelHours: number
  mileageRate: number
  holdMinutes: number
  paymentTermsDays: number
  invoiceMode: 'per-visit' | 'batch'
  aiEnabled: boolean
}

export interface StudioState {
  version: 1
  seededFor: ISODate
  families: Family[]
  children: Child[]
  appointments: Appointment[]
  sites: Site[]
  siteVisits: SiteVisit[]
  goals: Goal[]
  ratings: GoalRating[]
  homeActivities: HomeActivity[]
  notes: SessionNote[]
  invoices: Invoice[]
  packages: SessionPackage[]
  forms: FormRequest[]
  enquiries: Enquiry[]
  offers: WaitlistOffer[]
  plans: TreatmentPlan[]
  rooms: Room[]
  rules: AutomationRule[]
  events: AutomationEvent[]
  outbox: OutboxMessage[]
  audit: AuditEntry[]
  settings: Settings
  importedBookings: Record<string, { status: string; date: string; start: string }>
  counters: { invoice: number; receipt: number }
  lastAutomationRun?: string
}
