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

const pendientes = (page: Page) =>
  page.getByRole('region', { name: 'Por hacer' }).getByRole('listitem')

const boton = (page: Page, nombre: string | RegExp) =>
  page.getByRole('region', { name: 'Por hacer' }).getByRole('button', { name: nombre, exact: true })

const borrar = async (page: Page, titulo: string | RegExp) => {
  await boton(page, titulo).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
}

const pie = (page: Page) => page.getByRole('contentinfo')
const deshacer = (page: Page) => pie(page).getByRole('button', { name: 'Deshacer' })

test.beforeEach(async ({ page }) => {
  await page.goto('/kanban/')
})

test('«Borrar» actúa al momento y sin confirmación', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')

  await borrar(page, 'Comprar pan')

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(pendientes(page)).toHaveCount(0)
  await expect(pie(page)).toContainText('"Comprar pan" borrado')
  await expect(page.getByRole('status')).toHaveText('"Comprar pan" borrado. Deshacer disponible')
})

test('el borrado sigue tras recargar', async ({ page }) => {
  await crear(page, 'Por hacer', 'Regar', 'Comprar pan')
  await borrar(page, 'Comprar pan')

  await page.reload()

  await expect(pendientes(page)).toHaveText(['Regar'])
  await expect(deshacer(page)).toHaveCount(0)
})

test('se puede borrar con el título vacío: el aviso nombra el título guardado', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')
  await boton(page, 'Comprar pan').click()
  const dialogo = page.getByRole('dialog')
  await dialogo.getByRole('textbox', { name: 'Título' }).fill('')

  await dialogo.getByRole('button', { name: 'Borrar' }).click()

  await expect(pendientes(page)).toHaveCount(0)
  await expect(pie(page)).toContainText('"Comprar pan" borrado')
})

test('dos borrados con el mismo título se anuncian los dos', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan', 'Comprar pan')
  await borrar(page, 'Comprar pan')
  const anuncio = page.getByRole('status').locator('span')
  await expect(anuncio).toHaveText('"Comprar pan" borrado. Deshacer disponible')
  const primero = await anuncio.elementHandle()

  await borrar(page, 'Comprar pan')

  await expect.poll(() => primero!.evaluate((nodo) => nodo.isConnected)).toBe(false)
  await expect(anuncio).toHaveText('"Comprar pan" borrado. Deshacer disponible')
})

test('«Deshacer» restaura el Pendiente en su posición, con su nota y su Etiqueta', async ({
  page,
}) => {
  await crear(page, 'Por hacer', 'Tercero', 'Segundo', 'Primero')
  await boton(page, 'Segundo').click()
  const dialogo = page.getByRole('dialog')
  await dialogo.getByRole('textbox', { name: 'Nota' }).fill('Integral')
  await dialogo.getByRole('radio', { name: 'Azul' }).check({ force: true })
  await page.keyboard.press('Escape')

  await borrar(page, /^Segundo/)
  await expect(pendientes(page)).toHaveText(['Primero', 'Tercero'])

  await deshacer(page).click()

  await expect(pendientes(page)).toHaveText(['Primero', 'Segundo', 'Tercero'])
  const restaurado = boton(page, /^Segundo/)
  await expect(restaurado).toHaveAccessibleName('Segundo, Etiqueta azul, Tiene nota')
  await expect(restaurado).toBeFocused()
  await expect(deshacer(page)).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText(
    '"Segundo" restaurado en Por hacer, posición 2 de 3',
  )

  await page.reload()
  await expect(pendientes(page)).toHaveText(['Primero', 'Segundo', 'Tercero'])
})

test('el aviso dura hasta el siguiente cambio en el Tablero', async ({ page }) => {
  await page.clock.install()
  await crear(page, 'Por hacer', 'Comprar pan')
  await borrar(page, 'Comprar pan')
  await expect(deshacer(page)).toBeVisible()

  await page.clock.fastForward('01:00:00')
  await expect(deshacer(page)).toBeVisible()

  await crear(page, 'Hecho', 'Regar')

  await expect(deshacer(page)).toHaveCount(0)
})

