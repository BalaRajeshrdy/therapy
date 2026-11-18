import type { TherapistAvailability } from '@/types'

/**
 * Mock weekly schedules. Each therapist works different days and hours, so the
 * booking calendar changes noticeably when you switch therapist.
 * Weekdays: 0 = Sunday … 6 = Saturday.
 */
export const therapistAvailability: TherapistAvailability[] = [
  {
    therapistId: 'sofia-marchetti',
    weekly: {
      1: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
      3: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:30' },
      ],
      5: [{ start: '09:00', end: '13:00' }],
    },
    slotStepMinutes: 90,
    modeDays: { 'In-Home': [3, 5] },
    mockOccupancy: 40,
  },
  {
    therapistId: 'julien-tremblay',
    weekly: {
      2: [
        { start: '09:00', end: '12:30' },
        { start: '13:30', end: '18:00' },
      ],
      4: [
        { start: '09:00', end: '12:30' },
        { start: '13:30', end: '18:00' },
      ],
      6: [{ start: '09:00', end: '13:00' }],
    },
    slotStepMinutes: 75,
    modeDays: { 'In-Home': [4, 6] },
    mockOccupancy: 35,
  },
  {
    therapistId: 'leah-thompson',
    weekly: {
      1: [{ start: '12:00', end: '19:00' }],
      2: [{ start: '09:00', end: '15:00' }],
      4: [{ start: '12:00', end: '19:00' }],
    },
    slotStepMinutes: 60,
    mockOccupancy: 45,
  },
  {
    therapistId: 'rosa-delgado',
    weekly: {
      1: [{ start: '08:30', end: '12:30' }],
      3: [
        { start: '08:30', end: '12:30' },
        { start: '13:30', end: '16:30' },
      ],
      5: [{ start: '08:30', end: '15:00' }],
    },
    slotStepMinutes: 90,
    modeDays: { 'In-Home': [1, 5] },
    mockOccupancy: 30,
  },
]

export const availabilityFor = (therapistId: string) =>
  therapistAvailability.find((a) => a.therapistId === therapistId)

/**
 * Mock "blocked" days (professional development, school visits, etc.).
 * A therapist's working day is blocked when a stable hash of (therapist, date)
 * falls into the bucket below, so blocked days are deterministic and keep
 * appearing as time moves forward.
 */
export const mockBlockRules: Record<string, { every: number; reason: string }> = {
  'sofia-marchetti': { every: 11, reason: 'Professional development day' },
  'julien-tremblay': { every: 13, reason: 'School consultation visits' },
  'leah-thompson': { every: 10, reason: 'Out of office' },
  'rosa-delgado': { every: 12, reason: 'Community outreach day' },
}
