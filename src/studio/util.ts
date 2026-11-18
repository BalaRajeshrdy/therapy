import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { ISODate } from '@/types'
import { clinicToday, toMinutes } from '@/utils/time'

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
export const money = (n: number) => cad.format(n)

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const today = () => clinicToday()
export const daysBetween = (a: ISODate, b: ISODate) => differenceInCalendarDays(parseISO(b), parseISO(a))
export const shortDate = (d: ISODate) => format(parseISO(d), 'MMM d')
export const fullDate = (d: ISODate) => format(parseISO(d), 'EEE, MMM d, yyyy')
export const monthLabel = (d: ISODate) => format(parseISO(d), 'MMMM yyyy')
export const stamp = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
export const clockOf = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

/** ISO timestamp for a clinic-local date + time (approximate: uses Toronto's offset for that date). */
export function atClinic(date: ISODate, time: string): string {
  const guess = new Date(`${date}T${time}:00Z`)
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', timeZoneName: 'shortOffset' }).formatToParts(guess)
  const off = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-5'
  const m = off.match(/GMT([+-]\d+)/)
  const hours = m ? Number(m[1]) : -5
  return new Date(guess.getTime() - hours * 3600_000).toISOString()
}

/** Hours from now until a clinic-local date/time (negative if past). */
export const hoursUntil = (date: ISODate, time: string, now = Date.now()) => (new Date(atClinic(date, time)).getTime() - now) / 3600_000

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
/** Road distance estimate (straight line × 1.3), one decimal */
export const roadKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.round(haversineKm(a, b) * 1.3 * 10) / 10

export const clinicGeo = { lat: 43.5905, lng: -79.7581 }

export const durationMin = (start: string, end: string) => toMinutes(end) - toMinutes(start)
export const initials = (first: string, last: string) => `${first} ${last.charAt(0)}.`
export const round2 = (n: number) => Math.round(n * 100) / 100
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
export const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)
export const sid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
