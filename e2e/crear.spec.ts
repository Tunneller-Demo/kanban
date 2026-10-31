import { expect, test, type Page } from '@playwright/test'
import { abrirTableroVacio } from './ayudas'

const abrirCampo = async (page: Page, etapa: string) => {
  await page.getByRole('button', { name: `Añadir Pendiente a ${etapa}` }).click()
  return page.getByRole('textbox', { name: `Título del nuevo Pendiente en ${etapa}` })
}

const pendientes = (page: Page, etapa: string) =>
  page.getByRole('region', { name: etapa }).getByRole('listitem')

test.beforeEach(async ({ page }) => {
  await abrirTableroVacio(page)
})

test('Enter crea arriba de la Etapa y deja el campo listo', async ({ page }) => {
  const campo = await abrirCampo(page, 'En curso')

  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await expect(campo).toHaveValue('')
  await expect(campo).toBeFocused()
  await campo.fill('Llamar al banco')
  await campo.press('Enter')

  await expect(pendientes(page, 'En curso')).toHaveText(['Llamar al banco', 'Comprar pan'])
  await expect(page.getByRole('region', { name: 'En curso' })).toContainText('2 Pendientes')
  await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
})

test('el Tablero sigue igual al recargar', async ({ page }) => {
  const campo = await abrirCampo(page, 'Hecho')
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.fill('Llamar al banco')
  await campo.press('Enter')

  await page.reload()

  await expect(pendientes(page, 'Hecho')).toHaveText(['Llamar al banco', 'Comprar pan'])
})

test('Escape cierra sin crear y devuelve el foco al botón', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')

  await campo.fill('Comprar pan')
  await campo.press('Escape')

  await expect(campo).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' })).toBeFocused()
  await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
})

test('tocar fuera cierra sin crear y devuelve el foco al botón', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')

  await campo.fill('Comprar pan')
  await page.getByRole('heading', { level: 1 }).click()

  await expect(campo).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' })).toBeFocused()
  await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
})

test('tocar el Tablero con desplazamiento también cierra y devuelve el foco', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')
  for (let i = 0; i < 40; i++) {
    await campo.fill(`Pendiente ${i}`)
    await campo.press('Enter')
  }

  await campo.fill('Comprar pan')
  await page.getByRole('region', { name: 'Por hacer' }).getByText(/^40/).click()

  await expect(campo).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' })).toBeFocused()
  await expect(pendientes(page, 'Por hacer')).toHaveCount(40)
})

test('salir con Tab cierra sin crear y deja el foco en el control siguiente', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')

  await campo.fill('Comprar pan')
  await campo.press('Tab')

  await expect(campo).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'En curso', exact: true })).toBeFocused()
  await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
})

test('recorta el título y no crea uno vacío', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')

  await campo.fill('   ')
  await campo.press('Enter')
  await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
  await expect(campo).toBeVisible()

  await campo.fill('  Comprar pan  ')
  await campo.press('Enter')
  await expect(pendientes(page, 'Por hacer')).toHaveText(['Comprar pan'])
})

test('lo pegado de más no se corta y no se crea hasta corregirlo', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')
  const largo = 'a'.repeat(125)

  await campo.fill('a'.repeat(100))
  await expect(page.getByRole('region', { name: 'Por hacer' })).not.toContainText('/120')

  await campo.fill(largo)
  await campo.press('Enter')

  await expect(campo).toHaveValue(largo)
  await expect(campo).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('region', { name: 'Por hacer' })).toContainText('125/120')
  await expect(page.getByRole('status')).toHaveText(
    'Pendiente sin crear. Sobran 5 caracteres',
  )
  await expect(pendientes(page, 'Por hacer')).toHaveCount(0)

  await campo.fill('a'.repeat(120))
  await campo.press('Enter')
  await expect(pendientes(page, 'Por hacer')).toHaveCount(1)
})

test('anuncia el resultado de crear', async ({ page }) => {
  await page.reload()
  const estado = page.getByRole('status')
  await expect(estado).toHaveAttribute('aria-live', 'polite')
  await expect(estado).toBeEmpty()

  const campo = await abrirCampo(page, 'Por hacer')
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.fill('Llamar al banco')
  await campo.press('Enter')

  await expect(estado).toHaveText('"Llamar al banco" creado en Por hacer, posición 1 de 2')
})

test('expone los Pendientes en una lista por Etapa', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')
  await campo.fill('Comprar pan')
  await campo.press('Enter')

  const lista = page.getByRole('region', { name: 'Por hacer' }).getByRole('list')
  await expect(lista).toHaveAccessibleName('Por hacer')
  await expect(lista.getByRole('listitem')).toHaveText(['Comprar pan'])
})

test('guarda bajo una clave con el nombre de la app y la ruta base', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await expect(pendientes(page, 'Por hacer')).toHaveCount(1)

  const claves = await page.evaluate(() => Object.keys(localStorage))
  expect(claves).toEqual(['tablero-de-pendientes:/kanban/'])
})

test('no sobrescribe los datos guardados dañados', async ({ page }) => {
  const clave = 'tablero-de-pendientes:/kanban/'
  await page.evaluate((c) => localStorage.setItem(c, '{dañado'), clave)
  await page.reload()

  const campo = await abrirCampo(page, 'Por hacer')
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await expect(pendientes(page, 'Por hacer')).toHaveCount(1)

  expect(await page.evaluate((c) => localStorage.getItem(c), clave)).toBe('{dañado')
})

test('sigue funcionando en memoria si el navegador no puede guardar', async ({ page }) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Sin espacio', 'QuotaExceededError')
    }
  })

  const campo = await abrirCampo(page, 'Por hacer')
  await campo.fill('Comprar pan')
  await campo.press('Enter')

  await expect(pendientes(page, 'Por hacer')).toHaveText(['Comprar pan'])
})

test('el pie dice dónde viven los datos y queda a la vista', async ({ page }) => {
  const campo = await abrirCampo(page, 'Por hacer')
  for (let i = 0; i < 40; i++) {
    await campo.fill(`Pendiente ${i}`)
    await campo.press('Enter')
  }

  const pie = page.getByRole('contentinfo')
  await expect(pie).toContainText('Tus datos se guardan solo en este navegador')
  await expect(pie).toContainText('Construida con Tunneller')
  await expect(pie).toBeInViewport({ ratio: 1 })
  await expect(campo).toBeInViewport({ ratio: 1 })
})
