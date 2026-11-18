import type { Booking, WaitlistEntry } from '@/types'

/**
 * Booking data for the demo.
 *
 * - Appointments from "other families" are generated deterministically in
 *   `src/utils/scheduling.ts` (`mockBusy`) from each therapist's
 *   `mockOccupancy`, so the calendar always looks realistically busy.
 * - Bookings made by the visitor are stored in localStorage via the demo store
 *   (`src/hooks/useDemoStore.tsx`).
 *
 * Bookings start empty so every presentation begins with a clean slate.
 */
export const seedDemoBookings: Booking[] = []

const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString()

/** Fictional families already waiting, so waitlist auto-offers have someone to match. */
export const seedWaitlist: WaitlistEntry[] = [
  { id: 'wl-seed-1', name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '(905) 555-0311', preferredTherapistId: 'any', preferredTreatmentId: 'ot-assessment-clinic', preferredDays: [], preferredTime: 'any', createdAt: daysAgo(21), status: 'waiting' },
  { id: 'wl-seed-2', name: 'Daniel Fischer', email: 'daniel.fischer@example.com', phone: '(905) 555-0312', preferredTherapistId: 'julien-tremblay', preferredTreatmentId: 'ot-assessment-home', preferredDays: [2, 6], preferredTime: 'afternoon', createdAt: daysAgo(18), status: 'waiting' },
  { id: 'wl-seed-3', name: 'Aaliyah Brown', email: 'aaliyah.brown@example.com', phone: '(905) 555-0313', preferredTherapistId: 'any', preferredTreatmentId: 'ot-assessment-home', preferredDays: [1, 3, 5], preferredTime: 'morning', createdAt: daysAgo(15), status: 'waiting' },
  { id: 'wl-seed-4', name: 'Tomás Rivera', email: 'tomas.rivera@example.com', phone: '(905) 555-0314', preferredTherapistId: 'rosa-delgado', preferredTreatmentId: 'ot-assessment-remote', preferredDays: [1, 5], preferredTime: 'morning', createdAt: daysAgo(9), status: 'waiting' },
  { id: 'wl-seed-5', name: 'Grace Liu', email: 'grace.liu@example.com', phone: '(905) 555-0315', preferredTherapistId: 'sofia-marchetti', preferredTreatmentId: 'ot-assessment-clinic', preferredDays: [3], preferredTime: 'afternoon', createdAt: daysAgo(4), status: 'waiting' },
]
