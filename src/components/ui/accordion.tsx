import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function FAQAccordion({ items, className }: { items: { id: string; question: string; answer: ReactNode }[]; className?: string }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.id}
          value={item.id}
          className="overflow-hidden rounded-3xl border border-forest/10 bg-white transition-shadow duration-300 data-[state=open]:shadow-soft"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left font-sans text-[1.05rem] font-semibold text-forest transition-colors hover:text-forest-light sm:px-7">
              {item.question}
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sage-light text-forest transition-all duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-forest group-data-[state=open]:text-ivory">
                <Plus className="size-4" aria-hidden />
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="px-6 pb-6 text-[0.98rem] leading-relaxed text-charcoal-soft sm:px-7">{item.answer}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}
