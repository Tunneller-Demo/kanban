import { expect, test, type Page } from '@playwright/test'

const crear = async (page: Page, etapa: string, ...titulos: string[]) => {
  await page.getByRole('button', { name: `Añadir Pendiente a ${etapa}` }).click()
  const campo = page.getByRole('textbox', { name: `Título del nuevo Pendiente en ${etapa}` })
  for (const titulo of titulos) {
    await campo.fill(titulo)
    await campo.press('Enter')
  }
  await campo.press('Escape')
}

const pendientes = (page: Page, etapa: string) =>
  page.getByRole('region', { name: etapa }).getByRole('listitem')

const pendiente = (page: Page, titulo: string) =>
  page.getByRole('button', { name: titulo, exact: true })

const botonDeMenu = (page: Page, titulo: string) =>
  page.getByRole('button', { name: `Mover "${titulo}"` })

const abrirMenu = async (page: Page, titulo: string) => {
  await botonDeMenu(page, titulo).click()
  return page.getByRole('menu')
}

const entrada = (page: Page, nombre: string) =>
  page.getByRole('menu').getByRole('menuitem', { name: nombre, exact: true })

const mover = async (page: Page, titulo: string, nombre: string) => {
  await abrirMenu(page, titulo)
  await entrada(page, nombre).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/kanban/')
})

test('cada Pendiente tiene un «⋮» siempre visible con su área mínima', async ({ page }, info) => {
  await crear(page, 'Por hacer', 'Comprar pan')

  const area = await botonDeMenu(page, 'Comprar pan').boundingBox()

  const lado = info.project.name.endsWith('movil') ? 44 : 24
  expect(area!.width).toBeGreaterThanOrEqual(lado)
  expect(area!.height).toBeGreaterThanOrEqual(lado)
})

test('el botón «⋮» no abre el Pendiente', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')

  await abrirMenu(page, 'Comprar pan')

  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('el menú tiene un solo nivel: «Subir», «Bajar» y una entrada por Etapa', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')

  const menu = await abrirMenu(page, 'Comprar pan')

  await expect(menu.getByRole('menuitem')).toHaveText([
    'Subir',
    'Bajar',
    'Por hacer',
    'En curso',
    'Hecho',
  ])
  await expect(menu.getByRole('group', { name: 'Mover a' }).getByRole('menuitem')).toHaveCount(3)
  await expect(menu.locator('[aria-haspopup]')).toHaveCount(0)
})

test('lo que no aplica aparece desactivado', async ({ page }) => {
  await crear(page, 'Por hacer', 'Último', 'Medio', 'Primero')

  await abrirMenu(page, 'Primero')
  await expect(entrada(page, 'Subir')).toBeDisabled()
  await expect(entrada(page, 'Bajar')).toBeEnabled()
  await expect(entrada(page, 'Por hacer')).toBeDisabled()
  await expect(entrada(page, 'En curso')).toBeEnabled()
  await page.keyboard.press('Escape')

  await abrirMenu(page, 'Medio')
  await expect(entrada(page, 'Subir')).toBeEnabled()
  await expect(entrada(page, 'Bajar')).toBeEnabled()
  await page.keyboard.press('Escape')

  await abrirMenu(page, 'Último')
  await expect(entrada(page, 'Subir')).toBeEnabled()
  await expect(entrada(page, 'Bajar')).toBeDisabled()
})

test('«Subir» y «Bajar» cambian el orden, lo anuncian y el foco sigue al Pendiente', async ({
  page,
}) => {
  await crear(page, 'Por hacer', 'Regar', 'Comprar pan')

  await mover(page, 'Regar', 'Subir')

  await expect(pendientes(page, 'Por hacer')).toHaveText(['Regar', 'Comprar pan'])
  await expect(page.getByRole('status')).toHaveText('"Regar" movido a Por hacer, posición 1 de 2')
  await expect(pendiente(page, 'Regar')).toBeFocused()

  await mover(page, 'Regar', 'Bajar')

  await expect(pendientes(page, 'Por hacer')).toHaveText(['Comprar pan', 'Regar'])
  await expect(page.getByRole('status')).toHaveText('"Regar" movido a Por hacer, posición 2 de 2')
  await expect(pendiente(page, 'Regar')).toBeFocused()
})

