import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleHeart, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssistantChat } from '@/studio/AssistantChat'

/** Floating website assistant (demo AI) shown on public pages. */
export function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const onBooking = pathname.startsWith('/booking')
  return (
    <div className={cn('no-print fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6', onBooking && 'max-lg:hidden')}>
      <AnimatePresence>
        {open && (
          <motion.div
            id="assistant-panel"
            role="dialog"
            aria-label="Website assistant"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-ivory shadow-lift ring-1 ring-forest/10"
          >
            <div className="flex items-center justify-between bg-forest px-4 py-3 text-ivory">
              <div>
                <p className="font-serif text-lg leading-tight">Ask Maple Sprout</p>
                <p className="text-xs text-ivory/75">Demo AI assistant · usually instant</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-full p-2 hover:bg-ivory/10">
                <X className="size-5" />
              </button>
            </div>
            <AssistantChat compact onNavigate={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        className="flex h-14 items-center gap-2 rounded-full bg-forest px-5 font-semibold text-ivory shadow-lift transition-transform hover:-translate-y-0.5"
      >
        {open ? <X className="size-5" aria-hidden /> : <MessageCircleHeart className="size-5" aria-hidden />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Questions? Ask us'}</span>
        <span className="sr-only sm:hidden">{open ? 'Close assistant' : 'Open website assistant'}</span>
      </button>
    </div>
  )
}
