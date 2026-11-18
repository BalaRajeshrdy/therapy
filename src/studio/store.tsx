import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useDemoStore } from '@/hooks/useDemoStore'
import { readJSON, removeKey, writeJSON } from '@/utils/storage'
import { therapistById, fullName } from '@/data/therapists'
import type { StudioState, Viewer } from './types'
import { seedStudio } from './seed'
import { importBooking, runScheduled, type Ctx } from './engine'
import { staff } from './reference'
import { hoursUntil, today } from './util'

const KEY = 'studio'
const VIEWER_KEY = 'studio-viewer'

const defaultViewer: Viewer = { role: 'owner', therapistId: 'julien-tremblay', familyId: 'f-rahman' }

interface StudioCtx {
  s: StudioState
  viewer: Viewer
  setViewer: (v: Partial<Viewer>) => void
  actor: string
  /** Run a mutation through the engine. Returns whatever the recipe returns. */
  act: <R>(recipe: (c: Ctx) => R) => R
  reset: () => void
  waitlist: Ctx['waitlist']
}

const Ctx_ = createContext<StudioCtx | null>(null)

const valid = (v: unknown): boolean => !!v && typeof v === 'object' && (v as StudioState).version === 1 && Array.isArray((v as StudioState).appointments)

function needsScheduled(s: StudioState, now: Date) {
  if (s.offers.some((o) => o.status === 'offered' && new Date(o.expiresAt) <= now)) return true
  return s.appointments.some((a) => {
    if (a.status !== 'scheduled') return false
    const h = hoursUntil(a.date, a.start, now.getTime())
    return h > 0 && ((h <= 48 && !a.remindersSent.includes(48)) || (h <= 24 && !a.remindersSent.includes(24)))
  })
}

export function actorLabel(v: Viewer, s: StudioState) {
  if (v.role === 'owner') return `${staff.owner.name} (Owner)`
  if (v.role === 'frontdesk') return `${staff.frontdesk.name} (Front desk)`
  if (v.role === 'therapist') {
    const t = therapistById(v.therapistId)
    return `${t ? fullName(t) : 'Therapist'} (Therapist)`
  }
  const f = s.families.find((x) => x.id === v.familyId)
  return `${f?.guardians[0].name ?? 'Parent'} (Parent)`
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const { waitlist, bookings } = useDemoStore()
  const waitRef = useRef(waitlist)
  waitRef.current = waitlist

  const [s, setS] = useState<StudioState>(() => {
    const stored = readJSON<StudioState | null>(KEY, null, valid)
    if (stored && stored.seededFor === today()) return stored
    const fresh = seedStudio(waitlist)
    writeJSON(KEY, fresh)
    return fresh
  })
  const ref = useRef(s)
  ref.current = s

  const [viewer, setViewerState] = useState<Viewer>(() => ({ ...defaultViewer, ...readJSON<Partial<Viewer>>(VIEWER_KEY, {}) }))
  const setViewer = useCallback((v: Partial<Viewer>) => {
    setViewerState((prev) => {
      const next = { ...prev, ...v }
      writeJSON(VIEWER_KEY, next)
      return next
    })
  }, [])

  const actor = actorLabel(viewer, s)
  const actorRef = useRef(actor)
  actorRef.current = actor

  const act = useCallback(<R,>(recipe: (c: Ctx) => R): R => {
    const draft = structuredClone(ref.current)
    const result = recipe({ s: draft, now: new Date(), actor: actorRef.current, waitlist: waitRef.current })
    ref.current = draft
    writeJSON(KEY, draft)
    setS(draft)
    return result
  }, [])

  // Online bookings from the public portal flow into the studio.
  useEffect(() => {
    const changed = bookings.some((b) => {
      const k = ref.current.importedBookings[b.id]
      return k ? k.status !== b.status || k.date !== b.date || k.start !== b.startTime : b.status === 'confirmed'
    })
    if (changed) act((c) => bookings.forEach((b) => importBooking({ ...c, actor: 'Online booking' }, b)))
  }, [bookings, act])

  // Time-based rules: hold timers, 48/24 h reminders, overdue reminders.
  useEffect(() => {
    const tick = () => {
      if (needsScheduled(ref.current, new Date())) act((c) => runScheduled({ ...c, actor: 'Automation' }))
    }
    tick()
    const id = window.setInterval(tick, 20_000)
    return () => window.clearInterval(id)
  }, [act])

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.endsWith(`:${KEY}`)) {
        const next = readJSON<StudioState | null>(KEY, null, valid)
        if (next) setS(next)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const reset = useCallback(() => {
    removeKey(KEY)
    const fresh = seedStudio(waitRef.current)
    ref.current = fresh
    writeJSON(KEY, fresh)
    setS(fresh)
  }, [])

  const value = useMemo(() => ({ s, viewer, setViewer, actor, act, reset, waitlist }), [s, viewer, setViewer, actor, act, reset, waitlist])
  return <Ctx_.Provider value={value}>{children}</Ctx_.Provider>
}

export function useStudio() {
  const ctx = useContext(Ctx_)
  if (!ctx) throw new Error('useStudio must be used inside <StudioProvider>')
  return ctx
}
