import { expect, type Page } from '@playwright/test'

// La primera visita abre el Tablero de ejemplo, intacto: «Vaciar» no pide confirmación.
export const abrirTableroVacio = async (page: Page) => {
  await page.goto('/kanban/')
  await page.getByRole('button', { name: 'Vaciar' }).click()
  await expect(page.getByRole('button', { name: 'Ver el Tablero de ejemplo' })).toBeVisible()
}
