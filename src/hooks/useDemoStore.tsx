import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { BlockedDate, Booking, ClientDetails, ClockTime, ISODate, WaitlistEntry } from '@/types'
import { isArray, purgeStaleVersions, readJSON, removeKey, writeJSON } from '@/utils/storage'
import { seedDemoBookings, seedWaitlist } from '@/data/bookings'
import { treatmentById } from '@/data/treatments'
import { bookingReference, uid } from '@/lib/utils'
import { fromMinutes, toMinutes } from '@/utils/time'
import { isSlotStillAvailable, type ScheduleContext } from '@/utils/scheduling'

const KEYS = { bookings: 'bookings', waitlist: 'waitlist', blocked: 'blocked-dates' } as const

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

interface NewBookingInput {
  treatmentId: string
  therapistId: string
  date: ISODate
  startTime: ClockTime
  client: ClientDetails
}

interface DemoStore {
  bookings: Booking[]
  waitlist: WaitlistEntry[]
  adminBlocked: BlockedDate[]
  scheduleContext: ScheduleContext
  createBooking: (input: NewBookingInput) => Result<Booking>
  cancelBooking: (id: string) => void
  rescheduleBooking: (id: string, change: { date: ISODate; startTime: ClockTime; therapistId?: string }) => Result<Booking>
  findBooking: (reference: string) => Booking | undefined
  addWaitlistEntry: (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>) => WaitlistEntry
  setWaitlistStatus: (id: string, status: WaitlistEntry['status']) => void
  removeWaitlistEntry: (id: string) => void
  blockDate: (date: ISODate, therapistId: string | 'all', reason: string) => void
  unblockDate: (id: string) => void
  resetDemo: () => void
}

const Ctx = createContext<DemoStore | null>(null)

