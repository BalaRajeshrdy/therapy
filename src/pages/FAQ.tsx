import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { FAQAccordion } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/decor'
import { faqs, type FAQ as FAQItem } from '@/data/faqs'
import { clinic } from '@/data/clinic'
import { cn } from '@/lib/utils'

const categories: ('All' | FAQItem['category'])[] = ['All', 'Getting Started', 'Sessions', 'Booking & Fees', 'Families']

export default function FAQ() {
  const [cat, setCat] = useState<(typeof categories)[number]>('All')
  const [q, setQ] = useState('')
  const list = useMemo(
    () => faqs.filter((f) => (cat === 'All' || f.category === cat) && (f.question + f.answer).toLowerCase().includes(q.trim().toLowerCase())),
    [cat, q],
  )
  return (
    <>
      <PageHero
        eyebrow="FAQs"
        title="Frequently asked questions"
        intro="Everything you need to know about occupational therapy, our sessions and booking."
        crumbs={[{ to: '/', label: 'Home' }, { label: 'FAQs' }]}
        tone="lavender"
      />
      <section className="section pt-2">
        <div className="container grid gap-12 lg:grid-cols-[280px_1fr]">
          <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <label className="relative block">
              <span className="sr-only">Search questions</span>
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-charcoal-soft" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search questions…"
                className="h-12 w-full rounded-full border border-forest/15 bg-white pl-11 pr-4 focus:border-forest/50 focus:outline-none focus:ring-4 focus:ring-sage/40"
              />
            </label>
            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2 lg:flex-col">
              {categories.map((c) => (
                <button
                  key={c}

                  aria-pressed={cat === c}
                  onClick={() => setCat(c)}
                  className={cn('rounded-full px-4 py-2.5 text-left text-sm font-semibold transition-colors', cat === c ? 'bg-forest text-ivory' : 'bg-white text-forest ring-1 ring-forest/10 hover:ring-forest/30')}
                >
                  {c}
                </button>
              ))}
            </div>
          </aside>
          <div>
            {list.length ? (
              <Reveal key={cat + q}>
                <FAQAccordion items={list} />
              </Reveal>
            ) : (
              <p className="rounded-3xl bg-white p-8 text-center text-charcoal-soft">No questions match your search. Try another word, or contact us directly.</p>
            )}
            <div className="mt-12 flex flex-col items-start gap-5 rounded-[2rem] bg-peach p-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl">Still have questions?</h2>
                <p className="mt-1 text-charcoal-soft">Call us at {clinic.phone} or send a message.</p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/contact">Contact us</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/booking">Book now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
