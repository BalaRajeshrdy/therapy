import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Hourglass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChoiceCard, Field, Input, Select, Textarea } from '@/components/ui/form'
import { DemoBadge } from '@/components/ui/decor'
import { therapists, fullName } from '@/data/therapists'
import { treatments } from '@/data/treatments'
import { useDemoStore } from '@/hooks/useDemoStore'
import { formatPhone, isValidEmail, isValidPhone } from '@/utils/time'
import type { TimeOfDayPreference } from '@/types'

const DAYS = [
  { v: 1, label: 'Mon' },
  { v: 2, label: 'Tue' },
  { v: 3, label: 'Wed' },
  { v: 4, label: 'Thu' },
  { v: 5, label: 'Fri' },
  { v: 6, label: 'Sat' },
]
const TIMES: { v: TimeOfDayPreference; label: string; hint: string }[] = [
  { v: 'morning', label: 'Mornings', hint: 'Before 12 p.m.' },
  { v: 'afternoon', label: 'Afternoons', hint: '12 – 4 p.m.' },
  { v: 'evening', label: 'After school', hint: 'After 4 p.m.' },
  { v: 'any', label: 'Any time', hint: 'I’m flexible' },
]

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'treatment' | 'days', string>>

export function WaitlistForm({ defaultTreatmentId, defaultTherapistId, onDone }: { defaultTreatmentId?: string; defaultTherapistId?: string; onDone?: () => void }) {
  const { addWaitlistEntry } = useDemoStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [therapistId, setTherapistId] = useState(defaultTherapistId ?? 'any')
  const [treatmentId, setTreatmentId] = useState(defaultTreatmentId ?? '')
  const [days, setDays] = useState<number[]>([])
  const [time, setTime] = useState<TimeOfDayPreference>('any')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (name.trim().length < 2) next.name = 'Please enter your full name.'
    if (!isValidEmail(email)) next.email = 'Please enter a valid email address.'
    if (!isValidPhone(phone)) next.phone = 'Please enter a 10-digit Canadian phone number.'
    if (!treatmentId) next.treatment = 'Please choose a treatment.'
    if (days.length === 0) next.days = 'Please choose at least one preferred day.'
    setErrors(next)
    if (Object.keys(next).length) {
      const first = document.querySelector<HTMLElement>('[data-waitlist-form] [aria-invalid="true"]')
      first?.focus()
      return
    }
    addWaitlistEntry({
      name: name.trim(),
      email: email.trim(),
      phone: formatPhone(phone),
      preferredTherapistId: therapistId,
      preferredTreatmentId: treatmentId,
      preferredDays: days,
      preferredTime: time,
      message: message.trim() || undefined,
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center" role="status">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }} className="grid size-20 place-items-center rounded-full bg-sage-light text-forest">
          <CheckCircle2 className="size-10" aria-hidden />
        </motion.span>
        <h3 className="mt-6 text-3xl">You’re on the waitlist!</h3>
        <p className="mt-3 max-w-sm text-charcoal-soft">
          Thanks, {name.split(' ')[0]}. We’ll be in touch at <strong className="text-forest">{email}</strong> as soon as a suitable opening becomes available.
        </p>
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-butter/70 px-4 py-3 text-sm text-[#5a4b17]">
          <DemoBadge className="bg-white/70">Demo</DemoBadge> Saved in this browser only — no message has been sent.
        </p>
        {onDone && (
          <Button className="mt-6" variant="secondary" onClick={onDone}>
            Close
          </Button>
        )}
      </motion.div>
    )
  }

  return (
    <form noValidate onSubmit={submit} data-waitlist-form className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Parent/Guardian name" error={errors.name} className="sm:col-span-2">
          {(p) => <Input {...p} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field label="Phone" error={errors.phone}>
          {(p) => <Input {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="(905) 555-0123" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />}
        </Field>
        <Field label="Preferred treatment" error={errors.treatment}>
          {(p) => (
            <Select {...p} value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
              <option value="">Select a treatment…</option>
              {treatments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Preferred therapist">
          {(p) => (
            <Select {...p} value={therapistId} onChange={(e) => setTherapistId(e.target.value)}>
              <option value="any">No preference</option>
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {fullName(t)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <fieldset aria-describedby={errors.days ? 'wl-days-error' : undefined}>
        <legend className="text-sm font-semibold text-forest">Preferred days</legend>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DAYS.map((d) => (
            <label
              key={d.v}
              className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-forest/15 bg-white text-sm font-semibold text-forest transition-all hover:border-forest/40 has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-ivory has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sage/50"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={days.includes(d.v)}
                aria-invalid={Boolean(errors.days)}
                onChange={(e) => setDays((prev) => (e.target.checked ? [...prev, d.v] : prev.filter((x) => x !== d.v)))}
              />
              {d.label}
            </label>
          ))}
        </div>
        {errors.days && (
          <p id="wl-days-error" role="alert" className="mt-2 text-sm font-medium text-terracotta">
            {errors.days}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-forest">Preferred time</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIMES.map((t) => (
            <ChoiceCard key={t.v} name="wl-time" value={t.v} checked={time === t.v} onChange={() => setTime(t.v)} label={t.label} description={t.hint} className="p-3" />
          ))}
        </div>
      </fieldset>

      <Field label="Message" optional hint="Anything that would help us find the right opening.">
        {(p) => <Textarea {...p} value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} />}
      </Field>

      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-forest/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-charcoal-soft">
          <DemoBadge /> Saved locally for this demo only.
        </p>
        <Button type="submit">
          <Hourglass aria-hidden /> Join Waitlist
        </Button>
      </div>
    </form>
  )
}
