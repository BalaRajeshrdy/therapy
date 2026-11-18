import type { Therapist } from '@/types'
import { images } from './images'

/**
 * FICTIONAL DEMO THERAPISTS.
 * These are not real people or real registered professionals. Names, credentials
 * and biographies are placeholders for presentation purposes only; photos are
 * stock images of models.
 */
export const therapists: Therapist[] = [
  {
    id: 'sofia-marchetti',
    slug: 'sofia-marchetti',
    firstName: 'Sofia',
    lastName: 'Marchetti',
    credentials: 'B.Sc. (Kin), M.Sc. (OT)',
    title: 'Lead Occupational Therapist & Co-Founder',
    image: images.therapistSofia,
    accent: 'sage',
    shortBio:
      'Sofia blends movement science with playful, child-led therapy to help kids build confidence in their bodies and everyday routines.',
    bio: [
      'Sofia began her career studying kinesiology before discovering a passion for helping children move, play and participate with confidence. She went on to complete her Master of Science in Occupational Therapy and co-founded Maple Sprout to create the warm, family-centred clinic she always wished existed.',
      'Her sessions are lively, creative and grounded in each child’s interests — whether that means building obstacle courses, baking play-dough cookies or designing a superhero training camp. Sofia believes that parents are partners in every step, and she takes time to explain the “why” behind each strategy so progress continues at home.',
      'Outside the clinic, Sofia can be found hiking the Bruce Trail with her family or attempting (mostly unsuccessfully) to keep sourdough alive.',
    ],
    specializations: ['Gross motor coordination', 'Sensory processing', 'Self-regulation', 'Parent coaching', 'Developmental assessment'],
    languages: ['English', 'Italian'],
    ageGroups: '18 months – 12 years',
    yearsExperience: 12,
    treatmentIds: ['ot-assessment-clinic', 'ot-assessment-remote', 'ot-assessment-home', 'ot-assessment-home-extended'],
    favouriteActivity: 'Obstacle courses that turn into dragon quests',
  },
  {
    id: 'julien-tremblay',
    slug: 'julien-tremblay',
    firstName: 'Julien',
    lastName: 'Tremblay',
    credentials: 'B.A. (Psych), M.Sc. (OT)',
    title: 'Occupational Therapist',
    image: images.therapistJulien,
    accent: 'lavender',
    shortBio:
      'Julien supports children with sensory and motor differences through energetic, movement-rich sessions full of laughter.',
    bio: [
      'With a background in psychology, Julien is fascinated by how children experience the world through their senses. He supports kids who are seeking more movement, those who feel overwhelmed by busy environments, and everyone in between.',
      'Julien’s sessions are energetic and full of laughter, but always intentional. He works closely with families and educators to build “sensory diets” and calming routines that fit naturally into home and classroom life.',
      'Julien grew up in Québec and offers sessions in both English and French. On weekends he coaches a youth soccer team in Mississauga.',
    ],
    specializations: ['Sensory integration', 'Emotional regulation', 'Motor planning', 'School readiness', 'Bilingual sessions'],
    languages: ['English', 'French'],
    ageGroups: '3 – 14 years',
    yearsExperience: 8,
    treatmentIds: ['ot-assessment-clinic', 'ot-assessment-home', 'ot-assessment-home-extended'],
    favouriteActivity: 'Swing-and-crash pillow adventures',
  },
  {
    id: 'leah-thompson',
    slug: 'leah-thompson',
    firstName: 'Leah',
    lastName: 'Thompson',
    credentials: 'B.Sc. (Hons), M.Sc. (OT)',
    title: 'Occupational Therapist',
    image: images.therapistLeah,
    accent: 'peach',
    shortBio:
      'Leah helps school-aged children shine in the classroom, with a focus on handwriting, fine motor skills and executive functioning.',
    bio: [
      'Leah loves helping children feel successful at school. Her work focuses on handwriting, fine motor control, visual-motor skills and the organization and planning skills that make classroom life smoother.',
      'She is known for turning tricky skills into games — letter-formation scavenger hunts, LEGO® engineering challenges and “secret agent” planning missions. Leah regularly offers remote sessions, which families appreciate for after-school flexibility.',
      'When she isn’t at the clinic, Leah is usually reading children’s picture books (strictly for research, of course) or exploring Toronto’s farmers’ markets.',
    ],
    specializations: ['Handwriting', 'Fine motor skills', 'Visual-motor integration', 'Executive functioning', 'Virtual therapy'],
    languages: ['English'],
    ageGroups: '4 – 18 years',
    yearsExperience: 6,
    treatmentIds: ['ot-assessment-clinic', 'ot-assessment-remote'],
    favouriteActivity: 'Secret-agent handwriting missions',
  },
  {
    id: 'rosa-delgado',
    slug: 'rosa-delgado',
    firstName: 'Rosa',
    lastName: 'Delgado',
    credentials: 'B.Sc. (Kin), M.O.T.',
    title: 'Occupational Therapist — Home & Community',
    image: images.therapistRosa,
    accent: 'butter',
    shortBio:
      'Rosa brings therapy into family homes, focusing on early development, daily routines and practical strategies that stick.',
    bio: [
      'Rosa has spent much of her career supporting families in their homes and communities. She believes the best place to work on getting dressed, mealtimes and bedtime routines is where those moments actually happen.',
      'Her gentle, patient approach is especially well-suited to toddlers and young children, and to kids who find new places overwhelming. Rosa partners closely with parents to create visual schedules, calm-down corners and routines that feel achievable.',
      'Rosa speaks English and Spanish and loves weekend trips to Ontario’s provincial parks with her two children.',
    ],
    specializations: ['Early childhood development', 'Daily living skills', 'Mealtime routines', 'Home environment set-up', 'Family coaching'],
    languages: ['English', 'Spanish'],
    ageGroups: '18 months – 10 years',
    yearsExperience: 10,
    treatmentIds: ['ot-assessment-remote', 'ot-assessment-home', 'ot-assessment-home-extended'],
    favouriteActivity: 'Building blanket forts as calm-down spaces',
  },
]

export const therapistById = (id?: string | null) => therapists.find((t) => t.id === id)
export const therapistBySlug = (slug?: string) => therapists.find((t) => t.slug === slug)
export const fullName = (t: Therapist) => `${t.firstName} ${t.lastName}`
