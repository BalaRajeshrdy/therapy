import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Blob } from '@/components/ui/decor'

export default function NotFound() {
  return (
    <section className="relative overflow-hidden py-32">
      <Blob className="left-1/2 top-0 w-[560px] -translate-x-1/2 opacity-70" fill="#F4E5DA" />
      <div className="container relative flex flex-col items-center text-center">
        <p className="font-serif text-8xl text-sage">404</p>
        <h1 className="mt-4 text-4xl">Oops — this page went out to play</h1>
        <p className="mt-3 max-w-md text-charcoal-soft">We couldn’t find the page you were looking for. Let’s get you back on track.</p>
        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/booking">Book an appointment</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
