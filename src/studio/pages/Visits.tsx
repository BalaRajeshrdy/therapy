import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, LogIn, MapPin, Navigation, PenLine, Route, XCircle, AlertTriangle, Receipt, NotebookPen, Video, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { therapists, fullName } from '@/data/therapists'
import { formatTime } from '@/utils/time'
import { cn } from '@/lib/utils'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { Card, CardTitle, Empty, Notice, PageHeader, Pill, SignaturePad, StatusPill, TextLink } from '../ui'
import { cancelAppointment, checkIn, childById, completeAppointment, familyById, markNoShow, noShowCount } from '../engine'
import { optimiseRoute, routeKm, type Stop } from '../ai'
import { roomById, serviceById } from '../reference'
import { clinicGeo, clockOf, money, today } from '../util'
import type { Appointment } from '../types'

export default function Visits() {
  return (
    <Guard area="visits">
      <VisitsInner />
    </Guard>
  )
}

async function getGeo(): Promise<{ lat: number; lng: number } | undefined> {
  if (!('geolocation' in navigator)) return undefined
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: Math.round(p.coords.latitude * 1e4) / 1e4, lng: Math.round(p.coords.longitude * 1e4) / 1e4 }),
      () => resolve(undefined),
      { timeout: 5000, maximumAge: 60000 },
    )
  })
}

