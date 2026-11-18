import { Hero } from '@/components/home/Hero'
import { Approach, FAQPreview, HowToBook, HowWeHelp, LittleHands, Modes, ServicesPreview, TherapistsPreview, Testimonials, Welcome, WhyChooseUs } from '@/components/home/Sections'
import { BookingCTA } from '@/components/home/BookingCTA'

export default function Home() {
  return (
    <>
      <Hero />
      <Welcome />
      <LittleHands />
      <ServicesPreview />
      <WhyChooseUs />
      <HowWeHelp />
      <TherapistsPreview />
      <Approach />
      <Modes />
      <HowToBook />
      <Testimonials />
      <FAQPreview />
      <BookingCTA title="Let’s help your child grow, thrive and shine." />
    </>
  )
}
