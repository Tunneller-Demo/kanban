import { expect, test, type Page } from '@playwright/test'

const crear = async (page: Page, etapa: string, titulo: string) => {
  await page.getByRole('button', { name: `Añadir Pendiente a ${etapa}` }).click()
  const campo = page.getByRole('textbox', { name: `Título del nuevo Pendiente en ${etapa}` })
  await campo.fill(titulo)
  await campo.press('Enter')
  await campo.press('Escape')
}

const boton = (page: Page, nombre: string | RegExp) =>
  page.getByRole('region', { name: 'Por hacer' }).getByRole('button', { name: nombre })

const abrir = async (page: Page, titulo: string | RegExp = 'Comprar pan') => {
  await boton(page, titulo).click()
  return page.getByRole('dialog', { name: 'Editar Pendiente' })
}

const guardado = (page: Page) =>
  page.evaluate(() => {
    const { tablero } = JSON.parse(localStorage.getItem('tablero-de-pendientes:/kanban/')!)
    return tablero.etapas[0].pendientes[0]
  })

test.beforeEach(async ({ page }) => {
  await page.goto('/kanban/')
  await crear(page, 'Por hacer', 'Comprar pan')
})

test('tocar un Pendiente abre el diálogo con sus datos', async ({ page }) => {
  const dialogo = await abrir(page)

  await expect(dialogo.getByRole('textbox', { name: 'Título' })).toHaveValue('Comprar pan')
  await expect(dialogo.getByRole('textbox', { name: 'Nota' })).toHaveValue('')
  await expect(dialogo.getByRole('radio', { name: 'Sin Etiqueta' })).toBeChecked()
  await expect(dialogo.getByRole('button', { name: 'Guardar' })).toHaveCount(0)
})

test('Intro sobre el Pendiente abre el diálogo', async ({ page }) => {
  await boton(page, 'Comprar pan').focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog', { name: 'Editar Pendiente' })).toBeVisible()
})

test('los cambios se guardan al momento y siguen al recargar', async ({ page }) => {
  const dialogo = await abrir(page)

  await dialogo.getByRole('textbox', { name: 'Título' }).fill('Comprar leche')
  await dialogo.getByRole('textbox', { name: 'Nota' }).fill('Entera\nDos litros')
  await dialogo.locator('label', { hasText: 'Azul' }).click()

  await expect.poll(() => guardado(page)).toMatchObject({
    titulo: 'Comprar leche',
    nota: 'Entera\nDos litros',
    etiqueta: 'azul',
  })

  await page.reload()

  const reabierto = await abrir(page, /Comprar leche/)
  await expect(reabierto.getByRole('textbox', { name: 'Nota' })).toHaveValue('Entera\nDos litros')
  await expect(reabierto.getByRole('radio', { name: 'Azul' })).toBeChecked()
})

test('el título vacío recupera el anterior al salir del campo', async ({ page }) => {
  const dialogo = await abrir(page)
  const titulo = dialogo.getByRole('textbox', { name: 'Título' })

  await titulo.fill('')
  await titulo.blur()

  await expect(titulo).toHaveValue('Comprar pan')
  await expect(page.getByRole('status')).toHaveText('Título vacío. Se recupera "Comprar pan"')
})

test('el título borrado letra a letra recupera el de antes de empezar', async ({ page }) => {
  const dialogo = await abrir(page)
  const titulo = dialogo.getByRole('textbox', { name: 'Título' })

  await titulo.press('End')
  for (let i = 0; i < 'Comprar pan'.length; i++) await titulo.press('Backspace')
  await expect(titulo).toHaveValue('')
  await page.keyboard.press('Escape')

  await expect(boton(page, 'Comprar pan')).toBeVisible()
  await expect.poll(() => guardado(page)).toMatchObject({ titulo: 'Comprar pan' })
})

test('la nota pegada de más no se corta y el Tablero no cambia', async ({ page }) => {
  const dialogo = await abrir(page)
  const nota = dialogo.getByRole('textbox', { name: 'Nota' })

  await nota.fill('a'.repeat(1799))
  await expect(dialogo).not.toContainText('/2000')
  await nota.fill('a'.repeat(2000))
  await expect(dialogo).toContainText('2000/2000')
  await expect.poll(() => guardado(page)).toMatchObject({ nota: 'a'.repeat(2000) })

  await nota.fill('b'.repeat(2001))

  await expect(nota).toHaveValue('b'.repeat(2001))
  await expect(nota).toHaveAttribute('aria-invalid', 'true')
  await expect(dialogo).toContainText('Sobra 1 carácter. Sin guardar')
  await expect(dialogo).toContainText('2001/2000')
  expect(await guardado(page)).toMatchObject({ nota: 'a'.repeat(2000) })

  await page.keyboard.press('Escape')
  await expect(page.getByRole('status')).toHaveText('Nota sin guardar. Sobra 1 carácter')
})

