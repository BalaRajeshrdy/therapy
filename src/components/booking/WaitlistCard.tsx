import { useState } from 'react'
import { BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { WaitlistForm } from './WaitlistForm'
import { cn } from '@/lib/utils'

export function WaitlistCard({ treatmentId, therapistId, className }: { treatmentId?: string; therapistId?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn('relative overflow-hidden rounded-3xl bg-lavender p-6', className)}>
      <div className="absolute -right-6 -top-6 size-28 rounded-full bg-white/40" aria-hidden />
      <span className="relative grid size-11 place-items-center rounded-2xl bg-white text-forest shadow-soft">
        <BellRing className="size-5" aria-hidden />
      </span>
      <h3 className="relative mt-4 text-2xl">Can’t find a suitable appointment?</h3>
      <p className="relative mt-2 text-[0.95rem] leading-relaxed text-charcoal-soft">
        Join our waitlist and we’ll contact you when a suitable opening becomes available.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="relative mt-5">
            Join Waitlist
          </Button>
        </DialogTrigger>
        <DialogContent title="Join our waitlist" description="Tell us what works for your family and we’ll reach out when a matching time opens up.">
          <WaitlistForm defaultTreatmentId={treatmentId} defaultTherapistId={therapistId === 'any' ? undefined : therapistId} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
