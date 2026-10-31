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

test('el diálogo del Pendiente no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await page.goto('/kanban/')
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.press('Escape')
  await page.getByRole('button', { name: 'Comprar pan' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Editar Pendiente' })
  await dialogo.getByRole('radio', { name: 'Azul' }).check({ force: true })
  await dialogo.getByRole('textbox', { name: 'Nota' }).fill('a'.repeat(2005))
  await expect(dialogo).toContainText('2005/2000')

  expect(await infracciones(page)).toEqual([])

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  expect(await infracciones(page)).toEqual([])
})

test('el aviso de «Deshacer» no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await page.goto('/kanban/')
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.press('Escape')
  await page.getByRole('button', { name: 'Comprar pan' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
  await expect(page.getByRole('button', { name: 'Deshacer' })).toBeVisible()

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