test('el título pegado de más no se corta y conserva el último válido', async ({ page }) => {
  const dialogo = await abrir(page)
  const titulo = dialogo.getByRole('textbox', { name: 'Título' })

  await titulo.fill('a'.repeat(125))

  await expect(titulo).toHaveValue('a'.repeat(125))
  await expect(dialogo).toContainText('125/120')
  await page.keyboard.press('Escape')

  await expect(boton(page, 'Comprar pan')).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Título sin guardar. Sobran 5 caracteres')
})

test('la Etiqueta se ve en el Tablero, se cambia y se quita', async ({ page }) => {
  const dialogo = await abrir(page)
  const pendiente = boton(page, /Comprar pan/)

  await dialogo.getByRole('radio', { name: 'Rojo' }).check({ force: true })
  await dialogo.getByRole('radio', { name: 'Verde' }).check({ force: true })
  await expect(dialogo.getByRole('radio', { name: 'Rojo' })).not.toBeChecked()
  await page.keyboard.press('Escape')

  await expect(pendiente).toHaveAccessibleName('Comprar pan, Etiqueta verde')
  await expect(pendiente.locator('svg[data-etiqueta="verde"]')).toBeVisible()
  const barra = pendiente.locator('[data-barra-de-etiqueta]')
  await expect(barra).toHaveCSS('width', '3px')
  await expect(barra).toHaveCSS('background-color', 'rgb(123, 228, 149)')

  await pendiente.click()
  await dialogo.getByRole('radio', { name: 'Sin Etiqueta' }).check({ force: true })
  await page.keyboard.press('Escape')

  await expect(pendiente).toHaveAccessibleName('Comprar pan')
  await expect(barra).toHaveCount(0)
})

test('la nota muestra un icono y el lector de pantalla oye «Tiene nota»', async ({ page }) => {
  const dialogo = await abrir(page)

  await dialogo.getByRole('textbox', { name: 'Nota' }).fill('Integral')
  await page.keyboard.press('Escape')

  const pendiente = boton(page, /Comprar pan/)
  await expect(pendiente).toHaveAccessibleName('Comprar pan, Tiene nota')
  await expect(pendiente.locator('[data-icono-de-nota]')).toBeVisible()
})

test('una nota vaciada quita el icono', async ({ page }) => {
  const dialogo = await abrir(page)
  const nota = dialogo.getByRole('textbox', { name: 'Nota' })

  await nota.fill('Integral')
  await nota.fill('   ')
  await page.keyboard.press('Escape')

  await expect(boton(page, /Comprar pan/)).toHaveAccessibleName('Comprar pan')
})

for (const [nombre, cerrar] of [
  ['Escape', (page: Page) => page.keyboard.press('Escape')],
  ['el botón Cerrar', (page: Page) => page.getByRole('button', { name: 'Cerrar' }).click()],
  ['un toque fuera', (page: Page) => page.mouse.click(1, 1)],
] as const) {
  test(`al cerrar con ${nombre}, el foco queda en el Pendiente`, async ({ page }) => {
    await abrir(page)

    await cerrar(page)

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(boton(page, 'Comprar pan')).toBeFocused()
  })
}

test('el diálogo ocupa casi toda la pantalla en móvil y se ciñe en escritorio', async ({
  page,
}, { project }) => {
  const dialogo = await abrir(page)
  const caja = (await dialogo.boundingBox())!
  const ventana = page.viewportSize()!

  if (project.name.endsWith('movil')) {
    expect(caja.width).toBeGreaterThan(ventana.width * 0.9)
    expect(caja.height).toBeGreaterThan(ventana.height * 0.9)
  } else {
    expect(caja.width).toBeLessThanOrEqual(512)
  }
})

test('al abrir, el foco entra en el diálogo sin ir al título', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(boton(page, 'Comprar pan')).toBeFocused()
  await page.keyboard.press('Enter')
  const dialogo = page.getByRole('dialog', { name: 'Editar Pendiente' })

  await expect(dialogo).toBeFocused()
  await expect(dialogo).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Tab')
  await expect(dialogo.getByRole('textbox', { name: 'Título' })).toBeFocused()
})
