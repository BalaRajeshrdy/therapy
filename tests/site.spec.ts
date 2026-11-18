import { test, expect, type Page } from '@playwright/test'

const pages = [
  ['/', /Empowering Kids/],
  ['/about', /Helping children grow/],
  ['/services', /Occupational therapy, tailored/],
  ['/services/ot-assessment-in-clinic', /OT Assessment – In-Clinic/],
  ['/services/ot-assessment-in-home-extended', /In-Home \(Extended\)/],
  ['/therapists', /Meet the team/],
  ['/therapists/sofia-marchetti', /Sofia Marchetti/],
  ['/contact', /We’d love to hear from you/],
  ['/faq', /Frequently asked questions/],
  ['/booking', /Book an Appointment/],
  ['/manage-booking', /View, reschedule or cancel/],
  ['/waitlist', /Can’t find a suitable appointment/],
  ['/demo-admin', /Clinic dashboard/],
] as const

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

test.describe('public pages', () => {
  for (const [path, heading] of pages) {
    test(`loads ${path}`, async ({ page }) => {
      const errors = collectErrors(page)
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading)
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth) - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      expect(errors).toEqual([])
    })
  }

  test('main navigation links work', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Main' })
    for (const [label, path] of [
      ['About Us', '/about'],
      ['Our Services', '/services'],
      ['Our Therapists', '/therapists'],
      ['FAQs', '/faq'],
      ['Contact', '/contact'],
      ['Home', '/'],
    ]) {
      await nav.getByRole('link', { name: label, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
    }
    await page.getByRole('banner').getByRole('link', { name: 'Book Appointment' }).click()
    await expect(page).toHaveURL(/\/booking$/)
  })

  test('no broken internal links', async ({ page, request }) => {
    const seen = new Set<string>()
    for (const [path] of pages) {
      await page.goto(path)
      const hrefs = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')!))
      hrefs.forEach((h) => seen.add(h.split('#')[0]))
    }
    for (const href of seen) {
      await page.goto(href)
      await expect(page.getByRole('heading', { level: 1 })).not.toContainText('Oops — this page went out to play')
    }
    expect(seen.size).toBeGreaterThan(20)
    void request
  })

  test('unknown route shows 404', async ({ page }) => {
    await page.goto('/nope')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('went out to play')
  })
})

test.describe('mobile @mobile', () => {
  test('hamburger menu opens and navigates @mobile', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Site menu' })
    await expect(menu).toBeVisible()
    await menu.getByRole('link', { name: /Our Services/ }).click()
    await expect(page).toHaveURL(/\/services$/)
    await expect(menu).toBeHidden()
  })

  for (const path of ['/', '/booking', '/therapists/julien-tremblay', '/services', '/contact', '/demo-admin']) {
    test(`no horizontal scroll on ${path} @mobile`, async ({ page }) => {
      await page.goto(path)
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth) - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})
