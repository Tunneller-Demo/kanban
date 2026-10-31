import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const infracciones = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations
}

test('el Tablero no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await page.goto('/kanban/')
  await expect(page.getByRole('region', { name: 'Hecho' })).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('crear un Pendiente no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await page.goto('/kanban/')
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.fill('a'.repeat(125))
  await expect(page.getByRole('region', { name: 'Por hacer' })).toContainText('125/120')

  expect(await infracciones(page)).toEqual([])
})
