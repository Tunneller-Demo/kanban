import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export const infracciones = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations
}

// La primera visita abre el Tablero de ejemplo, intacto: «Vaciar» no pide confirmación.
export const abrirTableroVacio = async (page: Page) => {
  await page.goto('/kanban/')
  await page.getByRole('button', { name: 'Vaciar' }).click()
  await expect(page.getByRole('button', { name: 'Ver el Tablero de ejemplo' })).toBeVisible()
}
