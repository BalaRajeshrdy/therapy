import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { isValidEmail, isValidPhone } from '@/utils/time'
import { cn } from '@/lib/utils'
import { assistantReply, assistantStarters, type AssistantReply } from './ai'
import { useStudio } from './store'
import { audit, event } from './engine'
import { sid } from './util'

interface Msg {
  from: 'bot' | 'user'
  text: string
  reply?: AssistantReply
}

/** Rule-based "AI" website assistant. Answers from the clinic's own FAQ content and guides to booking. */
export function AssistantChat({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  const { act } = useStudio()
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: 'Hi! I’m the Maple Sprout assistant. I can help with booking, services, home visits and our team. What would you like to know?' }])
  const [text, setText] = useState('')
  const [contact, setContact] = useState({ name: '', reach: '' })
  const [contactErr, setContactErr] = useState('')
  const [captured, setCaptured] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [msgs])

  const ask = (q: string) => {
    if (!q.trim()) return
    const reply = assistantReply(q)
    setMsgs((m) => [...m, { from: 'user', text: q }, { from: 'bot', text: reply.text, reply }])
    setText('')
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(text)
  }
  const sendContact = (e: FormEvent) => {
    e.preventDefault()
    const isEmail = isValidEmail(contact.reach)
    if (contact.name.trim().length < 2 || !(isEmail || isValidPhone(contact.reach))) {
      setContactErr('Please add your name and a valid email or phone number.')
      return
    }
    const lastQ = [...msgs].reverse().find((m) => m.from === 'user')?.text ?? 'Asked for a call back'
    act((c) => {
      c.s.enquiries.push({ id: sid('enq'), name: contact.name.trim(), email: isEmail ? contact.reach.trim() : '', phone: isEmail ? '' : contact.reach.trim(), topic: 'Website assistant', message: lastQ, createdAt: new Date().toISOString(), status: 'new', source: 'Website assistant' })
      event(c, 'booking-confirmed', `New enquiry · ${contact.name.trim()}`, 'Captured by the website assistant; waiting in Enquiries', '/studio/enquiries')
      audit({ ...c, actor: 'Website assistant' }, 'Captured enquiry', contact.name.trim())
    })
    setCaptured(true)
    setMsgs((m) => [...m, { from: 'bot', text: `Thanks, ${contact.name.trim().split(' ')[0]}! Our front desk will be in touch within one business day.` }])
  }
  const wantsContact = msgs[msgs.length - 1]?.reply?.askContact && !captured

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex-1 space-y-3 overflow-y-auto p-4', compact ? 'max-h-[46dvh]' : 'max-h-[420px]')} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={cn('flex gap-2', m.from === 'user' && 'flex-row-reverse')}>
            <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', m.from === 'bot' ? 'bg-sage-light text-forest' : 'bg-forest text-ivory')} aria-hidden>
              {m.from === 'bot' ? <Bot className="size-4" /> : <User className="size-4" />}
            </span>
            <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm', m.from === 'bot' ? 'bg-white text-charcoal shadow-soft' : 'bg-forest text-ivory')}>
              <span className="sr-only">{m.from === 'bot' ? 'Assistant: ' : 'You: '}</span>
              {m.text}
              {m.reply?.links && (
                <span className="mt-2 flex flex-wrap gap-2">
                  {m.reply.links.map((l) => (
                    <Link key={l.to} to={l.to} onClick={onNavigate} className="rounded-full bg-sage-light px-3 py-1 text-xs font-semibold text-forest hover:bg-sage/60">
                      {l.label}
                    </Link>
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
        {wantsContact && (
          <form onSubmit={sendContact} className="space-y-2 rounded-2xl bg-butter/60 p-3" aria-label="Request a call back">
            <label className="block text-xs font-semibold text-forest" htmlFor="as-name">
              Your name
            </label>
            <Input id="as-name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="h-10" />
            <label className="block text-xs font-semibold text-forest" htmlFor="as-reach">
              Email or phone
            </label>
            <Input id="as-reach" value={contact.reach} onChange={(e) => setContact({ ...contact, reach: e.target.value })} className="h-10" />
            {contactErr && <p role="alert" className="text-xs text-terracotta">{contactErr}</p>}
            <Button size="sm" type="submit">
              Request a call back
            </Button>
          </form>
        )}
        <div ref={end} />
      </div>
      <div className="border-t border-forest/10 p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {assistantStarters.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)} className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-forest ring-1 ring-forest/10 hover:bg-sage-light">
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor="assistant-input" className="sr-only">
            Message the assistant
          </label>
          <Input id="assistant-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question…" className="h-11" autoComplete="off" />
          <Button type="submit" size="icon" aria-label="Send" className="size-11 shrink-0">
            <Send aria-hidden />
          </Button>
        </form>
        <p className="mt-2 text-[0.7rem] text-charcoal-soft">Demo AI assistant · answers from the clinic’s FAQs · not medical advice. Please don’t share health details.</p>
      </div>
    </div>
  )
}
