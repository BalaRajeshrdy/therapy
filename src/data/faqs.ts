export interface FAQ {
  id: string
  category: 'Getting Started' | 'Sessions' | 'Booking & Fees' | 'Families'
  question: string
  answer: string
}

export const faqs: FAQ[] = [
  {
    id: 'what-is-ot',
    category: 'Getting Started',
    question: 'What is paediatric occupational therapy?',
    answer:
      'Paediatric occupational therapy helps children build the skills they need for the “jobs” of childhood — playing, learning, getting dressed, eating, writing and making friends. Our therapists use playful, purposeful activities to strengthen fine and gross motor skills, sensory processing, attention and everyday independence.',
  },
  {
    id: 'need-referral',
    category: 'Getting Started',
    question: 'Do I need a doctor’s referral to book?',
    answer:
      'No referral is needed. Parents and guardians can book an assessment directly. Some extended health plans ask for a physician’s note before reimbursing therapy, so we recommend checking your plan details before your first visit.',
  },
  {
    id: 'signs',
    category: 'Getting Started',
    question: 'How do I know if my child could benefit from OT?',
    answer:
      'Families often reach out when a child finds everyday tasks frustrating — holding a pencil, managing buttons and zippers, coping with noisy or busy places, staying regulated during transitions, or keeping up with peers on the playground. If something is on your mind, an assessment is a gentle, low-pressure way to get clarity.',
  },
  {
    id: 'ages',
    category: 'Families',
    question: 'What ages do you work with?',
    answer:
      'We support children and youth from 18 months to 18 years. Sessions are always adapted to your child’s age, interests and developmental stage.',
  },
  {
    id: 'first-session',
    category: 'Sessions',
    question: 'What happens during the first assessment?',
    answer:
      'We begin with a relaxed conversation about your child’s strengths, interests and the goals that matter to your family. Your therapist then observes and engages your child through play-based activities and standardized tools where appropriate. You’ll leave with initial observations and next steps, followed by a written summary.',
  },
  {
    id: 'modes',
    category: 'Sessions',
    question: 'What’s the difference between in-clinic, remote and in-home sessions?',
    answer:
      'In-clinic sessions take place in our sensory-friendly Mississauga clinic with specialized equipment. Remote sessions happen over secure video and work well for parent coaching and older children. In-home sessions bring the therapist to your home, so we can work on routines in the environment where they actually happen.',
  },
  {
    id: 'parent-involvement',
    category: 'Families',
    question: 'Can parents join the sessions?',
    answer:
      'Absolutely — and we encourage it. Parents and caregivers are a child’s most important teachers. We share strategies during each session so progress continues at home, at daycare and at school.',
  },
  {
    id: 'insurance',
    category: 'Booking & Fees',
    question: 'Are your services covered by insurance?',
    answer:
      'Occupational therapy is commonly covered under extended health benefit plans in Ontario. Coverage varies, so please check with your provider. We provide detailed receipts after every session. (Demo note: fees are not displayed on this demonstration website.)',
  },
  {
    id: 'cancel',
    category: 'Booking & Fees',
    question: 'What is your cancellation policy?',
    answer:
      'Life with little ones is unpredictable — we understand. We ask for at least 24 hours’ notice to cancel or reschedule so we can offer the time to a family on our waitlist. You can manage your booking online at any time.',
  },
  {
    id: 'waitlist',
    category: 'Booking & Fees',
    question: 'What if I can’t find a time that works?',
    answer:
      'Join our waitlist from the booking page. Tell us your preferred therapist, days and times, and we’ll reach out as soon as a suitable opening becomes available.',
  },
  {
    id: 'school',
    category: 'Families',
    question: 'Do you collaborate with schools and daycares?',
    answer:
      'Yes. With your consent, we’re happy to share recommendations with teachers, early childhood educators and other professionals on your child’s team so everyone is working toward the same goals.',
  },
  {
    id: 'prepare',
    category: 'Sessions',
    question: 'How should we prepare for the first visit?',
    answer:
      'Dress your child in comfortable clothes they can move in, bring a snack and water, and any school work samples or reports you’d like to share. For remote sessions, a quiet space with a tablet or laptop works best.',
  },
]