test('editar un Pendiente retira el aviso', async ({ page }) => {
  await crear(page, 'Por hacer', 'Regar', 'Comprar pan')
  await borrar(page, 'Comprar pan')

  await boton(page, 'Regar').click()
  await page.getByRole('dialog').getByRole('textbox', { name: 'Título' }).fill('Regar las plantas')
  await page.keyboard.press('Escape')

  await expect(deshacer(page)).toHaveCount(0)
})

test('cerrar el aviso lo retira y deja el foco donde quedó tras borrar', async ({ page }) => {
  await crear(page, 'Por hacer', 'Regar', 'Comprar pan')
  await borrar(page, 'Comprar pan')

  await pie(page).getByRole('button', { name: 'Cerrar aviso' }).click()

  await expect(deshacer(page)).toHaveCount(0)
  await expect(pendientes(page)).toHaveText(['Regar'])
  await expect(boton(page, 'Regar')).toBeFocused()
})

test('cerrar el aviso con la Etapa vacía deja el foco en el botón de crear', async ({ page }) => {
  await crear(page, 'Por hacer', 'Comprar pan')
  await borrar(page, 'Comprar pan')

  await pie(page).getByRole('button', { name: 'Cerrar aviso' }).click()

  await expect(boton(page, 'Añadir Pendiente a Por hacer')).toBeFocused()
})

test('solo hay un «Deshacer» a la vez', async ({ page }) => {
  await crear(page, 'Por hacer', 'Regar', 'Comprar pan')

  await borrar(page, 'Comprar pan')
  await borrar(page, 'Regar')

  await expect(deshacer(page)).toHaveCount(1)
  await expect(pie(page)).toContainText('"Regar" borrado')
  await expect(pie(page)).not.toContainText('Comprar pan')

  await deshacer(page).click()

  await expect(pendientes(page)).toHaveText(['Regar'])
})

test('tras borrar, el foco va al siguiente, al anterior o al botón de crear', async ({ page }) => {
  await crear(page, 'Por hacer', 'Tercero', 'Segundo', 'Primero')

  await borrar(page, 'Segundo')
  await expect(boton(page, 'Tercero')).toBeFocused()

  await borrar(page, 'Tercero')
  await expect(boton(page, 'Primero')).toBeFocused()

  await borrar(page, 'Primero')
  await expect(boton(page, 'Añadir Pendiente a Por hacer')).toBeFocused()
})

test('el foco se conserva al borrar solo con teclado', async ({ page }) => {
  await crear(page, 'Por hacer', 'Regar', 'Comprar pan')

  await boton(page, 'Comprar pan').focus()
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).focus()
  await page.keyboard.press('Enter')

  await expect(boton(page, 'Regar')).toBeFocused()
})

test('el aviso no tapa el foco y cabe con un título largo', async ({ page }) => {
  // Los Pendientes entran arriba: el título largo es el penúltimo y el foco cae en el último.
  const titulos = Array.from({ length: 12 }, (_, i) => `Pendiente ${i}`)
  await crear(page, 'Por hacer', 'Último', 'a'.repeat(120), ...titulos)

  await borrar(page, 'a'.repeat(120))

  const ultimo = boton(page, 'Último')
  await expect(ultimo).toBeFocused()
  await expect(deshacer(page)).toBeVisible()
  const enfocado = (await ultimo.boundingBox())!
  const cajaDelPie = (await pie(page).boundingBox())!
  const cajaDeMain = (await page.getByRole('main').boundingBox())!
  const ventana = page.viewportSize()!
  expect(enfocado.y).toBeGreaterThanOrEqual(cajaDeMain.y)
  expect(enfocado.y + enfocado.height).toBeLessThanOrEqual(cajaDelPie.y)
  expect(cajaDelPie.y + cajaDelPie.height).toBeLessThanOrEqual(ventana.height)
  expect(cajaDelPie.width).toBeLessThanOrEqual(ventana.width)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    ventana.width,
  )
})
