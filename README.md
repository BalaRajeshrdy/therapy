# Maple Sprout Paediatric Therapy — Demo Website, Booking Portal & Treatment Studio

A frontend-only demonstration for a Canadian paediatric occupational therapy clinic. It includes a full public site, a custom appointment booking portal, and **Treatment Studio** (`/studio`), a clinic-system demo covering everything after the booking: visits, attendance, goals, notes, billing, the parent portal, the owner dashboard, automation and AI drafts. Everything runs in the browser.

> **Demo only.** The clinic, therapists, testimonials, address and phone number are fictional. There is no backend, database, payment processing or email sending. Bookings are simulated with mock data, React state and `localStorage`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npx playwright install chromium   # first time only
npm run test:e2e   # Playwright end-to-end tests (desktop + mobile)
```

No environment variables, API keys or database credentials are needed.

## What's included

| Route | Page |
|---|---|
| `/` | Homepage: hero, welcome, services, why families choose us, how we help, therapists, approach, therapy modes, how to book, demo testimonials, FAQs, CTA |
| `/about` | Story, values, clinic, team |
| `/services`, `/services/:slug` | Service cards, comparison table, service detail pages |
| `/therapists`, `/therapists/:slug` | Team grid and therapist profiles ("Book Appointment" preselects that therapist) |
| `/faq` | Searchable, filterable FAQs |
| `/contact` | Contact details, hours, validated demo contact form |
| `/booking` | **Booking portal**: treatment → therapist → date → time → details → confirm |
| `/booking/confirmation/:ref` | Confirmation with Google Calendar / .ics / print |
| `/manage-booking[/:ref]` | Look up, cancel or reschedule demo bookings |
| `/waitlist` | Waitlist form (also available as a modal in the booking portal) |
| `/demo-admin` | Frontend-only dashboard: bookings, waitlist, therapists, treatments, block/unblock dates, reset data. **Not secure; demo only.** |

## Treatment Studio (`/studio`)

Open **Clinic system demo →** in the top bar, or go to `/studio`. Use the **Owner / Front desk / Therapist / Parent** switcher at the top to see each role's view; parents and therapists can also pick *which* family or therapist they are.

| Area | Route | What it shows (deck slide) |
|---|---|---|
| Owner dashboard | `/studio/dashboard`, `/studio/report` | Sessions this month, no-show rate, waitlist, % invoices paid on time, charts, team table, **Ask the dashboard**, printable monthly owner report (slides 9, 11) |
| Clinic flow | `/studio/flow` | The 11-step connected flow with live counts, calls for unconfirmed visits, rebook list (slide 4) |
| Home visits | `/studio/visits` | Therapist's phone view in route order, check-in/out with optional location, parent signature, outcome drives billing, smart route order and mileage (slide 5) |
| Sites & attendance | `/studio/sites`, `/studio/site-visits/:id`, `/studio/sites/:id/report` | School/hospital/daycare/agency registry, recurring visits, per-child present/absent/excused + minutes, term report, site invoices (slide 6) |
| Goals & progress | `/studio/children/:id`, `/studio/children/:id/report` | Goals by domain, 1–5 rating per session, progress chart, parent and school report versions, home program (slide 7) |
| Session notes | `/studio/notes` | Note task per completed visit; voice memo / bullets → AI SOAP draft → therapist signs (slides 4, 11) |
| Billing | `/studio/billing`, `/studio/invoices/:id`, `/studio/statements/:id` | Auto-invoice per visit by policy, daily/weekly/monthly batches per family or site, insurance-ready receipts (designation + registration #), statements, reminders, packages (slide 8) |
| Waitlist | `/studio/waitlist` | Cancelled slot → auto-offer to the best match with a hold timer → next family on expiry/decline; smart slot suggestions (slides 10, 11) |
| Enquiries & intake | `/studio/enquiries`, `/studio/family/forms` | Contact form and website assistant land here; intake & consent forms with e-signature (slides 4, 9) |
| Automation | `/studio/automation` | The 8 rules (on/off), automation log, outbox in each family's language (slide 10) |
| AI assistant | `/studio/ai` + chat button on every public page | Website assistant, note drafts, progress report writer, smart scheduling, family language support, ask the dashboard (slide 11) |
| Schedule & rooms | `/studio/schedule`, `/studio/rooms` | Day view per therapist, recurring series, reschedule/cancel with late-cancel policy, room booking with clash checks, no-show flags |
| Mileage | `/studio/mileage` | Home-visit km and printable claim |
| Settings & audit | `/studio/settings`, `/studio/audit` | Fee schedule and policies, role-based access matrix, reset, full audit trail (slide 12) |
| Parent portal | `/studio/family/*` | Several children per family, upcoming visits (confirm, reschedule, cancel), invoices/receipts/statements with demo pay, progress charts, home-program checklist, forms, messages |

**Connected to the website:** an online booking appears in the Studio schedule, triggers the confirmation message and intake/consent requests, and its cancellation or reschedule releases the slot to the waitlist. Contact-form messages and website-assistant call-back requests appear in Enquiries.

**Data:** a deterministic, fictional caseload (9 families, 4 sites, 8+ weeks of history) is generated relative to today in Toronto time and stored in `localStorage` (`maple-sprout-demo:v1:studio`). It refreshes each day, or you can reset it in Settings. Code lives in `src/studio/`: `engine.ts` (rules and automations), `seed.ts`, `ai.ts` (rule-based "AI", runs locally), `messages.ts` (templates in English, French, Spanish, Punjabi, Simplified Chinese and Arabic), `pages/`.

**Demo limits:** fees, registration numbers, names and addresses are placeholders. The "AI" is rule-based and local, and translations are samples to be reviewed by a fluent speaker. No messages are sent, and no payments or card details are taken. Role switching is not authentication. The Phase 3 items in the deck (secure backend and logins, Canadian hosting, real email/SMS, online payments, live AI, insurer e-claims) need a backend and are not part of this demo.

## How availability works

All scheduling logic lives in `src/utils/scheduling.ts` (pure functions, no UI). It is computed in the browser from:

- **Weekly schedules** per therapist (`src/data/availability.ts`). Each therapist works different days and hours.
- **Treatment duration.** A slot only exists where the full duration fits, so 120-minute assessments appear only where a free two-hour window exists.
- **Mode restrictions.** For example, in-home visits run only on certain weekdays per therapist.
- **Mock appointments** from "other families", generated deterministically from a hash of therapist + date + time. The calendar looks realistically busy and stays stable between reloads.
- **Mock out-of-office days** (also deterministic) and **Ontario statutory holidays**, calculated for any year.
- **Admin-blocked dates** and **demo bookings** stored in `localStorage`.

Dates are generated relative to today in `America/Toronto` time, from tomorrow up to 75 days ahead, so the demo keeps working over time. Confirming a booking re-checks that the slot is still free. Cancelling releases the slot. Rescheduling releases the old slot and takes the new one.

## Project structure

```
src/
  studio/      Treatment Studio: types, engine, seed, ai, messages, store, ui, layout, pages/
  components/  layout/ home/ services/ therapists/ booking/ ui/
  pages/       one file per route
  data/        clinic.ts therapists.ts treatments.ts availability.ts bookings.ts faqs.ts images.ts
  hooks/       useDemoStore (localStorage-backed state), useNextOpening
  utils/       scheduling.ts storage.ts time.ts holidays.ts calendarExport.ts
  types/       Therapist, Treatment, TherapistAvailability, Booking, WaitlistEntry, ...
tests/         Playwright specs
```

`src/utils/storage.ts` uses namespaced, versioned keys (`maple-sprout-demo:v1:*`) and parses them safely. If storage is unavailable, it falls back to memory.

## Customising for a real clinic

- **Identity and contact details:** `src/data/clinic.ts`. Use the real business's name, address and contact details only once the clinic has authorized it.
- **Therapists:** `src/data/therapists.ts`. Replace the fictional profiles and stock photos with real, approved ones.
- **Photos:** `src/data/images.ts`. These are Unsplash images (free under the Unsplash License) showing models, not real clients or staff.
- **Hours and schedules:** `src/data/availability.ts`.

## Tech

React 18, TypeScript, Vite, Tailwind CSS, React Router, shadcn/ui-style components on Radix primitives, Lucide icons, Framer Motion, date-fns, Playwright.

Accessibility: semantic landmarks, skip link, labelled form fields with announced errors, keyboard-navigable calendar (arrow keys, Home/End, PageUp/PageDown), visible focus rings and reduced-motion support.
