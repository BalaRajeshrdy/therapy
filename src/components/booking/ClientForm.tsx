import { useState, type FormEvent } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { ClientDetails, SessionMode } from '@/types'
import { Button } from '@/components/ui/button'
import { ChoiceCard, Field, Input, Textarea } from '@/components/ui/form'
import { modeLabel } from '@/components/services/ServiceCard'
import { formatPhone, isValidEmail, isValidPhone } from '@/utils/time'

type Errors = Partial<Record<keyof ClientDetails, string>>

export function validateClient(c: ClientDetails): Errors {
  const e: Errors = {}
  if (!c.firstName.trim()) e.firstName = 'Please enter your first name.'
  if (!c.lastName.trim()) e.lastName = 'Please enter your last name.'
  if (!c.email.trim()) e.email = 'Please enter your email address.'
  else if (!isValidEmail(c.email)) e.email = 'That email doesn’t look quite right — please check it.'
  if (!c.phone.trim()) e.phone = 'Please enter a phone number.'
  else if (!isValidPhone(c.phone)) e.phone = 'Please enter a valid 10-digit Canadian phone number, e.g. (905) 555-0123.'
  if (!c.consent) e.consent = 'Please confirm you agree before continuing.'
  return e
}

export function ClientForm({ initial, mode, onSubmit, onBack }: { initial: ClientDetails; mode: SessionMode; onSubmit: (c: ClientDetails) => void; onBack: () => void }) {
  const [c, setC] = useState<ClientDetails>({ ...initial, sessionMode: mode })
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState(false)

  const set = <K extends keyof ClientDetails>(k: K, v: ClientDetails[K]) => {
    const next = { ...c, [k]: v }
    setC(next)
    if (touched) setErrors(validateClient(next))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const errs = validateClient(c)
    setErrors(errs)
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-client-form] [aria-invalid="true"]')?.focus())
      return
    }
    onSubmit({ ...c, firstName: c.firstName.trim(), lastName: c.lastName.trim(), email: c.email.trim(), phone: formatPhone(c.phone), childFirstName: c.childFirstName?.trim() || undefined, message: c.message?.trim() || undefined })
  }

  const errorCount = Object.keys(errors).length

  return (
    <form noValidate onSubmit={submit} data-client-form className="flex flex-col gap-7">
      {touched && errorCount > 0 && (
        <div role="alert" className="rounded-2xl border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-terracotta">
          <strong>Please fix {errorCount} field{errorCount > 1 ? 's' : ''}</strong> highlighted below to continue.
        </div>
      )}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-2xl text-forest">Parent / Guardian</legend>
        <Field label="First name" error={errors.firstName}>
          {(p) => <Input {...p} autoComplete="given-name" value={c.firstName} onChange={(e) => set('firstName', e.target.value)} />}
        </Field>
        <Field label="Last name" error={errors.lastName}>
          {(p) => <Input {...p} autoComplete="family-name" value={c.lastName} onChange={(e) => set('lastName', e.target.value)} />}
        </Field>
        <Field label="Email" error={errors.email} hint="We’d send your confirmation here (not in this demo).">
          {(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" value={c.email} onChange={(e) => set('email', e.target.value)} />}
        </Field>
        <Field label="Phone" error={errors.phone}>
          {(p) => <Input {...p} type="tel" autoComplete="tel-national" inputMode="tel" placeholder="(905) 555-0123" value={c.phone} onChange={(e) => set('phone', formatPhone(e.target.value))} />}
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-2xl text-forest">About the visit</legend>
        <Field label="Child’s first name" optional>
          {(p) => <Input {...p} autoComplete="off" value={c.childFirstName ?? ''} onChange={(e) => set('childFirstName', e.target.value)} />}
        </Field>
        <Field label="Session type">
          {(p) => <Input {...p} value={modeLabel[mode]} readOnly className="bg-sage-light/40 font-medium text-forest" />}
        </Field>
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-forest" id="client-type-label">
            Have you visited us before?
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="client-type-label">
            <ChoiceCard name="clientType" value="new" checked={c.clientType === 'new'} onChange={() => set('clientType', 'new')} label="New client" description="This is our first visit" />
            <ChoiceCard name="clientType" value="returning" checked={c.clientType === 'returning'} onChange={() => set('clientType', 'returning')} label="Returning client" description="We’ve visited before" />
          </div>
        </div>
        <Field label="Message for your therapist" optional className="sm:col-span-2" hint="Please don’t include detailed medical information — your therapist will discuss this with you directly.">
          {(p) => <Textarea {...p} maxLength={500} value={c.message ?? ''} onChange={(e) => set('message', e.target.value)} placeholder="e.g. Best times to reach us, accessibility needs, or anything you’d like us to know." />}
        </Field>
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-forest/15 bg-white p-4 has-[:checked]:border-forest has-[:checked]:bg-sage-light/40">
          <input
            type="checkbox"
            className="mt-1 size-[18px] shrink-0 accent-forest"
            checked={c.consent}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            onChange={(e) => set('consent', e.target.checked)}
          />
          <span className="text-sm leading-relaxed text-charcoal">
            I am the parent or legal guardian, and I agree to the clinic’s cancellation policy (24 hours’ notice) and consent to being contacted about this appointment.
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" role="alert" className="mt-2 text-sm font-medium text-terracotta">
            {errors.consent}
          </p>
        )}
      </div>

      <p className="flex items-start gap-2 text-xs text-charcoal-soft">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage-dark" aria-hidden />
        Demo notice: details stay in this browser’s local storage only. Nothing is sent to a server.
      </p>

      <div className="flex flex-col-reverse gap-3 border-t border-forest/10 pt-6 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back to times
        </Button>
        <Button type="submit" size="lg">
          Review booking <ArrowRight aria-hidden />
        </Button>
      </div>
    </form>
  )
}
