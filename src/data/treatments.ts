import type { Treatment } from '@/types'
import { images } from './images'

export const treatments: Treatment[] = [
  {
    id: 'ot-assessment-clinic',
    slug: 'ot-assessment-in-clinic',
    name: 'OT Assessment – In-Clinic',
    shortName: 'In-Clinic Assessment',
    category: 'Occupational Therapy',
    durationMinutes: 60,
    mode: 'In-Clinic',
    shortDescription:
      'An initial assessment to understand your child’s developmental needs, motor skills, attention and daily functional abilities.',
    description: [
      'Our in-clinic assessment is the most popular starting point for families. Held in our bright, sensory-friendly Mississauga clinic, it gives your therapist access to a full range of equipment — swings, climbing structures, fine motor stations and standardized assessment tools.',
      'Through play-based activities and conversation, we explore your child’s fine and gross motor skills, sensory processing, attention, visual-motor integration and everyday self-care skills, then share what we observed and recommend clear next steps.',
    ],
    highlights: ['Sensory-friendly therapy rooms', 'Standardized and play-based tools', 'Same-day verbal feedback', 'Written summary with recommendations'],
    whatToExpect: [
      { title: 'Welcome & conversation', body: 'We get to know your child’s strengths, interests and the goals most important to your family.' },
      { title: 'Play-based exploration', body: 'Your child engages in purposeful play while your therapist observes motor, sensory and attention skills.' },
      { title: 'Shared observations', body: 'Before you leave, we talk through what we noticed and answer your questions.' },
      { title: 'Personalized plan', body: 'You receive a written summary and recommended next steps within about a week.' },
    ],
    idealFor: ['First-time families', 'Children who enjoy movement and hands-on play', 'Fine and gross motor concerns', 'Sensory processing questions'],
    image: images.playroom,
    accent: 'sage',
  },
  {
    id: 'ot-assessment-remote',
    slug: 'ot-assessment-remote',
    name: 'OT Assessment – Remote',
    shortName: 'Remote Assessment',
    category: 'Occupational Therapy',
    durationMinutes: 60,
    mode: 'Virtual',
    shortDescription:
      'A flexible occupational therapy assessment over secure video — professional support without the commute.',
    description: [
      'Remote assessments make expert occupational therapy accessible from anywhere in Ontario. Over a secure video call, your therapist guides you and your child through carefully chosen activities using everyday household items.',
      'This format is especially helpful for parent coaching, school-aged children, handwriting and organization concerns, and families with busy schedules or longer travel distances.',
    ],
    highlights: ['Secure video platform', 'Simple at-home materials list', 'Ideal for parent coaching', 'Written summary with recommendations'],
    whatToExpect: [
      { title: 'Quick tech check', body: 'We send a link and a short list of household items to have nearby before your session.' },
      { title: 'Guided activities', body: 'Your therapist leads short, playful tasks and coaches you through observations on screen.' },
      { title: 'Parent conversation', body: 'We discuss daily routines, school feedback and what feels hardest right now.' },
      { title: 'Personalized plan', body: 'You receive practical strategies and next steps you can start using right away.' },
    ],
    idealFor: ['Busy family schedules', 'School-aged children and teens', 'Handwriting and organization', 'Parent strategy sessions'],
    image: images.remoteChild,
    accent: 'lavender',
  },
  {
    id: 'ot-assessment-home',
    slug: 'ot-assessment-in-home',
    name: 'OT Assessment – In-Home',
    shortName: 'In-Home Assessment',
    category: 'Occupational Therapy',
    durationMinutes: 60,
    mode: 'In-Home',
    shortDescription:
      'A personalized assessment in your child’s own home, where everyday routines naturally happen.',
    description: [
      'Some of the most meaningful insights come from seeing a child in their own space. During an in-home assessment, your therapist visits you and explores the routines that matter most — getting dressed, mealtimes, play, homework and bedtime.',
      'Children often feel more relaxed and confident at home, which helps us see their true abilities and suggest practical changes to the environment and routine.',
    ],
    highlights: ['Therapist travels to you', 'Real-world routine observation', 'Home set-up suggestions', 'Written summary with recommendations'],
    whatToExpect: [
      { title: 'Arrival & settling in', body: 'Your therapist arrives with a bag of engaging tools and lets your child take the lead in getting comfortable.' },
      { title: 'Routine walkthrough', body: 'We observe everyday tasks in the spaces where they happen — bedroom, kitchen table, play area.' },
      { title: 'Environment ideas', body: 'We suggest simple adjustments to seating, storage, lighting or routines that make a big difference.' },
      { title: 'Personalized plan', body: 'You receive a summary with practical next steps tailored to your home.' },
    ],
    idealFor: ['Younger children and toddlers', 'Self-care and daily routines', 'Children who find new places overwhelming', 'Families in Mississauga and nearby'],
    image: images.familyHome,
    accent: 'peach',
  },
  {
    id: 'ot-assessment-home-extended',
    slug: 'ot-assessment-in-home-extended',
    name: 'OT Assessment – In-Home (Extended)',
    shortName: 'Extended In-Home Assessment',
    category: 'Occupational Therapy',
    durationMinutes: 120,
    mode: 'In-Home',
    shortDescription:
      'A comprehensive two-hour assessment for children with multiple developmental and sensory needs.',
    description: [
      'The extended in-home assessment allows time for a truly comprehensive picture. It is designed for children whose needs touch several areas — such as motor coordination, sensory processing, emotional regulation and self-care — or for families who want a detailed report to share with schools and other professionals.',
      'With two full hours, we can move at your child’s pace, take breaks when needed, and observe a wider range of daily routines in your home.',
    ],
    highlights: ['Two full hours at your child’s pace', 'Multi-area, in-depth assessment', 'Detailed written report', 'Ideal for sharing with school teams'],
    whatToExpect: [
      { title: 'Intake conversation', body: 'A detailed discussion of developmental history, strengths and family priorities.' },
      { title: 'Comprehensive exploration', body: 'Motor, sensory, regulation and self-care skills explored across multiple home routines.' },
      { title: 'Breaks & flexibility', body: 'Plenty of time for movement breaks and snack time so your child can stay regulated.' },
      { title: 'Detailed report', body: 'A thorough written report with goals and recommendations for home, school and therapy.' },
    ],
    idealFor: ['Multiple developmental or sensory needs', 'Children who need extra time and breaks', 'Families wanting a detailed report', 'School planning conversations'],
    image: images.toyCamera,
    accent: 'butter',
  },
]

export const treatmentById = (id?: string | null) => treatments.find((t) => t.id === id)
export const treatmentBySlug = (slug?: string) => treatments.find((t) => t.slug === slug)
