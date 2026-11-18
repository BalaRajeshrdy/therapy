import { test, expect, type Page } from '@playwright/test'

/* Treatment Studio — end-to-end checks for the features in the client deck. */

const studioPages = [
  ['/studio/dashboard', /whole clinic/],
  ['/studio/report', /Owner report/],
  ['/studio/flow', /One connected flow/],
  ['/studio/visits', /Every home visit tracked/],
  ['/studio/schedule', /\d{4}/],
  ['/studio/rooms', /Rooms/],
  ['/studio/sites', /Group visits/],
  ['/studio/sites/s-maplegrove', /Maple Grove/],
  ['/studio/sites/s-maplegrove/report', /Maple Grove/],
  ['/studio/clients', /Families/],
  ['/studio/clients/f-rahman', /Rahman family/],
  ['/studio/children/c-maya', /Maya Rahman/],
  ['/studio/children/c-maya/report?audience=school', /Maya Rahman/],
  ['/studio/notes', /Notes to write/],
  ['/studio/billing', /Invoices and receipts/],
  ['/studio/waitlist', /Cancelled slots/],
  ['/studio/enquiries', /Enquiries/],
  ['/studio/automation', /runs on its own/],
  ['/studio/ai', /AI drafts/],
  ['/studio/mileage', /mileage/i],
  ['/studio/settings', /Policies/],
  ['/studio/audit', /Audit trail/],
] as const

