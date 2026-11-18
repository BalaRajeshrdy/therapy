import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Globe, PhoneCall, Plus, Repeat, DoorOpen, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Select } from '@/components/ui/form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { therapists, fullName } from '@/data/therapists'
import { addDaysISO, formatTime, toMinutes, fromMinutes } from '@/utils/time'
import { cn } from '@/lib/utils'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { Card, Empty, Notice, PageHeader, Pill, StatusPill, TextLink } from '../ui'
import { audit, cancelAppointment, childById, childName, createAppointment, createSeries, familyById, noShowCount, openSlots, pickRoom, roomFree } from '../engine'
import { rooms, roomById, serviceById, services } from '../reference'
import { fullDate, hoursUntil, today } from '../util'

export default function Schedule() {
  return (
    <Guard area="schedule">
      <ScheduleInner />
    </Guard>
  )
}

function DayNav({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="icon" aria-label="Previous day" onClick={() => setDate(addDaysISO(date, -1))}>
        <ChevronLeft aria-hidden />
      </Button>
      <label className="sr-only" htmlFor="day-input">
        Date
      </label>
      <input id="day-input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-10 rounded-full border border-forest/15 bg-white px-4 text-sm font-semibold text-forest" />
      <Button variant="secondary" size="icon" aria-label="Next day" onClick={() => setDate(addDaysISO(date, 1))}>
        <ChevronRight aria-hidden />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setDate(today())}>
        Today
      </Button>
    </div>
  )
}

function ScheduleInner() {
  const { s, viewer } = useStudio()
  const [params, setParams] = useSearchParams()
  const [date, setDate] = useState(params.get('date') ?? today())
  const [openId, setOpenId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(Boolean(params.get('child')))
  const cols = viewer.role === 'therapist' ? therapists.filter((t) => t.id === viewer.therapistId) : therapists
  const t = today()

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title={fullDate(date)}
        intro="All visits across therapists, with rooms, recurring series, online bookings and no-show flags."
        actions={
          viewer.role !== 'therapist' && (
            <Button onClick={() => setNewOpen(true)}>
              <Plus aria-hidden /> New appointment
            </Button>
          )
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <DayNav date={date} setDate={setDate} />
        <div className="flex flex-wrap gap-2 text-xs">
          <Pill tone="lavender" icon={Repeat}>
            Recurring
          </Pill>
          <Pill tone="sage" icon={Globe}>
            Online booking
          </Pill>
          <Pill tone="alert" icon={AlertTriangle}>
            No-show flag
          </Pill>
          <Pill tone="butter" icon={PhoneCall}>
            Call to confirm
          </Pill>
        </div>
      </div>
      <div className={cn('grid gap-4', cols.length > 1 && 'md:grid-cols-2 2xl:grid-cols-4')}>
        {cols.map((th) => {
          const list = s.appointments.filter((a) => a.therapistId === th.id && a.date === date).sort((a, b) => a.start.localeCompare(b.start))
          const sv = s.siteVisits.filter((v) => v.therapistId === th.id && v.date === date)
          return (
            <Card key={th.id} as="section" aria-label={fullName(th)} className="p-4 sm:p-5">
              <h2 className="mb-3 font-sans text-base font-bold text-forest">{fullName(th)}</h2>
              <ul className="space-y-2">
                {sv.map((v) => (
                  <li key={v.id}>
                    <Link to={`/studio/site-visits/${v.id}`} className="block rounded-2xl bg-lavender/60 p-3 text-sm hover:bg-lavender">
                      <span className="flex items-center gap-1.5 font-semibold text-forest">
                        <Building2 className="size-4" aria-hidden /> {formatTime(v.start)} – {formatTime(v.end)}
                      </span>
                      <span className="text-charcoal-soft">{s.sites.find((x) => x.id === v.siteId)?.name}</span>
                    </Link>
                  </li>
                ))}
                {list.map((a) => {
                  const flag = noShowCount(s, a.familyId, t) >= 2
                  return (
                    <li key={a.id}>
                      <button type="button" onClick={() => setOpenId(a.id)} className={cn('w-full rounded-2xl border p-3 text-left text-sm transition-colors hover:border-forest/40', a.status === 'cancelled' ? 'border-dashed border-forest/15 opacity-60' : 'border-forest/10 bg-ivory')}>
                        <span className="flex items-center justify-between gap-2">
                          <b className="text-charcoal">{formatTime(a.start)}</b>
                          <StatusPill status={a.status} />
                        </span>
                        <span className="mt-1 block font-semibold text-forest">{childName(s, a.childId)}</span>
                        <span className="block text-xs text-charcoal-soft">
                          {serviceById(a.serviceId)?.shortName}
                          {a.roomId && ` · ${roomById(a.roomId)?.name}`}
                        </span>
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {a.seriesId && <Pill tone="lavender" icon={Repeat}>Series</Pill>}
                          {a.source === 'online' && <Pill tone="sage" icon={Globe}>Online</Pill>}
                          {flag && <Pill tone="alert" icon={AlertTriangle}>No-show flag</Pill>}
                          {a.flaggedForCall && !a.familyConfirmed && a.status === 'scheduled' && <Pill tone="butter" icon={PhoneCall}>Call</Pill>}
                        </span>
                      </button>
                    </li>
                  )
                })}
                {!list.length && !sv.length && <Empty>No visits.</Empty>}
              </ul>
            </Card>
          )
        })}
      </div>
      {openId && <ApptDialog id={openId} onClose={() => setOpenId(null)} />}
      <NewAppointmentDialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o)
          if (!o && params.get('child')) setParams({})
        }}
        defaultChild={params.get('child') ?? undefined}
        defaultDate={date}
        onCreated={(d) => setDate(d)}
      />
    </>
  )
}