function VisitsInner() {
  const { s, viewer, act } = useStudio()
  const [params, setParams] = useSearchParams()
  const [pickTherapist, setPickTherapist] = useState(viewer.role === 'therapist' ? viewer.therapistId : 'julien-tremblay')
  const therapistId = viewer.role === 'therapist' ? viewer.therapistId : pickTherapist
  const t = today()
  const [optimised, setOptimised] = useState(false)
  const [withGeo, setWithGeo] = useState(false)

  const visits = useMemo(() => s.appointments.filter((a) => a.therapistId === therapistId && a.date === t && a.status !== 'cancelled').sort((a, b) => a.start.localeCompare(b.start)), [s.appointments, therapistId, t])
  const siteVisits = s.siteVisits.filter((v) => v.therapistId === therapistId && v.date === t)
  const homeStops: Stop[] = visits.filter((a) => a.mode === 'In-Home').map((a) => ({ id: a.id, label: childById(s, a.childId)?.firstName ?? '', geo: familyById(s, a.familyId)!.geo }))
  const bookedKm = routeKm(homeStops)
  const optimal = optimiseRoute(homeStops)
  const optKm = routeKm(optimal)
  const order = optimised ? optimal.map((st) => visits.find((v) => v.id === st.id)!).concat(visits.filter((v) => v.mode !== 'In-Home')) : visits
  const selectedId = params.get('visit') ?? order.find((v) => v.status !== 'completed')?.id ?? order[0]?.id
  const selected = s.appointments.find((a) => a.id === selectedId)
  const kmToday = visits.filter((a) => a.mode === 'In-Home' && a.status === 'completed').reduce((n, a) => n + (a.km ?? 0), 0)

  return (
    <>
      <PageHeader
        eyebrow="Module 1 · Home visits"
        title="Every home visit tracked, signed and billable"
        intro="Today’s visits in route order on the therapist’s phone. One-tap check-in and check-out, the parent signs on the phone, and the outcome drives billing automatically."
        actions={
          viewer.role !== 'therapist' && (
            <label className="flex items-center gap-2 text-sm font-semibold text-forest">
              Therapist
              <select value={pickTherapist} onChange={(e) => { setPickTherapist(e.target.value); setParams({}) }} className="h-10 rounded-full border border-forest/15 bg-white px-3 text-sm">
                {therapists.map((x) => (
                  <option key={x.id} value={x.id}>
                    {fullName(x)}
                  </option>
                ))}
              </select>
            </label>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Phone */}
        <div className="mx-auto w-full max-w-[380px]">
          <div className="rounded-[2.6rem] bg-charcoal p-3 shadow-lift">
            <div className="rounded-[2.1rem] bg-ivory p-4" aria-label="Therapist phone view">
              <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-charcoal/15" aria-hidden />
              <h2 className="font-sans text-lg font-bold text-forest">
                Today · {visits.length} visit{visits.length === 1 ? '' : 's'}
              </h2>
              <p className="text-xs text-charcoal-soft">{fullName(therapists.find((x) => x.id === therapistId)!)}</p>
              <ol className="mt-3 space-y-2.5">
                {order.map((a, i) => {
                  const ch = childById(s, a.childId)
                  const svc = serviceById(a.serviceId)
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setParams({ visit: a.id })}
                        aria-current={selectedId === a.id}
                        className={cn('w-full rounded-2xl border bg-white p-3 text-left transition-shadow', selectedId === a.id ? 'border-forest shadow-soft' : 'border-forest/10 hover:border-forest/30')}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-charcoal">
                            {a.mode === 'In-Home' && <span className="mr-1 text-xs text-sage-dark">#{i + 1}</span>}
                            {formatTime(a.start).replace(' ', ' ')} {ch?.firstName} {ch?.lastName.charAt(0)}.
                          </span>
                          <StatusPill status={a.status} />
                        </span>
                        <span className="mt-1 block text-xs text-charcoal-soft">
                          {svc?.shortName}
                          {a.mode === 'In-Home' && ` · ${familyById(s, a.familyId)?.address}`}
                        </span>
                      </button>
                    </li>
                  )
                })}
                {siteVisits.map((v) => (
                  <li key={v.id}>
                    <Link to={`/studio/site-visits/${v.id}`} className="block rounded-2xl border border-forest/10 bg-lavender/50 p-3 text-sm">
                      <b className="text-charcoal">{formatTime(v.start)} {s.sites.find((x) => x.id === v.siteId)?.name}</b>
                      <span className="block text-xs text-charcoal-soft">Group visit · take attendance</span>
                    </Link>
                  </li>
                ))}
                {!visits.length && !siteVisits.length && <Empty>No visits today.</Empty>}
              </ol>
              {selected && selected.status !== 'completed' && selected.mode === 'In-Home' && <CompleteButton appt={selected} />}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {selected ? <VisitDetail appt={selected} withGeo={withGeo} setWithGeo={setWithGeo} act={act} /> : <Empty>Select a visit.</Empty>}

          {homeStops.length > 1 && (
            <Card aria-labelledby="route-h">
              <CardTitle id="route-h">
                <span className="flex items-center gap-2">
                  <Route className="size-5 text-terracotta" aria-hidden /> Route
                </span>
              </CardTitle>
              <RouteMap stops={optimised ? optimal : homeStops} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p>
                  Booked order <b>{bookedKm} km</b> · Smart order <b>{optKm} km</b>
                  {bookedKm - optKm > 0.1 && <span className="ml-1 text-terracotta">(saves {Math.round((bookedKm - optKm) * 10) / 10} km)</span>}
                </p>
                <Button size="sm" variant={optimised ? 'soft' : 'primary'} onClick={() => setOptimised((o) => !o)}>
                  <Navigation aria-hidden /> {optimised ? 'Show booked order' : 'Use smart route order'}
                </Button>
              </div>
              <p className="mt-2 text-xs text-charcoal-soft">Distances are estimates from fictional addresses. Mileage today: {Math.round(kmToday * 10) / 10} km logged ({money(kmToday * s.settings.mileageRate)} at the demo rate).</p>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

function CompleteButton({ appt }: { appt: Appointment }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button className="mt-4 w-full" size="lg" onClick={() => setOpen(true)} disabled={appt.status === 'scheduled' && false}>
        <PenLine aria-hidden /> Complete &amp; get signature
      </Button>
      <SignDialog appt={appt} open={open} onOpenChange={setOpen} />
    </>
  )
}

function SignDialog({ appt, open, onOpenChange }: { appt: Appointment; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { s, act } = useStudio()
  const fam = familyById(s, appt.familyId)
  const [name, setName] = useState(fam?.guardians[0].name ?? '')
  const [ink, setInk] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')
  const ch = childById(s, appt.childId)
  const submit = () => {
    if (name.trim().length < 2 || !confirm) {
      setError('Please type the parent or guardian’s name and tick the confirmation.')
      return
    }
    act((c) => completeAppointment(c, appt.id, { signature: { name: name.trim(), dataUrl: ink ?? '', at: new Date().toISOString() } }))
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Parent sign-off" description={`${ch?.firstName} ${ch?.lastName} · ${serviceById(appt.serviceId)?.name}`}>
        <div className="space-y-4">
          <SignaturePad onChange={setInk} label="Parent / guardian signature" />
          <Field label="Parent / guardian name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 size-[18px] accent-forest" />
            I confirm this visit took place today and I received a summary from the therapist.
          </label>
          {error && (
            <p role="alert" className="text-sm font-medium text-terracotta">
              {error}
            </p>
          )}
          <Button className="w-full" size="lg" onClick={submit}>
            <CheckCircle2 aria-hidden /> Sign &amp; complete visit
          </Button>
          <p className="text-xs text-charcoal-soft">Demo e-signature — stored only in this browser.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VisitDetail({ appt, withGeo, setWithGeo, act }: { appt: Appointment; withGeo: boolean; setWithGeo: (v: boolean) => void; act: ReturnType<typeof useStudio>['act'] }) {
  const { s } = useStudio()
  const [signOpen, setSignOpen] = useState(false)
  const ch = childById(s, appt.childId)
  const fam = familyById(s, appt.familyId)
  const svc = serviceById(appt.serviceId)
  const inv = s.invoices.find((i) => i.id === appt.invoiceId)
  const note = s.notes.find((n) => n.appointmentId === appt.id)
  const flags = fam ? noShowCount(s, fam.id, today()) : 0
  const ModeIcon = appt.mode === 'In-Home' ? MapPin : appt.mode === 'Virtual' ? Video : Building
  const doCheckIn = async () => {
    const geo = withGeo ? await getGeo() : undefined
    act((c) => checkIn(c, appt.id, geo))
  }
  return (
    <Card aria-labelledby="visit-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="visit-h" className="font-serif text-2xl text-forest">
            {ch?.firstName} {ch?.lastName}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-charcoal-soft">
            <ModeIcon className="size-4" aria-hidden /> {svc?.name} · {formatTime(appt.start)} – {formatTime(appt.end)}
          </p>
          {appt.mode === 'In-Home' && fam && (
            <p className="mt-1 text-sm text-charcoal-soft">
              {fam.address}, {fam.city} · {appt.km} km round trip
            </p>
          )}
          {appt.roomId && <p className="mt-1 text-sm text-charcoal-soft">Room: {roomById(appt.roomId)?.name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill status={appt.status} />
          {flags >= 2 && (
            <Pill tone="alert" icon={AlertTriangle}>
              {flags} missed in 90 days
            </Pill>
          )}
          {appt.bookingRef && <Pill tone="lavender">Online · {appt.bookingRef}</Pill>}
        </div>
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        <li className="rounded-2xl bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">Check-in</p>
          <p className="mt-1 font-semibold text-forest">{appt.checkIn ? clockOf(appt.checkIn.at) : '—'}</p>
          {appt.checkIn?.lat && <p className="text-xs text-charcoal-soft">📍 {appt.checkIn.lat}, {appt.checkIn.lng}</p>}
        </li>
        <li className="rounded-2xl bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">Check-out</p>
          <p className="mt-1 font-semibold text-forest">{appt.checkOut ? clockOf(appt.checkOut.at) : '—'}</p>
          {appt.checkOut?.lat && <p className="text-xs text-charcoal-soft">📍 {appt.checkOut.lat}, {appt.checkOut.lng}</p>}
        </li>
        <li className="rounded-2xl bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">Parent sign-off</p>
          {appt.signature ? (
            <>
              {appt.signature.dataUrl && <img src={appt.signature.dataUrl} alt={`Signature of ${appt.signature.name}`} className="mt-1 h-10 w-full object-contain object-left" />}
              <p className="text-xs text-charcoal-soft">{appt.signature.name}</p>
            </>
          ) : (
            <p className="mt-1 font-semibold text-forest">—</p>
          )}
        </li>
      </ol>

      {(appt.status === 'scheduled' || appt.status === 'checked-in') && (
        <div className="mt-5 space-y-4">
          {appt.status === 'scheduled' && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={doCheckIn}>
                <LogIn aria-hidden /> Check in
              </Button>
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <input type="checkbox" checked={withGeo} onChange={(e) => setWithGeo(e.target.checked)} className="size-4 accent-forest" />
                Attach my location as proof of visit (optional)
              </label>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {appt.mode === 'In-Home' ? (
              <Button variant={appt.status === 'checked-in' ? 'primary' : 'secondary'} onClick={() => setSignOpen(true)}>
                <PenLine aria-hidden /> Complete &amp; get signature
              </Button>
            ) : (
              <Button variant={appt.status === 'checked-in' ? 'primary' : 'secondary'} onClick={() => act((c) => completeAppointment(c, appt.id))}>
                <CheckCircle2 aria-hidden /> Complete visit
              </Button>
            )}
            <Button variant="soft" onClick={() => act((c) => markNoShow(c, appt.id))}>
              <XCircle aria-hidden /> No-show
            </Button>
            <Button variant="soft" onClick={() => act((c) => cancelAppointment(c, appt.id, 'family'))}>
              <AlertTriangle aria-hidden /> Late cancel
            </Button>
          </div>
          <Notice tone="lavender">
            Status drives billing: completed bills the visit fee, a no-show applies {s.settings.noShowFeePct}% and a late cancellation (within {s.settings.lateCancelHours} h) applies {s.settings.lateCancelFeePct}% —{' '}
            {fam?.billing === 'monthly' ? 'this family is billed in a monthly batch.' : 'an invoice is generated straight away.'}
          </Notice>
          <SignDialog appt={appt} open={signOpen} onOpenChange={setSignOpen} />
        </div>
      )}

      {['completed', 'no-show', 'late-cancel'].includes(appt.status) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-sage-light/60 p-4">
            <span className="flex items-center gap-2 text-sm">
              <Receipt className="size-4 text-forest" aria-hidden />
              {inv ? (
                <>
                  {inv.number} · {inv.total ? money(inv.total) : 'covered by package'}
                </>
              ) : (
                'Added to monthly batch'
              )}
            </span>
            {inv && <TextLink to={`/studio/invoices/${inv.id}`}>View</TextLink>}
          </div>
          {appt.status === 'completed' && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-butter/60 p-4">
              <span className="flex items-center gap-2 text-sm">
                <NotebookPen className="size-4 text-forest" aria-hidden />
                {note?.status === 'signed' ? 'Note signed' : note ? 'Note draft' : 'Note task created'}
              </span>
              <TextLink to={`/studio/notes/${appt.id}`}>{note?.status === 'signed' ? 'View' : 'Write note'}</TextLink>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function RouteMap({ stops }: { stops: Stop[] }) {
  const pts = [clinicGeo, ...stops.map((s) => s.geo)]
  const lats = pts.map((p) => p.lat)
  const lngs = pts.map((p) => p.lng)
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
  const W = 600
  const H = 220
  const px = (p: { lat: number; lng: number }) => [40 + ((p.lng - minLng) / (maxLng - minLng || 1)) * (W - 80), 38 + (1 - (p.lat - minLat) / (maxLat - minLat || 1)) * (H - 70)] as const
  const path = [clinicGeo, ...stops.map((s) => s.geo), clinicGeo].map((p) => px(p).join(',')).join(' ')
  const [cx, cy] = px(clinicGeo)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-2xl bg-[#EEF2EC]" role="img" aria-label={`Route map: clinic, then ${stops.map((s) => s.label).join(', ')}, then back to the clinic`}>
      <polyline points={path} fill="none" stroke="#294B43" strokeWidth="2" strokeDasharray="6 5" />
      <g>
        <rect x={cx - 9} y={cy - 9} width="18" height="18" rx="4" fill="#294B43" stroke="#fff" strokeWidth="2" />
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fill="#303735">
          Clinic
        </text>
      </g>
      {stops.map((s, i) => {
        const [x, y] = px(s.geo)
        return (
          <g key={s.id}>
            <circle cx={x} cy={y} r="12" fill="#B5654A" stroke="#fff" strokeWidth="2" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
              {i + 1}
            </text>
            <text x={x} y={y - 18} textAnchor="middle" fontSize="11" fill="#303735">
              {s.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
