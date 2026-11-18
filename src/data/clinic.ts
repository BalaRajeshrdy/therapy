/**
 * Central clinic configuration.
 *
 * This demo uses an ORIGINAL FICTIONAL clinic identity. Replace these values with
 * the real business name, address and contact details only once the clinic has
 * authorized their use.
 */
export const clinic = {
  name: 'Maple Sprout',
  fullName: 'Maple Sprout Paediatric Therapy',
  tagline: 'Paediatric Occupational Therapy',
  shortDescription:
    'Compassionate, play-based occupational therapy for children and families across Mississauga and the Peel Region.',
  address: {
    line1: '2150 Meadowvale Crescent, Unit 4',
    city: 'Mississauga',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCode: 'L5N 0A1',
    country: 'Canada',
  },
  phone: '(905) 555-0148',
  phoneHref: 'tel:+19055550148',
  email: 'hello@maplesprout.example',
  timezone: 'America/Toronto',
  locale: 'en-CA',
  currency: 'CAD',
  hours: [
    { days: 'Monday – Thursday', hours: '9:00 a.m. – 7:00 p.m.' },
    { days: 'Friday', hours: '8:30 a.m. – 3:00 p.m.' },
    { days: 'Saturday', hours: '9:00 a.m. – 1:00 p.m.' },
    { days: 'Sunday', hours: 'Closed' },
  ],
  serviceArea: ['Mississauga', 'Brampton', 'Oakville', 'Milton', 'Etobicoke'],
  bookingHorizonDays: 75,
  social: {
    instagram: '#',
    facebook: '#',
    linkedin: '#',
  },
  isDemo: true,
} as const

export const fullAddress = `${clinic.address.line1}, ${clinic.address.city}, ${clinic.address.provinceCode} ${clinic.address.postalCode}`