const load = () => ({
  bookings: readJSON<Booking[]>(KEYS.bookings, seedDemoBookings, isArray),
  waitlist: readJSON<WaitlistEntry[]>(KEYS.waitlist, seedWaitlist, isArray),
  blocked: readJSON<BlockedDate[]>(KEYS.blocked, [], isArray),
})

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    purgeStaleVersions()
    return load()
  })

  // Stay in sync with other tabs and with writes from elsewhere in the app.
  useEffect(() => {
    const sync = () => setState(load())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const commit = useCallback((patch: Partial<ReturnType<typeof load>>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      if (patch.bookings) writeJSON(KEYS.bookings, next.bookings)
      if (patch.waitlist) writeJSON(KEYS.waitlist, next.waitlist)
      if (patch.blocked) writeJSON(KEYS.blocked, next.blocked)
      return next
    })
  }, [])

  const scheduleContext = useMemo<ScheduleContext>(
    () => ({ bookings: state.bookings, adminBlocked: state.blocked }),
    [state.bookings, state.blocked],
  )

  const createBooking = useCallback<DemoStore['createBooking']>(
    (input) => {
      const fresh = load() // re-read storage: another tab may have taken the slot
      const treatment = treatmentById(input.treatmentId)
      if (!treatment) return { ok: false, error: 'That treatment is no longer available.' }
      const ctx: ScheduleContext = { bookings: fresh.bookings, adminBlocked: fresh.blocked }
      if (!isSlotStillAvailable(treatment, input.therapistId, input.date, input.startTime, ctx)) {
        return { ok: false, error: 'Sorry — that time was just booked. Please choose another time.' }
      }
      const now = new Date().toISOString()
      const booking: Booking = {
        id: uid('bk'),
        reference: bookingReference(),
        treatmentId: input.treatmentId,
        therapistId: input.therapistId,
        date: input.date,
        startTime: input.startTime,
        endTime: fromMinutes(toMinutes(input.startTime) + treatment.durationMinutes),
        client: input.client,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
        history: [{ at: now, action: 'booked' }],
      }
      commit({ bookings: [...fresh.bookings, booking] })
      return { ok: true, value: booking }
    },
    [commit],
  )

  const cancelBooking = useCallback(
    (id: string) => {
      const now = new Date().toISOString()
      commit({
        bookings: load().bookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled', updatedAt: now, history: [...b.history, { at: now, action: 'cancelled' }] } : b,
        ),
      })
    },
    [commit],
  )

  const rescheduleBooking = useCallback<DemoStore['rescheduleBooking']>(
    (id, change) => {
      const fresh = load()
      const booking = fresh.bookings.find((b) => b.id === id)
      const treatment = treatmentById(booking?.treatmentId)
      if (!booking || !treatment) return { ok: false, error: 'Booking not found.' }
      const therapistId = change.therapistId ?? booking.therapistId
      const ctx: ScheduleContext = { bookings: fresh.bookings, adminBlocked: fresh.blocked, excludeBookingId: id }
      if (!isSlotStillAvailable(treatment, therapistId, change.date, change.startTime, ctx)) {
        return { ok: false, error: 'That time is no longer available. Please pick another.' }
      }
      const now = new Date().toISOString()
      const updated: Booking = {
        ...booking,
        therapistId,
        date: change.date,
        startTime: change.startTime,
        endTime: fromMinutes(toMinutes(change.startTime) + treatment.durationMinutes),
        status: 'confirmed',
        updatedAt: now,
        history: [...booking.history, { at: now, action: 'rescheduled', note: `${booking.date} ${booking.startTime} → ${change.date} ${change.startTime}` }],
      }
      commit({ bookings: fresh.bookings.map((b) => (b.id === id ? updated : b)) })
      return { ok: true, value: updated }
    },
    [commit],
  )

  const findBooking = useCallback(
    (reference: string) => state.bookings.find((b) => b.reference.toUpperCase() === reference.trim().toUpperCase()),
    [state.bookings],
  )

  const addWaitlistEntry = useCallback<DemoStore['addWaitlistEntry']>(
    (entry) => {
      const full: WaitlistEntry = { ...entry, id: uid('wl'), createdAt: new Date().toISOString(), status: 'waiting' }
      commit({ waitlist: [...load().waitlist, full] })
      return full
    },
    [commit],
  )

  const setWaitlistStatus = useCallback(
    (id: string, status: WaitlistEntry['status']) => commit({ waitlist: load().waitlist.map((w) => (w.id === id ? { ...w, status } : w)) }),
    [commit],
  )
  const removeWaitlistEntry = useCallback((id: string) => commit({ waitlist: load().waitlist.filter((w) => w.id !== id) }), [commit])

  const blockDate = useCallback(
    (date: ISODate, therapistId: string | 'all', reason: string) => {
      const blocked = load().blocked
      if (blocked.some((b) => b.date === date && b.therapistId === therapistId)) return
      commit({ blocked: [...blocked, { id: uid('blk'), date, therapistId, reason: reason || 'Unavailable', source: 'admin' }] })
    },
    [commit],
  )
  const unblockDate = useCallback((id: string) => commit({ blocked: load().blocked.filter((b) => b.id !== id) }), [commit])

  const resetDemo = useCallback(() => {
    removeKey(KEYS.bookings)
    removeKey(KEYS.waitlist)
    removeKey(KEYS.blocked)
    setState(load())
  }, [])

  const value = useMemo<DemoStore>(
    () => ({
      bookings: state.bookings,
      waitlist: state.waitlist,
      adminBlocked: state.blocked,
      scheduleContext,
      createBooking,
      cancelBooking,
      rescheduleBooking,
      findBooking,
      addWaitlistEntry,
      setWaitlistStatus,
      removeWaitlistEntry,
      blockDate,
      unblockDate,
      resetDemo,
    }),
    [state, scheduleContext, createBooking, cancelBooking, rescheduleBooking, findBooking, addWaitlistEntry, setWaitlistStatus, removeWaitlistEntry, blockDate, unblockDate, resetDemo],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDemoStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDemoStore must be used inside <DemoStoreProvider>')
  return ctx
}