test('«Mover a» deja el Pendiente arriba, lo anuncia y el foco lo sigue', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan', 'Regar')
  await crear(page, 'En curso', 'Pagar', 'Llamar', 'Limpiar')

  await mover(page, 'Comprar pan', 'En curso')

  await expect(pendientes(page, 'Por hacer')).toHaveText(['Regar'])
  await expect(pendientes(page, 'En curso')).toHaveText([
    'Comprar pan',
    'Limpiar',
    'Llamar',
    'Pagar',
  ])
  await expect(page.getByRole('status')).toHaveText(
    '"Comprar pan" movido a En curso, posición 1 de 4',
  )
  await expect(pendiente(page, 'Comprar pan')).toBeFocused()
})

test('tras «Mover a» se puede seguir usando el Tablero con normalidad', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')

  await mover(page, 'Comprar pan', 'Hecho')
  await expect(page.getByRole('menu')).toHaveCount(0)

  await pendiente(page, 'Comprar pan').click()
  await expect(page.getByRole('dialog', { name: 'Editar Pendiente' })).toBeVisible()
  await page.keyboard.press('Escape')

  await mover(page, 'Comprar pan', 'En curso')
  await expect(pendientes(page, 'En curso')).toHaveText(['Comprar pan'])
})

test('el movimiento sigue tras recargar', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')

  await mover(page, 'Comprar pan', 'Hecho')
  await expect(pendientes(page, 'Hecho')).toHaveText(['Comprar pan'])
  await page.reload()

  await expect(pendientes(page, 'Hecho')).toHaveText(['Comprar pan'])
  await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
})

test('se mueve solo con teclado', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')
  await botonDeMenu(page, 'Comprar pan').focus()

  await page.keyboard.press('Enter')
  // «Subir», «Bajar» y la Etapa actual están desactivadas: el foco entra en la primera que aplica.
  await expect(entrada(page, 'En curso')).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(pendientes(page, 'En curso')).toHaveText(['Comprar pan'])
  await expect(pendiente(page, 'Comprar pan')).toBeFocused()
})

test('cerrar el menú sin elegir no mueve nada y devuelve el foco a «⋮»', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')

  await abrirMenu(page, 'Comprar pan')
  await page.keyboard.press('Escape')

  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(botonDeMenu(page, 'Comprar pan')).toBeFocused()
  await expect(pendientes(page, 'Por hacer')).toHaveText(['Comprar pan'])
})

test('tras mover, cerrar de nuevo el menú sin elegir devuelve el foco a «⋮»', async ({ page }) => {
  await crear(page, 'Por hacer', 'Regar', 'Comprar pan')
  await mover(page, 'Regar', 'Subir')
  await expect(pendiente(page, 'Regar')).toBeFocused()

  await abrirMenu(page, 'Regar')
  await page.keyboard.press('Escape')

  await expect(botonDeMenu(page, 'Regar')).toBeFocused()
})

test('un clic fuera cierra el menú sin mover nada', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')

  await abrirMenu(page, 'Comprar pan')
  await page.mouse.click(1, 1)

  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(pendientes(page, 'Por hacer')).toHaveText(['Comprar pan'])
})

test('mover retira el aviso de «Deshacer»', async ({ page }) => {
  await crear(page, 'Por hacer', 'Regar', 'Comprar pan')
  await pendiente(page, 'Comprar pan').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
  const deshacer = page.getByRole('contentinfo').getByRole('button', { name: 'Deshacer' })
  await expect(deshacer).toBeVisible()

  await mover(page, 'Regar', 'Hecho')

  await expect(deshacer).toHaveCount(0)
})
