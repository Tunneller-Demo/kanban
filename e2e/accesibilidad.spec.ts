import { expect, test } from '@playwright/test'
import { abrirTableroVacio, infracciones } from './ayudas'

test('el Tablero no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await abrirTableroVacio(page)
  await expect(page.getByRole('region', { name: 'Hecho' })).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('el diálogo del Pendiente no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await abrirTableroVacio(page)
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.press('Escape')
  await page.getByRole('button', { name: 'Comprar pan', exact: true }).click()
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
  await abrirTableroVacio(page)
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.press('Escape')
  await page.getByRole('button', { name: 'Comprar pan', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
  await expect(page.getByRole('button', { name: 'Deshacer' })).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('el menú «⋮» abierto no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await abrirTableroVacio(page)
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.press('Escape')
  await page.getByRole('button', { name: 'Mover "Comprar pan"' }).click()
  await expect(page.getByRole('menu')).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('la confirmación de borrar una Etapa no tiene infracciones de WCAG A y AA', async ({
  page,
}) => {
  await abrirTableroVacio(page)
  await page.getByRole('button', { name: 'Añadir Pendiente a Hecho' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Hecho' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.press('Escape')
  await page.getByRole('button', { name: 'Menú de la Etapa Hecho' }).click()
  await page.getByRole('menuitem', { name: 'Borrar' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Borrar la Etapa Hecho' })).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('el menú de la Etapa no tiene infracciones de WCAG A y AA, ni con su motivo', async ({
  page,
}) => {
  await abrirTableroVacio(page)
  await page.getByRole('button', { name: 'Menú de la Etapa Hecho' }).click()
  await expect(page.getByRole('menu')).toBeVisible()

  expect(await infracciones(page)).toEqual([])

  await page.getByRole('menuitem', { name: 'Borrar' }).click()
  await page.getByRole('button', { name: 'Menú de la Etapa En curso' }).click()
  await page.getByRole('menuitem', { name: 'Borrar' }).click()
  await page.getByRole('button', { name: 'Menú de la Etapa Por hacer' }).click()
  await expect(page.getByText('El Tablero necesita al menos 1 Etapa')).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('el nombre de una Etapa con exceso no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await abrirTableroVacio(page)
  await page.getByRole('button', { name: 'Hecho', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nombre de la Etapa Hecho' }).fill('a'.repeat(33))
  await expect(page.getByRole('region', { name: 'Hecho' })).toContainText('33/30')

  expect(await infracciones(page)).toEqual([])
})

test('«Añadir Etapa» con 8 Etapas no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await abrirTableroVacio(page)
  const boton = page.getByRole('button', { name: 'Añadir Etapa' })
  for (const nombre of ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava']) {
    await boton.click()
    const campo = page.getByRole('textbox', { name: 'Nombre de la nueva Etapa' })
    await campo.fill(nombre)
    await campo.press('Enter')
  }
  await expect(page.getByText('El Tablero admite hasta 8 Etapas')).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('crear un Pendiente no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await abrirTableroVacio(page)
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.fill('a'.repeat(125))
  await expect(page.getByRole('region', { name: 'Por hacer' })).toContainText('125/120')

  expect(await infracciones(page)).toEqual([])
})
