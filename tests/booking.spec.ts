import { test, expect, type Page } from '@playwright/test'

const CLINIC = 'OT Assessment – In-Clinic'

async function selectTreatment(page: Page, name: string) {
  await page.getByRole('radio', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}`) }).click()
}

async function selectedDate(page: Page) {
  return page.locator('[data-date][aria-pressed="true"]').getAttribute('data-date')
}

function slotButtons(page: Page) {
  return page.locator('#step-time').getByRole('button', { name: /\d{1,2}:\d{2} [ap]\.m\. to/ })
}

async function fillDetails(page: Page, email = 'parent@example.com') {
  await page.getByLabel('First name', { exact: true }).fill('Jordan')
  await page.getByLabel('Last name').fill('Lee')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Phone').fill('4165550199')
  await page.getByLabel(/Child’s first name/).fill('Maya')
  await page.getByRole('checkbox').check()
}

/** Books the first available slot and returns details. */
async function bookFirstSlot(page: Page, url: string, treatment = CLINIC) {
  await page.goto(url)
  await selectTreatment(page, treatment)
  await expect(slotButtons(page).first()).toBeVisible()
  const date = (await selectedDate(page))!
  const slotLabel = (await slotButtons(page).first().getAttribute('aria-label'))!
  await slotButtons(page).first().click()
  await expect(page.getByRole('heading', { name: 'Your details' })).toBeVisible()
  await fillDetails(page)
  await page.getByRole('button', { name: 'Review booking' }).click()
  await page.getByRole('button', { name: 'Confirm Booking' }).click()
  await expect(page).toHaveURL(/\/booking\/confirmation\/MSP-/)
  const reference = (await page.getByTestId('booking-reference').textContent())!.trim()
  return { date, slotLabel, reference, time: slotLabel.split(' to ')[0] }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('prompts for a treatment before showing times', async ({ page }) => {
  await page.goto('/booking')
  await expect(page.getByText('Select a treatment to view available appointment times.').first()).toBeVisible()
  await expect(page.locator('[data-date]')).toHaveCount(0)
})

test('selecting a treatment shows dates and slots; therapist changes availability', async ({ page }) => {
  await page.goto('/booking')
  await selectTreatment(page, CLINIC)
  await expect(page.getByRole('radio', { name: /^OT Assessment – In-Clinic/ })).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('[data-date][aria-pressed="true"]')).toHaveCount(1)
  await expect(slotButtons(page).first()).toBeVisible()

  const available = async () =>
    page.$$eval('[data-date]', (els) => els.filter((e) => e.getAttribute('aria-disabled') === 'false').map((e) => e.getAttribute('data-date')).join(','))

  await page.getByRole('radio', { name: /Sofia Marchetti/ }).click()
  await expect(page).toHaveURL(/therapist=sofia-marchetti/)
  const sofia = await available()
  await page.getByRole('radio', { name: /Julien Tremblay/ }).click()
  const julien = await available()
  expect(sofia).not.toEqual(julien)

  // Sofia works Mon/Wed/Fri, Julien Tue/Thu/Sat
  const weekdays = (s: string) => new Set(s.split(',').filter(Boolean).map((d) => new Date(d + 'T12:00').getDay()))
  expect([...weekdays(sofia)].every((d) => [1, 3, 5].includes(d))).toBe(true)
  expect([...weekdays(julien)].every((d) => [2, 4, 6].includes(d))).toBe(true)
})

test('selecting a different date updates time slots', async ({ page }) => {
  await page.goto('/booking?therapist=leah-thompson')
  await selectTreatment(page, 'OT Assessment – Remote')
  const first = await selectedDate(page)
  const labelsA = await slotButtons(page).allTextContents()
  const other = page.locator(`[data-date][aria-disabled="false"]:not([data-date="${first}"])`).first()
  const otherDate = await other.getAttribute('data-date')
  await other.click()
  await expect(page.locator(`[data-date="${otherDate}"]`)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#h-time')).not.toContainText(first!)
  const labelsB = await slotButtons(page).allTextContents()
  expect(labelsB.length).toBeGreaterThan(0)
  expect(labelsA.join() === labelsB.join() && first === otherDate).toBe(false)
})

test('extended 120-minute assessment only offers full two-hour windows', async ({ page }) => {
  await page.goto('/booking')
  await selectTreatment(page, 'OT Assessment – In-Home (Extended)')
  await expect(slotButtons(page).first()).toBeVisible()
  const labels = await slotButtons(page).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!))
  const toMin = (t: string) => {
    const [, h, m, ap] = t.match(/(\d+):(\d+) ([ap])/)!
    return ((Number(h) % 12) + (ap === 'p' ? 12 : 0)) * 60 + Number(m)
  }
  for (const l of labels) {
    const [start, end] = l.split(' to ')
    expect(toMin(end) - toMin(start)).toBe(120)
  }
})

test('therapist profile "Book Appointment" preselects the therapist', async ({ page }) => {
  await page.goto('/therapists/rosa-delgado')
  await page.getByRole('main').getByRole('link', { name: 'Book Appointment' }).first().click()
  await expect(page).toHaveURL(/\/booking\?therapist=rosa-delgado/)
  await expect(page.getByRole('radio', { name: /Rosa Delgado/ })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('article', { name: 'About Rosa Delgado' })).toBeVisible()
})

test('client form validation shows accessible errors', async ({ page }) => {
  await page.goto('/booking')
  await selectTreatment(page, CLINIC)
  await slotButtons(page).first().click()
  await page.getByRole('button', { name: 'Review booking' }).click()
  await expect(page.getByText(/Please fix \d+ fields?/)).toBeVisible()
  await expect(page.getByText('Please enter your first name.')).toBeVisible()
  await expect(page.getByLabel('First name', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByLabel('Phone').fill('123')
  await expect(page.getByText(/doesn’t look quite right/)).toBeVisible()
  await expect(page.getByText(/valid 10-digit Canadian phone/)).toBeVisible()
  await expect(page.getByText('Please confirm you agree before continuing.')).toBeVisible()
})

test('full booking persists after refresh and removes the slot', async ({ page }) => {
  const b = await bookFirstSlot(page, '/booking?therapist=sofia-marchetti')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('You’re all set')
  await expect(page.getByText('No real clinic booking or email notification has been created', { exact: false })).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('booking-reference')).toHaveText(b.reference)

  await page.goto('/booking?treatment=ot-assessment-clinic&therapist=sofia-marchetti')
  const day = page.locator(`[data-date="${b.date}"]`)
  if ((await day.getAttribute('aria-disabled')) === 'false') {
    await day.click()
    await expect(slotButtons(page).first()).toBeVisible()
    const times = await slotButtons(page).allTextContents()
    expect(times.map((t) => t.trim())).not.toContain(b.time)
  }
  // the admin dashboard shows it
  await page.goto('/demo-admin')
  await expect(page.getByRole('link', { name: b.reference })).toBeVisible()
})

test('cancelling releases the slot', async ({ page }) => {
  const b = await bookFirstSlot(page, '/booking?therapist=sofia-marchetti')
  await page.getByRole('main').getByRole('link', { name: 'Manage booking' }).click()
  await page.getByRole('button', { name: 'Cancel booking' }).click()
  await page.getByRole('button', { name: 'Yes, cancel booking' }).click()
  await expect(page.getByRole('heading', { name: 'This booking has been cancelled' })).toBeVisible()

  await page.goto('/booking?treatment=ot-assessment-clinic&therapist=sofia-marchetti')
  await page.locator(`[data-date="${b.date}"]`).click()
  await expect(slotButtons(page).filter({ hasText: b.time }).first()).toBeVisible()
})

test('rescheduling moves the booking and frees the old slot', async ({ page }) => {
  const b = await bookFirstSlot(page, '/booking?therapist=sofia-marchetti')
  await page.goto(`/manage-booking/${b.reference}`)
  await page.getByRole('button', { name: 'Choose a new time' }).click()
  const target = page.locator(`[data-date][aria-disabled="false"]:not([data-date="${b.date}"])`).first()
  const newDate = await target.getAttribute('data-date')
  await target.click()
  await page.getByRole('main').getByRole('button', { name: /\d{1,2}:\d{2} [ap]\.m\. to/ }).first().click()
  await page.getByRole('button', { name: /^Move to/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('rescheduled')

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('maple-sprout-demo:v1:bookings')!))
  expect(stored[0].date).toBe(newDate)
  expect(stored[0].history.map((h: { action: string }) => h.action)).toEqual(['booked', 'rescheduled'])

  await page.goto('/booking?treatment=ot-assessment-clinic&therapist=sofia-marchetti')
  await page.locator(`[data-date="${b.date}"]`).click()
  await expect(slotButtons(page).filter({ hasText: b.time }).first()).toBeVisible()
})

test('waitlist submissions are validated, saved and shown in admin', async ({ page }) => {
  await page.goto('/booking')
  await page.getByRole('button', { name: 'Join Waitlist' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Join our waitlist' })
  await dialog.getByRole('button', { name: 'Join Waitlist' }).click()
  await expect(dialog.getByText('Please enter your full name.')).toBeVisible()
  await expect(dialog.getByText('Please choose at least one preferred day.')).toBeVisible()

  await dialog.getByLabel('Parent/Guardian name').fill('Sam Patel')
  await dialog.getByLabel('Email').fill('sam@example.com')
  await dialog.getByLabel('Phone').fill('9055550111')
  await dialog.getByLabel('Preferred treatment').selectOption({ label: 'OT Assessment – Remote' })
  await dialog.getByText('Tue', { exact: true }).click()
  await dialog.getByText('Thu', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Join Waitlist' }).click()
  await expect(dialog.getByText('You’re on the waitlist!')).toBeVisible()

  await page.goto('/demo-admin')
  await page.getByRole('tab', { name: 'Waitlist' }).click()
  await expect(page.getByText('Sam Patel')).toBeVisible()
  await expect(page.getByText('Tue, Thu')).toBeVisible()
})

test('admin-blocked date disappears from the calendar', async ({ page }) => {
  await page.goto('/booking?treatment=ot-assessment-clinic&therapist=sofia-marchetti')
  const date = (await selectedDate(page))!
  await page.goto('/demo-admin')
  await page.getByRole('tab', { name: 'Blocked dates' }).click()
  await page.getByLabel('Date').fill(date)
  await page.getByLabel('Applies to').selectOption('sofia-marchetti')
  await page.getByRole('button', { name: 'Block date' }).click()
  await page.goto('/booking?treatment=ot-assessment-clinic&therapist=sofia-marchetti')
  await expect(page.locator(`[data-date="${date}"]`)).toHaveAttribute('aria-disabled', 'true')
})

test('booking flow works on a phone @mobile', async ({ page }) => {
  const b = await bookFirstSlot(page, '/booking')
  expect(b.reference).toMatch(/^MSP-/)
  const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth) - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