async function asRole(page: Page, role: 'Owner' | 'Front desk' | 'Therapist' | 'Parent', pick?: string) {
  await page.getByRole('radiogroup', { name: 'View the demo as' }).getByRole('radio', { name: role }).click()
  if (pick && role === 'Parent') await page.getByLabel('Family').selectOption({ label: pick })
  if (pick && role === 'Therapist') await page.getByLabel('Therapist', { exact: true }).selectOption({ label: pick })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test.describe('studio pages', () => {
  for (const [path, h] of studioPages) {
    test(`loads ${path}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(h)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
      expect(errors).toEqual([])
    })
  }
})

test('owner dashboard shows the four headline metrics and answers questions', async ({ page }) => {
  await page.goto('/studio/dashboard')
  for (const label of ['Sessions this month', 'No-show rate', 'On waitlist', 'Invoices paid on time']) await expect(page.getByText(label, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Who owes us money?' }).click()
  await expect(page.getByTestId('dash-answer').first()).toContainText('outstanding')
  await page.getByRole('button', { name: /home visits did each therapist/ }).click()
  await expect(page.getByTestId('dash-answer').first()).toContainText('home visits')
})

test('module 1: completing a home assessment with a parent signature bills it and offers a treatment plan', async ({ page }) => {
  await page.goto('/studio/visits')
  await expect(page.getByRole('heading', { name: /Today · 3 visits/ })).toBeVisible()
  await page.getByRole('button', { name: /Leo T\./ }).click()
  await expect(page.getByRole('heading', { name: 'Leo Tran' })).toBeVisible()
  await page.getByRole('button', { name: 'Complete & get signature' }).last().click()
  const dlg = page.getByRole('dialog', { name: 'Parent sign-off' })
  const box = (await dlg.locator('canvas').boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 70, { steps: 5 })
  await page.mouse.up()
  await dlg.getByRole('checkbox').check()
  await dlg.getByRole('button', { name: /Sign & complete visit/ }).click()
  await expect(page.getByText(/INV-\d+ · \$/)).toBeVisible()
  await expect(page.getByAltText(/Signature of Linh Tran/)).toBeVisible()

  await page.goto('/studio/children/c-leo')
  await expect(page.getByRole('heading', { name: 'Treatment plan offered' })).toBeVisible()

  // The parent picks a weekly time in their portal → recurring series is booked
  await asRole(page, 'Parent', 'Linh Tran')
  await page.goto('/studio/family')
  await expect(page.getByRole('heading', { name: 'Leo’s treatment plan' })).toBeVisible()
  await page.getByRole('button', { name: /^Every / }).first().click()
  await expect(page.getByRole('heading', { name: 'Leo’s treatment plan' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Upcoming visits' }).locator('..').locator('..').getByText(/Leo · OT Session/).first()).toBeVisible()
})

test('module 1: no-show applies the policy fee', async ({ page }) => {
  await page.goto('/studio/visits')
  await page.getByRole('button', { name: /Ava K\./ }).click()
  await page.getByRole('button', { name: 'No-show', exact: true }).click()
  await expect(page.getByText(/INV-\d+ · \$165\.00/)).toBeVisible()
})

test('module 2: attendance per child and site batch invoicing', async ({ page }) => {
  await page.goto('/studio/sites/s-maplegrove')
  await page.getByRole('link', { name: /Take attendance|Scheduled/ }).first().click()
  const groups = page.getByRole('radiogroup', { name: /Attendance for/ })
  const n = await groups.count()
  for (let i = 0; i < n; i++) await groups.nth(i).getByRole('radio', { name: i === 1 ? 'Excused' : 'Present' }).click()
  await page.getByRole('button', { name: 'Complete visit' }).click()
  await expect(page.getByRole('status')).toContainText(/Saved/)

  await page.goto('/studio/billing?tab=batch')
  await page.getByLabel('Bill to').selectOption('sites')
  await page.getByRole('button', { name: 'Generate invoices' }).click()
  await expect(page.getByRole('status')).toContainText(/Created \d+ invoice/)
})

test('module 3: rating a session updates goals; reports have parent and school versions', async ({ page }) => {
  await page.goto('/studio')
  await asRole(page, 'Therapist', 'Julien Tremblay')
  await page.goto('/studio/children/c-ava')
  await page.getByRole('group', { name: /./ }).first().getByRole('button', { name: '5', exact: true }).click()
  await page.getByRole('button', { name: 'Save ratings' }).click()
  await expect(page.getByText('Ratings saved')).toBeVisible()
  await page.getByRole('link', { name: 'School report' }).click()
  await expect(page.getByText('Classroom strategies')).toBeVisible()
  await page.getByRole('tab', { name: 'Parent version' }).click()
  await expect(page.getByText('What helps at home')).toBeVisible()
})

test('session note: AI draft from a voice memo, signed by the therapist', async ({ page }) => {
  await page.goto('/studio')
  await asRole(page, 'Therapist', 'Julien Tremblay')
  await page.goto('/studio/notes')
  await expect(page.getByRole('link', { name: 'Write note' }).first()).toBeVisible()
  const before = await page.getByRole('link', { name: 'Write note' }).count()
  await page.getByRole('link', { name: 'Write note' }).first().click()
  await page.getByRole('button', { name: 'Use sample voice memo' }).click()
  await page.getByRole('button', { name: 'Draft SOAP note' }).click()
  await expect(page.getByLabel('Subjective')).not.toHaveValue('')
  await expect(page.getByText('AI draft · review before use')).toBeVisible()
  await page.getByRole('button', { name: 'Approve & sign' }).click()
  await expect(page).toHaveURL(/\/studio\/notes$/)
  await expect(page.getByRole('link', { name: 'Write note' })).toHaveCount(before - 1)
})

test('module 4: recording a payment issues an insurance-ready receipt', async ({ page }) => {
  await page.goto('/studio/billing')
  await page.getByRole('button', { name: 'overdue' }).click()
  await page.getByRole('table', { name: 'Invoices' }).getByRole('link').first().click()
  await page.getByRole('button', { name: 'Record payment' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Save payment' }).click()
  await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible()
  await page.getByRole('tab', { name: /Insurance receipt/ }).click()
  await expect(page.getByText(/RCT-\d+ ·/)).toBeVisible()
  await expect(page.getByText(/OT Reg\. \(Ont\.\)/).first()).toBeVisible()
})

test('waitlist: a cancellation is auto-offered with a hold timer and can be accepted', async ({ page }) => {
  await page.goto('/studio/waitlist')
  await page.getByRole('button', { name: 'Simulate a cancellation' }).click()
  await expect(page.getByRole('status').first()).toContainText('offered automatically')
  await expect(page.getByRole('heading', { name: 'Offers on hold (1)' })).toBeVisible()
  await expect(page.getByText(/Hold \d:\d{2}:\d{2}/)).toBeVisible()
  await page.getByRole('button', { name: 'Family accepts' }).click()
  await expect(page.getByRole('heading', { name: 'Offers on hold (0)' })).toBeVisible()
  await page.goto('/studio/automation')
  await page.getByRole('tab', { name: /Automation log/ }).click()
  await expect(page.getByText(/accepted the slot/)).toBeVisible()
})

test('parent portal: consent form with e-signature', async ({ page }) => {
  await page.goto('/studio')
  await asRole(page, 'Parent', 'Linh Tran')
  await page.goto('/studio/family/forms')
  await page.getByRole('checkbox', { name: /consent to occupational therapy/ }).check()
  await page.getByRole('checkbox', { name: /have read how the clinic/ }).check()
  const box = (await page.locator('canvas').boundingBox())!
  await page.mouse.move(box.x + 30, box.y + 50)
  await page.mouse.down()
  await page.mouse.move(box.x + 160, box.y + 60, { steps: 6 })
  await page.mouse.up()
  await page.getByRole('button', { name: 'Sign consent' }).click()
  await expect(page.getByRole('button', { name: 'Sign consent' })).toHaveCount(0)
  await expect(page.getByAltText(/Signature of Linh Tran/)).toHaveCount(2)
})

test('role-based access: parents cannot open billing; therapists cannot see settings', async ({ page }) => {
  await page.goto('/studio')
  await asRole(page, 'Parent', 'Nadia Rahman')
  await page.goto('/studio/billing')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Not available for the parent role')
  await asRole(page, 'Therapist')
  await page.goto('/studio/settings')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Not available for the therapist role')
})

test('family language: messages and home program in the family’s language', async ({ page }) => {
  await page.goto('/studio/children/c-theo')
  await page.getByRole('button', { name: /Send to family \(French\)/ }).click()
  await asRole(page, 'Parent', 'Isabelle Gagnon')
  await page.goto('/studio/family/messages')
  await expect(page.getByText(/Programme maison de Théo/).first()).toBeVisible()
})

test('public site → studio: online booking, contact form and website assistant all reach the clinic system', async ({ page }) => {
  // Contact form → Enquiries
  await page.goto('/contact')
  await page.getByLabel('Your name').fill('Priya Nair')
  await page.getByLabel('Email').fill('priya.nair@example.com')
  await page.getByLabel('Message').fill('Do you offer handwriting help for a 7 year old?')
  await page.getByRole('button', { name: /Send/ }).click()

  // Website assistant → call-back request
  await page.goto('/')
  await page.getByRole('button', { name: /Ask us|Open website assistant/ }).click()
  const chat = page.getByRole('dialog', { name: 'Website assistant' })
  await chat.getByRole('button', { name: 'Do you do home visits?' }).click()
  await expect(chat.getByText(/Yes — we offer/)).toBeVisible()
  await chat.getByRole('button', { name: /someone to call me/ }).click()
  await chat.getByLabel('Your name').fill('Owen Marsh')
  await chat.getByLabel('Email or phone').fill('owen.marsh@example.com')
  await chat.getByRole('button', { name: 'Request a call back' }).click()
  await expect(chat.getByText(/Thanks, Owen/)).toBeVisible()

  await page.goto('/studio/enquiries')
  await expect(page.getByText('Priya Nair')).toBeVisible()
  await expect(page.getByText('Owen Marsh')).toBeVisible()
  await page.getByRole('article', { name: 'Owen Marsh' }).getByRole('button', { name: /Send intake/ }).click()
  await expect(page.getByRole('article', { name: 'Owen Marsh' }).getByText('Intake sent')).toBeVisible()

  // Online booking → studio schedule, confirmation + forms requested
  await page.goto('/booking')
  await page.getByRole('radio', { name: /^OT Assessment – In-Clinic/ }).click()
  const slot = page.locator('#step-time').getByRole('button', { name: /\d{1,2}:\d{2} [ap]\.m\. to/ }).first()
  await slot.click()
  await page.getByLabel('First name', { exact: true }).fill('Dana')
  await page.getByLabel('Last name').fill('Whitfield')
  await page.getByLabel('Email').fill('dana.whitfield@example.com')
  await page.getByLabel('Phone').fill('4165550123')
  await page.getByLabel(/Child’s first name/).fill('Robin')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Review booking' }).click()
  await page.getByRole('button', { name: 'Confirm Booking' }).click()
  await expect(page).toHaveURL(/confirmation\/MSP-/)
  const ref = (await page.getByTestId('booking-reference').textContent())!.trim()

  await page.goto('/studio/automation')
  await page.getByRole('tab', { name: /Automation log/ }).click()
  await expect(page.getByText(`Online booking ${ref}`)).toBeVisible()
  await page.goto('/studio/clients')
  await expect(page.getByRole('article', { name: 'Whitfield family' }).getByText(/Robin/)).toBeVisible()
})

test('studio works on a phone @mobile', async ({ page }) => {
  for (const path of ['/studio/visits', '/studio/dashboard', '/studio/family']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth) - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  }
})
