import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send, Car, Accessibility } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { DemoBadge, Reveal } from '@/components/ui/decor'
import { clinic, fullAddress } from '@/data/clinic'
import { formatPhone, isValidEmail, isValidPhone } from '@/utils/time'
import { useStudio } from '@/studio/store'
import { audit, event } from '@/studio/engine'

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'message', string>>

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: 'General question', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)
  const { act } = useStudio()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Errors = {}
    if (form.name.trim().length < 2) errs.name = 'Please enter your name.'
    if (!isValidEmail(form.email)) errs.email = 'Please enter a valid email address.'
    if (form.phone && !isValidPhone(form.phone)) errs.phone = 'Please enter a valid 10-digit phone number.'
    if (form.message.trim().length < 10) errs.message = 'Please write a short message (at least 10 characters).'
    setErrors(errs)
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-contact-form] [aria-invalid="true"]')?.focus())
      return
    }
    // Demo: the message lands in Treatment Studio → Enquiries (nothing is emailed).
    act((c) => {
      c.s.enquiries.push({ id: `enq_${Date.now().toString(36)}`, name: form.name.trim(), email: form.email.trim(), phone: form.phone, topic: form.topic, message: form.message.trim(), createdAt: new Date().toISOString(), status: 'new', source: 'Contact form' })
      event(c, 'booking-confirmed', `New enquiry · ${form.name.trim()}`, `${form.topic} — via the contact form`, '/studio/enquiries')
      audit({ ...c, actor: 'Website visitor' }, 'Submitted contact form', form.name.trim())
    })
    setSent(true)
  }

  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title="We’d love to hear from you"
        intro="Questions about therapy, booking or whether OT is right for your child? Reach out — a friendly member of our team will get back to you within one business day."
        crumbs={[{ to: '/', label: 'Home' }, { label: 'Contact' }]}
        tone="butter"
      />
      <section className="section pt-4">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="flex flex-col gap-5">
            {[
              { Icon: Phone, k: 'Call us', v: clinic.phone, href: clinic.phoneHref },
              { Icon: Mail, k: 'Email', v: clinic.email, href: `mailto:${clinic.email}` },
              { Icon: MapPin, k: 'Visit', v: fullAddress },
            ].map(({ Icon, k, v, href }) => (
              <div key={k} className="flex items-start gap-4 rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-forest/5">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sage-light text-forest">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">{k}</p>
                  {href ? (
                    <a href={href} className="mt-1 block break-words text-lg font-semibold text-forest hover:underline">
                      {v}
                    </a>
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-forest">{v}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="rounded-[1.75rem] bg-forest p-6 text-ivory">
              <p className="flex items-center gap-2 font-semibold">
                <Clock className="size-5 text-butter" aria-hidden /> Clinic hours
              </p>
              <dl className="mt-4 divide-y divide-ivory/10">
                {clinic.hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 py-2.5 text-sm">
                    <dt className="text-ivory/80">{h.days}</dt>
                    <dd className="font-semibold">{h.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-3xl bg-lavender p-5">
                <Car className="size-5 text-forest" aria-hidden />
                <p className="mt-2 font-semibold text-forest">Free parking</p>
                <p className="text-charcoal-soft">On-site, steps from the door</p>
              </div>
              <div className="rounded-3xl bg-peach p-5">
                <Accessibility className="size-5 text-forest" aria-hidden />
                <p className="mt-2 font-semibold text-forest">Accessible</p>
                <p className="text-charcoal-soft">Step-free entrance & washroom</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-forest/5 sm:p-10">
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12 text-center" role="status">
                  <span className="grid size-20 place-items-center rounded-full bg-sage-light text-forest">
                    <CheckCircle2 className="size-10" aria-hidden />
                  </span>
                  <h2 className="mt-6 text-3xl">Thanks, {form.name.split(' ')[0]}!</h2>
                  <p className="mt-3 max-w-sm text-charcoal-soft">In a live site, our team would reply within one business day.</p>
                  <p className="mt-5 flex items-center gap-2 text-sm text-charcoal-soft">
                    <DemoBadge /> No message was actually sent.
                  </p>
                  <Button variant="secondary" className="mt-6" onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', topic: 'General question', message: '' }) }}>
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <form noValidate onSubmit={submit} data-contact-form className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <h2 className="text-3xl">Send us a message</h2>
                    <p className="mt-2 text-sm text-charcoal-soft">Please don’t include detailed medical information in this form.</p>
                  </div>
                  <Field label="Your name" error={errors.name}>
                    {(p) => <Input {...p} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
                  </Field>
                  <Field label="Email" error={errors.email}>
                    {(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
                  </Field>
                  <Field label="Phone" optional error={errors.phone}>
                    {(p) => <Input {...p} type="tel" autoComplete="tel" placeholder="(905) 555-0123" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} />}
                  </Field>
                  <Field label="Topic">
                    {(p) => (
                      <Select {...p} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                        {['General question', 'Booking help', 'Insurance & receipts', 'School collaboration', 'Careers'].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="Message" error={errors.message} className="sm:col-span-2">
                    {(p) => <Textarea {...p} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />}
                  </Field>
                  <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-xs text-charcoal-soft">
                      <DemoBadge /> Form is a demo — nothing is sent.
                    </p>
                    <Button type="submit" size="lg">
                      <Send aria-hidden /> Send message
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-sage-light">
            <svg viewBox="0 0 1200 380" className="h-[300px] w-full sm:h-[380px]" role="img" aria-label="Stylized map showing the clinic location in Mississauga (illustrative)">
              <rect width="1200" height="380" fill="#DCE5DA" />
              <path d="M0 250 C 200 220, 380 300, 600 240 S 1000 180, 1200 220" stroke="#C9D6C6" strokeWidth="48" fill="none" />
              <path d="M-20 90 L 1220 140" stroke="#FAF8F5" strokeWidth="18" />
              <path d="M300 -20 L 380 400" stroke="#FAF8F5" strokeWidth="14" />
              <path d="M820 -20 L 760 400" stroke="#FAF8F5" strokeWidth="22" />
              <path d="M-20 320 L 1220 300" stroke="#FAF8F5" strokeWidth="10" />
              <circle cx="180" cy="170" r="40" fill="#C9D6C6" />
              <circle cx="1010" cy="80" r="56" fill="#C9D6C6" />
              <rect x="460" y="170" width="120" height="60" rx="14" fill="#F4E5DA" />
              <rect x="900" y="230" width="90" height="50" rx="12" fill="#E9E3F1" />
            </svg>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <div className="flex flex-col items-center">
                <div className="rounded-2xl bg-forest px-5 py-3 text-center text-ivory shadow-lift">
                  <p className="font-serif text-lg">{clinic.fullName}</p>
                  <p className="text-xs text-ivory/80">{clinic.address.line1}</p>
                </div>
                <span className="-mt-1 size-4 rotate-45 bg-forest" aria-hidden />
                <span className="mt-1 size-4 rounded-full bg-terracotta ring-8 ring-terracotta/20" aria-hidden />
              </div>
            </div>
            <p className="absolute bottom-4 left-5 rounded-full bg-white/80 px-3 py-1 text-xs text-charcoal-soft">Illustrative map — demo address</p>
          </div>
        </div>
      </section>
    </>
  )
}
