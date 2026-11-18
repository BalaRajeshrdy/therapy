import type { Booking } from '@/types'
import { clinic, fullAddress } from '@/data/clinic'
import { treatmentById } from '@/data/treatments'
import { fullName, therapistById } from '@/data/therapists'

const compact = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`

function details(b: Booking) {
  const t = treatmentById(b.treatmentId)
  const th = therapistById(b.therapistId)
  const title = `${t?.name ?? 'Appointment'} — ${clinic.fullName} (DEMO)`
  const location = t?.mode === 'Virtual' ? 'Online video session (link sent before appointment)' : t?.mode === 'In-Home' ? 'Your home' : fullAddress
  const description = [
    `Demo booking reference: ${b.reference}`,
    th ? `Therapist: ${fullName(th)}` : '',
    'This is a DEMONSTRATION booking. No real appointment has been created.',
  ]
    .filter(Boolean)
    .join('\n')
  return { title, location, description }
}

/** Download an .ics file (times expressed in America/Toronto). */
export function downloadICS(b: Booking) {
  const { title, location, description } = details(b)
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Maple Sprout Demo//Booking//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${b.id}@maplesprout.example`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${clinic.timezone}:${compact(b.date, b.startTime)}`,
    `DTEND;TZID=${clinic.timezone}:${compact(b.date, b.endTime)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `maple-sprout-${b.reference}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function googleCalendarUrl(b: Booking) {
  const { title, location, description } = details(b)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${compact(b.date, b.startTime)}/${compact(b.date, b.endTime)}`,
    ctz: clinic.timezone,
    location,
    details: description,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
