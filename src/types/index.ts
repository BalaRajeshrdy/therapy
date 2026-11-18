export type SessionMode = 'In-Clinic' | 'Virtual' | 'In-Home'

/** ISO calendar date in clinic time, e.g. "2026-11-12" */
export type ISODate = string
/** 24h clock time, e.g. "09:30" */
export type ClockTime = string

export type Accent = 'sage' | 'lavender' | 'peach' | 'butter'

export interface Treatment {
  id: string
  slug: string
  name: string
  shortName: string
  category: 'Occupational Therapy'
  durationMinutes: number
  mode: SessionMode
  shortDescription: string
  description: string[]
  highlights: string[]
  whatToExpect: { title: string; body: string }[]
  idealFor: string[]
  image: string
  accent: Accent
}

export interface Therapist {
  id: string
  slug: string
  firstName: string
  lastName: string
  credentials: string
  title: string
  image: string
  accent: Accent
  shortBio: string
  bio: string[]
  specializations: string[]
  languages: string[]
  ageGroups: string
  yearsExperience: number
  treatmentIds: string[]
  favouriteActivity: string
}

export interface TimeWindow {
  start: ClockTime
  end: ClockTime
}

export interface TherapistAvailability {
  therapistId: string
  /** Keyed by weekday: 0 = Sunday … 6 = Saturday */
  weekly: Partial<Record<number, TimeWindow[]>>
  /** Minutes between candidate start times (session + buffer) */
  slotStepMinutes: number
  /** Optional per-mode weekday restrictions, e.g. in-home visits only on Wednesdays */
  modeDays?: Partial<Record<SessionMode, number[]>>
  /** Percentage (0–100) of base slots pre-filled by other (mock) clients */
  mockOccupancy: number
}

export interface BlockedDate {
  id: string
  date: ISODate
  /** 'all' blocks the entire clinic */
  therapistId: string | 'all'
  reason: string
  source: 'holiday' | 'mock' | 'admin'
}

export type ClientType = 'new' | 'returning'

export interface ClientDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  childFirstName?: string
  clientType: ClientType
  sessionMode: SessionMode
  message?: string
  consent: boolean
}

export interface Booking {
  id: string
  reference: string
  treatmentId: string
  therapistId: string
  date: ISODate
  startTime: ClockTime
  endTime: ClockTime
  client: ClientDetails
  status: 'confirmed' | 'cancelled'
  createdAt: string
  updatedAt: string
  history: { at: string; action: 'booked' | 'rescheduled' | 'cancelled'; note?: string }[]
}

export interface BusyInterval {
  therapistId: string
  date: ISODate
  start: ClockTime
  end: ClockTime
  source: 'mock' | 'demo'
  bookingId?: string
}

export interface TimeSlot {
  /** Start time, 24h */
  time: ClockTime
  endTime: ClockTime
  therapistIds: string[]
}

export type TimeOfDayPreference = 'morning' | 'afternoon' | 'evening' | 'any'

export interface WaitlistEntry {
  id: string
  name: string
  email: string
  phone: string
  preferredTherapistId: string | 'any'
  preferredTreatmentId: string
  preferredDays: number[]
  preferredTime: TimeOfDayPreference
  message?: string
  createdAt: string
  status: 'waiting' | 'contacted'
}