export function ApptDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, act, viewer } = useStudio()
  const a = s.appointments.find((x) => x.id === id)
  const [mode, setMode] = useState<'view' | 'reschedule'>('view')
  const [newDate, setNewDate] = useState(a?.date ?? today())
  const [newTime, setNewTime] = useState('')
  const [msg, setMsg] = useState('')
  if (!a) return null
  const ch = childById(s, a.childId)
  const fam = familyById(s, a.familyId)
  const svc = serviceById(a.serviceId)!
  const hrs = hoursUntil(a.date, a.start)
  const late = hrs < s.settings.lateCancelHours && hrs > 0
  const slots = openSlots(s, a.therapistId, newDate, svc.durationMinutes, a.id)
  const staff = viewer.role !== 'parent'

  const reschedule = () => {
    if (!newTime) return setMsg('Pick a new time.')
    act((c) => {
      const x = c.s.appointments.find((y) => y.id === a.id)!
      const old = `${x.date} ${x.start}`
      x.date = newDate
      x.start = newTime
      x.end = fromMinutes(toMinutes(newTime) + svc.durationMinutes)
      x.roomId = pickRoom(c.s, x.mode, x.date, x.start, x.end, x.id)
      x.remindersSent = []
      x.flaggedForCall = false
      audit(c, `Rescheduled ${old} → ${newDate} ${newTime}`, childName(c.s, x.childId))
    })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`${ch?.firstName} ${ch?.lastName}`} description={`${svc.name} · ${fullDate(a.date)} · ${formatTime(a.start)} – ${formatTime(a.end)}`}>
        {mode === 'view' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill status={a.status} />
              {a.roomId && <Pill tone="ivory" icon={DoorOpen}>{roomById(a.roomId)?.name}</Pill>}
              {a.familyConfirmed ? <Pill>Family confirmed</Pill> : <Pill tone="butter">Not yet confirmed</Pill>}
              {a.remindersSent.length > 0 && <Pill tone="lavender">Reminders: {a.remindersSent.map((h) => `${h} h`).join(', ')}</Pill>}
            </div>
            <p className="text-sm text-charcoal-soft">
              Therapist: <b className="text-charcoal">{fullName(therapists.find((t) => t.id === a.therapistId)!)}</b>
              {fam && (
                <>
                  {' '}
                  · Family: <TextLink to={staff ? `/studio/clients/${fam.id}` : '/studio/family'}>{fam.guardians[0].name}</TextLink>
                </>
              )}
            </p>
            {a.status === 'scheduled' && (
              <>
                {late && <Notice>This visit starts in {Math.round(hrs)} h. Cancelling on behalf of the family now counts as a late cancellation ({s.settings.lateCancelFeePct}% fee).</Notice>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setMode('reschedule')}>
                    Reschedule
                  </Button>
                  {staff && !a.familyConfirmed && (
                    <Button size="sm" variant="soft" onClick={() => { act((c) => { const x = c.s.appointments.find((y) => y.id === a.id)!; x.familyConfirmed = true; x.flaggedForCall = false; audit(c, 'Marked visit confirmed', childName(c.s, x.childId)) }) }}>
                      Mark confirmed
                    </Button>
                  )}
                  <Button size="sm" variant="soft" onClick={() => { act((c) => cancelAppointment(c, a.id, 'family')); onClose() }}>
                    {viewer.role === 'parent' ? 'Cancel visit' : 'Cancel (family request)'}
                  </Button>
                  {staff && (
                    <Button size="sm" variant="soft" onClick={() => { act((c) => cancelAppointment(c, a.id, 'clinic')); onClose() }}>
                      Cancel (clinic, no fee)
                    </Button>
                  )}
                </div>
                {staff && a.mode === 'In-Clinic' && (
                  <Field label="Room">
                    {(p) => (
                      <Select
                        {...p}
                        value={a.roomId ?? ''}
                        onChange={(e) => {
                          const roomId = e.target.value
                          if (roomId && !roomFree(s, roomId, a.date, a.start, a.end, a.id)) return setMsg('That room is already booked at this time.')
                          setMsg('')
                          act((c) => {
                            const x = c.s.appointments.find((y) => y.id === a.id)!
                            x.roomId = roomId || undefined
                            audit(c, `Assigned room ${roomById(roomId)?.name ?? 'none'}`, childName(c.s, x.childId))
                          })
                        }}
                      >
                        <option value="">No room</option>
                        {rooms.filter((r) => r.id !== 'tele').map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                )}
                <p className="text-xs text-charcoal-soft">Cancelling releases the slot and offers it to matching waitlist families automatically.</p>
              </>
            )}
            {msg && (
              <p role="alert" className="text-sm font-medium text-terracotta">
                {msg}
              </p>
            )}
            {staff && (
              <TextLink to={`/studio/visits?visit=${a.id}`} className="text-sm">
                Open visit (check-in, sign-off, outcome)
              </TextLink>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="New date">{(p) => <input {...p} type="date" min={today()} value={newDate} onChange={(e) => { setNewDate(e.target.value); setNewTime('') }} className="h-12 w-full rounded-2xl border border-forest/15 px-4" />}</Field>
            <fieldset>
              <legend className="text-sm font-semibold text-forest">Open times with this therapist</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {slots.length ? (
                  slots.map((st) => (
                    <button key={st} type="button" aria-pressed={newTime === st} onClick={() => setNewTime(st)} className={cn('rounded-full px-3 py-1.5 text-sm font-semibold ring-1', newTime === st ? 'bg-forest text-ivory ring-forest' : 'bg-white text-forest ring-forest/15')}>
                      {formatTime(st)}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-charcoal-soft">No open times — the therapist doesn’t work this day or is fully booked.</p>
                )}
              </div>
            </fieldset>
            {msg && <p role="alert" className="text-sm text-terracotta">{msg}</p>}
            <div className="flex gap-2">
              <Button onClick={reschedule}>Move visit</Button>
              <Button variant="ghost" onClick={() => setMode('view')}>
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function NewAppointmentDialog({ open, onOpenChange, defaultChild, defaultDate, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; defaultChild?: string; defaultDate: string; onCreated: (date: string) => void }) {
  const { s, act } = useStudio()
  const kids = s.children.filter((c) => c.familyId && c.status !== 'discharged')
  const [childId, setChildId] = useState(defaultChild ?? kids[0]?.id ?? '')
  const child = childById(s, childId)
  const [therapistId, setTherapistId] = useState(child?.therapistId ?? therapists[0].id)
  const [serviceId, setServiceId] = useState('ot-session-clinic')
  const [date, setDate] = useState(defaultDate < today() ? today() : defaultDate)
  const [start, setStart] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [weeks, setWeeks] = useState(8)
  const [roomId, setRoomId] = useState('')
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (defaultChild) setChildId(defaultChild)
  }, [defaultChild])
  useEffect(() => {
    if (child) setTherapistId(child.therapistId)
  }, [child])

  const svc = serviceById(serviceId)!
  const slots = useMemo(() => openSlots(s, therapistId, date, svc.durationMinutes), [s, therapistId, date, svc.durationMinutes])

  const create = () => {
    if (!start) return setResult({ ok: false, text: 'Choose a start time.' })
    const out = act((c) => {
      if (repeat) {
        const r = createSeries(c, { childId, therapistId, serviceId, date, start, roomId: roomId || undefined }, weeks)
        audit(c, `Booked recurring series (${r.made} of ${weeks})`, childName(c.s, childId))
        return { ok: r.made > 0, text: `Booked ${r.made} weekly visit${r.made === 1 ? '' : 's'}${r.skipped.length ? `; ${r.skipped.length} skipped (conflicts)` : ''}.` }
      }
      const r = createAppointment(c, { childId, therapistId, serviceId, date, start, roomId: roomId || undefined, source: 'staff' })
      if (r.ok) audit(c, 'Booked appointment', `${childName(c.s, childId)} · ${date} ${start}`)
      return r.ok ? { ok: true, text: 'Appointment booked.' } : { ok: false, text: r.error }
    })
    setResult(out)
    if (out.ok) {
      onCreated(date)
      setStart('')
      setTimeout(() => onOpenChange(false), 700)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="New appointment" description="Book a single visit or a weekly recurring series. Conflicts and room clashes are checked automatically.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Child">
            {(p) => (
              <Select {...p} value={childId} onChange={(e) => setChildId(e.target.value)}>
                {kids.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Therapist">
            {(p) => (
              <Select {...p} value={therapistId} onChange={(e) => { setTherapistId(e.target.value); setStart('') }}>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {fullName(t)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Service" className="sm:col-span-2">
            {(p) => (
              <Select {...p} value={serviceId} onChange={(e) => { setServiceId(e.target.value); setStart('') }}>
                {services.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} ({x.durationMinutes} min)
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Date">{(p) => <input {...p} type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setStart('') }} className="h-12 w-full rounded-2xl border border-forest/15 px-4" />}</Field>
          {svc.mode === 'In-Clinic' && (
            <Field label="Room" hint="Leave on auto to pick the first free room">
              {(p) => (
                <Select {...p} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                  <option value="">Auto-assign</option>
                  {rooms.filter((r) => r.id !== 'tele').map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold text-forest">Start time</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {slots.length ? (
                slots.map((st) => (
                  <button key={st} type="button" aria-pressed={start === st} onClick={() => setStart(st)} className={cn('rounded-full px-3 py-1.5 text-sm font-semibold ring-1', start === st ? 'bg-forest text-ivory ring-forest' : 'bg-white text-forest ring-forest/15')}>
                    {formatTime(st)}
                  </button>
                ))
              ) : (
                <p className="text-sm text-charcoal-soft">No open times — this therapist doesn’t work this day or is fully booked.</p>
              )}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="size-4 accent-forest" />
            Repeat weekly (recurring sessions)
          </label>
          {repeat && (
            <Field label="Number of weeks">
              {(p) => (
                <Select {...p} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
                  {[4, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} weeks
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </div>
        {result && (
          <p role="status" className={cn('mt-4 text-sm font-semibold', result.ok ? 'text-forest' : 'text-terracotta')}>
            {result.text}
          </p>
        )}
        <Button className="mt-5 w-full" onClick={create}>
          Book {repeat ? `${weeks} weekly visits` : 'appointment'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Rooms ---------- */

export function Rooms() {
  return (
    <Guard area="rooms">
      <RoomsInner />
    </Guard>
  )
}

function RoomsInner() {
  const { s, act } = useStudio()
  const [date, setDate] = useState(today())
  const [openId, setOpenId] = useState<string | null>(null)
  const startM = 8 * 60
  const endM = 19 * 60
  const slotH = 26
  const dayAppts = s.appointments.filter((a) => a.date === date && a.status !== 'cancelled' && (a.mode !== 'In-Home'))
  const unassigned = dayAppts.filter((a) => a.mode === 'In-Clinic' && !a.roomId)
  return (
    <>
      <PageHeader eyebrow="Room booking" title="Rooms" intro="In-clinic visits are placed in a free room automatically; virtual sessions use the telehealth booth. Clashes are blocked." />
      <div className="mb-5">
        <DayNav date={date} setDate={setDate} />
      </div>
      {unassigned.length > 0 && (
        <Card className="mb-5">
          <p className="mb-3 font-semibold text-forest">In-clinic visits without a room</p>
          <ul className="flex flex-wrap gap-2">
            {unassigned.map((a) => (
              <li key={a.id}>
                <Button size="sm" variant="secondary" onClick={() => act((c) => { const x = c.s.appointments.find((y) => y.id === a.id)!; x.roomId = pickRoom(c.s, x.mode, x.date, x.start, x.end, x.id); audit(c, 'Auto-assigned room', childName(c.s, x.childId)) })}>
                  {formatTime(a.start)} {childName(s, a.childId)} — auto-assign
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card className="overflow-x-auto p-3 sm:p-4">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `64px repeat(${rooms.length}, 1fr)` }}>
          <div />
          {rooms.map((r) => (
            <div key={r.id} className="px-2 pb-3">
              <p className="font-semibold text-forest">{r.name}</p>
              <p className="text-xs text-charcoal-soft">{r.features}</p>
            </div>
          ))}
          <div className="relative" style={{ height: ((endM - startM) / 30) * slotH }}>
            {Array.from({ length: (endM - startM) / 60 + 1 }, (_, i) => (
              <span key={i} className="absolute right-2 -translate-y-1/2 text-xs text-charcoal-soft" style={{ top: i * 2 * slotH }}>
                {formatTime(fromMinutes(startM + i * 60)).replace(':00', '')}
              </span>
            ))}
          </div>
          {rooms.map((r) => (
            <div key={r.id} className="relative mx-1 rounded-xl bg-ivory" style={{ height: ((endM - startM) / 30) * slotH, backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${slotH * 2 - 1}px, rgba(41,75,67,0.08) ${slotH * 2 - 1}px, rgba(41,75,67,0.08) ${slotH * 2}px)` }}>
              {dayAppts
                .filter((a) => a.roomId === r.id)
                .map((a) => {
                  const top = ((toMinutes(a.start) - startM) / 30) * slotH
                  const h = ((toMinutes(a.end) - toMinutes(a.start)) / 30) * slotH
                  return (
                    <button key={a.id} type="button" onClick={() => setOpenId(a.id)} className="absolute inset-x-1 overflow-hidden rounded-lg bg-sage-light px-2 py-1 text-left text-xs ring-1 ring-forest/10 hover:ring-forest/40" style={{ top, height: h - 2 }}>
                      <b className="block text-forest">{formatTime(a.start)} {childName(s, a.childId)}</b>
                      <span className="text-charcoal-soft">{fullName(therapists.find((t) => t.id === a.therapistId)!)}</span>
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      </Card>
      {openId && <ApptDialog id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
