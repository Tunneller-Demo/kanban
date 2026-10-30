import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('el Tablero no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await page.goto('/kanban/')
  await expect(page.getByRole('region', { name: 'Hecho' })).toBeVisible()

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(violations).toEqual([])
})
