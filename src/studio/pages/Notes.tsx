import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Lock, Mic, NotebookPen, Save, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/form'
import { formatTime } from '@/utils/time'
import { useStudio } from '../store'
import { Guard } from '../layout'
import { AIBadge, Card, CardTitle, Empty, Notice, PageHeader, Pill, StatusPill, TextLink } from '../ui'
import { audit, childById, childName, therapistName } from '../engine'
import { draftSoap, sampleVoiceMemo } from '../ai'
import { noteTasks } from '../selectors'
import { serviceById } from '../reference'
import { durationMin, fullDate, shortDate, sid, stamp } from '../util'
import type { SoapNote } from '../types'

export default function Notes() {
  return (
    <Guard area="notes">
      <NotesInner />
    </Guard>
  )
}

function NotesInner() {
  const { s, viewer } = useStudio()
  const mine = viewer.role === 'therapist' ? viewer.therapistId : undefined
  const tasks = noteTasks(s, mine)
  const signed = s.notes.filter((n) => n.status === 'signed' && (!mine || n.therapistId === mine)).sort((a, b) => (b.signedAt ?? '').localeCompare(a.signedAt ?? '')).slice(0, 10)
  return (
    <>
      <PageHeader eyebrow="Session notes" title="Notes to write" intro="A note task is created automatically when a visit is completed. Speak or type a few bullets — AI drafts a structured SOAP note — and the therapist edits and signs it." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card aria-labelledby="tasks-h">
          <CardTitle id="tasks-h">Open note tasks ({tasks.length})</CardTitle>
          {tasks.length ? (
            <ul className="space-y-2">
              {tasks.map((a) => {
                const draft = s.notes.find((n) => n.appointmentId === a.id)
                return (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ivory p-4">
                    <div>
                      <p className="font-semibold text-forest">{childName(s, a.childId)}</p>
                      <p className="text-sm text-charcoal-soft">
                        {fullDate(a.date)} · {serviceById(a.serviceId)?.shortName} · {therapistName(a.therapistId)}
                      </p>
                    </div>
                    <span className="flex items-center gap-2">
                      {draft ? <Pill tone="butter">Draft</Pill> : <Pill tone="peach">Not started</Pill>}
                      <Button asChild size="sm">
                        <Link to={`/studio/notes/${a.id}`}>
                          <NotebookPen aria-hidden /> Write note
                        </Link>
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Empty icon={CheckCircle2}>All notes are signed. Nice work!</Empty>
          )}
        </Card>
        <Card aria-labelledby="signed-h">
          <CardTitle id="signed-h">Recently signed</CardTitle>
          <ul className="divide-y divide-forest/5">
            {signed.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span>
                  <b className="text-forest">{childName(s, n.childId)}</b> · {shortDate(s.appointments.find((a) => a.id === n.appointmentId)?.date ?? '')}
                </span>
                <span className="flex items-center gap-2">
                  {n.aiDrafted && <Pill tone="butter" icon={Sparkles}>AI draft</Pill>}
                  <TextLink to={`/studio/notes/${n.appointmentId}`}>View</TextLink>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

export function NoteEditor() {
  return (
    <Guard area="notes">
      <NoteEditorInner />
    </Guard>
  )
}

const LABELS: Record<keyof SoapNote, string> = { s: 'Subjective', o: 'Objective', a: 'Assessment', p: 'Plan' }

function NoteEditorInner() {
  const { apptId } = useParams()
  const { s, act, viewer } = useStudio()
  const nav = useNavigate()
  const appt = s.appointments.find((a) => a.id === apptId)
  const existing = s.notes.find((n) => n.appointmentId === apptId)
  const [bullets, setBullets] = useState('')
  const [soap, setSoap] = useState<SoapNote>(existing?.soap ?? { s: '', o: '', a: '', p: '' })
  const [ai, setAi] = useState(existing?.aiDrafted ?? false)
  const [msg, setMsg] = useState('')
  const [drafting, setDrafting] = useState(false)
  if (!appt) return <Empty>Visit not found.</Empty>
  const ch = childById(s, appt.childId)!
  const goals = s.goals.filter((g) => g.childId === ch.id && g.status === 'active')
  const locked = existing?.status === 'signed'
  const canSign = viewer.role === 'therapist' && viewer.therapistId === appt.therapistId

  const draft = () => {
    if (!bullets.trim()) return setMsg('Add a few bullets or use the sample voice memo first.')
    setDrafting(true)
    setMsg('')
    setTimeout(() => {
      setSoap(draftSoap({ bullets, child: ch.firstName, serviceId: appt.serviceId, minutes: durationMin(appt.start, appt.end), goals }))
      setAi(true)
      setDrafting(false)
    }, 700)
  }
  const save = (status: 'draft' | 'signed') => {
    if (Object.values(soap).some((v) => !v.trim())) return setMsg('Please complete all four SOAP sections.')
    act((c) => {
      const now = new Date().toISOString()
      const note = c.s.notes.find((n) => n.appointmentId === appt.id)
      if (note) Object.assign(note, { soap, status, aiDrafted: ai, signedAt: status === 'signed' ? now : undefined })
      else c.s.notes.push({ id: sid('n'), appointmentId: appt.id, childId: ch.id, therapistId: appt.therapistId, status, soap, aiDrafted: ai, createdAt: now, signedAt: status === 'signed' ? now : undefined })
      audit(c, status === 'signed' ? 'Signed session note' : 'Saved note draft', `${ch.firstName} ${ch.lastName} · ${appt.date}`)
    })
    if (status === 'signed') nav('/studio/notes')
    else setMsg('Draft saved.')
  }

  return (
    <>
      <PageHeader eyebrow="Session note" title={`${ch.firstName} ${ch.lastName}`} intro={`${fullDate(appt.date)} · ${formatTime(appt.start)} · ${serviceById(appt.serviceId)?.name} · ${therapistName(appt.therapistId)}`} actions={<TextLink to="/studio/notes">All notes</TextLink>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card aria-labelledby="ctx-h">
            <CardTitle id="ctx-h">Visit</CardTitle>
            <div className="flex flex-wrap gap-2">
              <StatusPill status={appt.status} />
              {appt.signature && <Pill>Parent signed</Pill>}
            </div>
            <p className="mb-2 mt-4 text-sm font-semibold text-forest">Active goals</p>
            <ul className="space-y-1.5 text-sm">
              {goals.map((g) => (
                <li key={g.id}>
                  <Pill tone="lavender">{g.domain}</Pill> {g.title}
                </li>
              ))}
            </ul>
          </Card>
          {!locked && (
            <Card aria-labelledby="bul-h">
              <CardTitle id="bul-h">Voice memo or bullets</CardTitle>
              <label htmlFor="bullets" className="sr-only">
                Session bullets
              </label>
              <Textarea id="bullets" value={bullets} onChange={(e) => setBullets(e.target.value)} placeholder={'- Parent reports…\n- Completed…\n- Next session…'} className="min-h-[180px]" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setBullets(sampleVoiceMemo(ch.firstName))}>
                  <Mic aria-hidden /> Use sample voice memo
                </Button>
                <Button size="sm" onClick={draft} disabled={drafting}>
                  <Sparkles aria-hidden /> {drafting ? 'Drafting…' : 'Draft SOAP note'}
                </Button>
              </div>
              <p className="mt-2 text-xs text-charcoal-soft">Demo: the voice memo is a sample transcript. Drafting runs locally — nothing leaves this browser.</p>
            </Card>
          )}
        </div>
        <Card aria-labelledby="soap-h">
          <CardTitle id="soap-h" action={ai && <AIBadge />}>
            SOAP note {locked && <Lock className="ml-1 inline size-4" aria-label="Signed and locked" />}
          </CardTitle>
          <div className="space-y-4">
            {(Object.keys(LABELS) as (keyof SoapNote)[]).map((k) => (
              <div key={k}>
                <label htmlFor={`soap-${k}`} className="text-sm font-semibold text-forest">
                  {LABELS[k]}
                </label>
                <Textarea id={`soap-${k}`} value={soap[k]} readOnly={locked} onChange={(e) => setSoap({ ...soap, [k]: e.target.value })} className="mt-1.5 min-h-[90px]" />
              </div>
            ))}
          </div>
          {msg && (
            <p role="status" className="mt-3 text-sm font-semibold text-terracotta">
              {msg}
            </p>
          )}
          {locked ? (
            <p className="mt-4 text-sm text-charcoal-soft">
              Signed by {therapistName(existing!.therapistId)} {existing?.signedAt && `on ${stamp(existing.signedAt)}`}. Signed notes are locked; changes require an addendum in production.
            </p>
          ) : canSign ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => save('draft')}>
                <Save aria-hidden /> Save draft
              </Button>
              <Button onClick={() => save('signed')}>
                <CheckCircle2 aria-hidden /> Approve &amp; sign
              </Button>
            </div>
          ) : (
            <div className="mt-5">
              <Notice tone="lavender">Only the treating therapist ({therapistName(appt.therapistId)}) can sign this note. Switch role to “Therapist” to try it.</Notice>
              <Button className="mt-3" variant="secondary" onClick={() => save('draft')}>
                <Save aria-hidden /> Save draft
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
