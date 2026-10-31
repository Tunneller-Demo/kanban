import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const CLAVE = 'tablero-de-pendientes:/kanban/'
const PRIMER_PENDIENTE = 'Abrir el Tablero por primera vez'
const TEXTO_DE_LA_BARRA =
  'No se están guardando tus cambios. Exporta una Copia de seguridad para no perderlos'

const etapa = (page: Page, nombre: string) => page.getByRole('region', { name: nombre })
// El nombre empieza por el título: el botón «⋮» también lo lleva, tras «Mover».
const pendiente = (page: Page, nombre: string, titulo: string) =>
  etapa(page, nombre).getByRole('button', { name: new RegExp(`^${titulo}`) })
const avisoDeDeshacer = (page: Page) => page.getByRole('button', { name: 'Deshacer' })
const barra = (page: Page) => page.getByRole('alert').filter({ hasText: TEXTO_DE_LA_BARRA })
const rescate = (page: Page) =>
  page.getByRole('alertdialog', { name: 'No hemos podido leer tu Tablero' })

const moverA = async (page: Page, titulo: string, destino: string) => {
  await page.getByRole('button', { name: `Mover "${titulo}"` }).click()
  await page.getByRole('menu').getByRole('menuitem', { name: destino, exact: true }).click()
}

const crearEn = async (page: Page, nombre: string, titulo: string) => {
  await page.getByRole('button', { name: `Añadir Pendiente a ${nombre}` }).click()
  await page.keyboard.type(titulo)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
}

// Dos páginas del mismo contexto comparten almacenamiento, como dos pestañas de verdad.
const abrirDosPestanas = async (context: BrowserContext) => {
  const a = await context.newPage()
  const b = await context.newPage()
  await a.goto('/kanban/')
  await b.goto('/kanban/')
  return { a, b }
}

test('cuando una pestaña guarda, la otra muestra ese Tablero al momento', async ({ context }) => {
  const { a, b } = await abrirDosPestanas(context)

  await moverA(a, PRIMER_PENDIENTE, 'En curso')

  await expect(pendiente(b, 'En curso', PRIMER_PENDIENTE)).toBeAttached()
  await expect(pendiente(b, 'Hecho', PRIMER_PENDIENTE)).toHaveCount(0)
  await expect(b.getByRole('status')).toHaveText('Tablero actualizado desde otra pestaña')
})

test('la pestaña que recibe no vuelve a guardar', async ({ context }) => {
  const { a, b } = await abrirDosPestanas(context)
  await b.evaluate(() => {
    const contador = { guardados: 0 }
    const original = Storage.prototype.setItem
    Object.assign(window, { contador })
    Storage.prototype.setItem = function (...argumentos) {
      contador.guardados++
      original.apply(this, argumentos)
    }
  })

  await moverA(a, PRIMER_PENDIENTE, 'En curso')
  await expect(pendiente(b, 'En curso', PRIMER_PENDIENTE)).toBeAttached()

  const guardados = await b.evaluate(
    () => (window as unknown as { contador: { guardados: number } }).contador.guardados,
  )
  expect(guardados).toBe(0)
})

test('los cambios alternos de las dos pestañas se conservan', async ({ context }) => {
  const { a, b } = await abrirDosPestanas(context)

  await crearEn(a, 'Hecho', 'Desde la primera')
  await expect(pendiente(b, 'Hecho', 'Desde la primera')).toBeAttached()
  await crearEn(b, 'Hecho', 'Desde la segunda')
  await expect(pendiente(a, 'Hecho', 'Desde la segunda')).toBeAttached()
  await moverA(a, PRIMER_PENDIENTE, 'En curso')
  await expect(pendiente(b, 'En curso', PRIMER_PENDIENTE)).toBeAttached()

  await b.reload()

  await expect(pendiente(b, 'Hecho', 'Desde la primera')).toBeAttached()
  await expect(pendiente(b, 'Hecho', 'Desde la segunda')).toBeAttached()
  await expect(pendiente(b, 'En curso', PRIMER_PENDIENTE)).toBeAttached()
})

test('un cambio llegado de otra pestaña retira «Deshacer»', async ({ context }) => {
  const { a, b } = await abrirDosPestanas(context)
  await pendiente(b, 'Hecho', PRIMER_PENDIENTE).click()
  await b.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
  await expect(avisoDeDeshacer(b)).toBeVisible()
  await expect(pendiente(a, 'Hecho', PRIMER_PENDIENTE)).toHaveCount(0)

  await moverA(a, 'Añade tu primer Pendiente', 'Hecho')

  await expect(pendiente(b, 'Hecho', 'Añade tu primer Pendiente')).toBeAttached()
  await expect(avisoDeDeshacer(b)).toBeHidden()
})

test('un arrastre en curso se cancela si llega un Tablero de otra pestaña', async ({ context }) => {
  const { a, b } = await abrirDosPestanas(context)
  await pendiente(b, 'Hecho', PRIMER_PENDIENTE).scrollIntoViewIfNeeded()
  const caja = (await pendiente(b, 'Hecho', PRIMER_PENDIENTE).boundingBox())!
  await b.mouse.move(caja.x + 10, caja.y + 10)
  await b.mouse.down()
  await b.mouse.move(caja.x + 13, caja.y + 13)
  await b.mouse.move(caja.x + 18, caja.y + 18)
  await expect(b.getByRole('status')).toContainText(`"${PRIMER_PENDIENTE}" cogido en Hecho`)

  // Con teclado: con el ratón pulsado en una página, Firefox no abre el menú en la otra.
  await a.getByRole('button', { name: `Mover "Añade tu primer Pendiente"` }).focus()
  await a.keyboard.press('Enter')
  await a.getByRole('menuitem', { name: 'En curso', exact: true }).focus()
  await a.keyboard.press('Enter')

  // En segundo plano no hay fotogramas y la cancelación no acaba: quien arrastra está aquí.
  await b.bringToFront()
  await expect(pendiente(b, 'En curso', 'Añade tu primer Pendiente')).toBeAttached()
  await expect(b.getByRole('status')).toContainText(`"${PRIMER_PENDIENTE}" sigue en Hecho`)
  await b.mouse.up()
})

test('si el guardado falla, un Tablero recibido retira la barra', async ({ context }) => {
  const { a, b } = await abrirDosPestanas(context)
  await b.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Sin espacio', 'QuotaExceededError')
    }
  })
  await moverA(b, PRIMER_PENDIENTE, 'En curso')
  await expect(barra(b)).toBeVisible()

  await moverA(a, 'Añade tu primer Pendiente', 'Hecho')

  await expect(barra(b)).toBeHidden()
  await expect(pendiente(b, 'Hecho', 'Añade tu primer Pendiente')).toBeAttached()
  await expect(pendiente(b, 'Hecho', PRIMER_PENDIENTE)).toBeAttached()
})

test('«Empezar de cero» en una pestaña cierra el rescate en la otra', async ({ context }) => {
  const a = await context.newPage()
  await a.goto('/kanban/')
  await a.evaluate((c) => localStorage.setItem(c, 'datos dañados'), CLAVE)
  await a.reload()
  const b = await context.newPage()
  await b.goto('/kanban/')
  await expect(rescate(a)).toBeVisible()
  await expect(rescate(b)).toBeVisible()

  await rescate(a).getByRole('button', { name: 'Empezar de cero' }).click()

  await expect(rescate(b)).toBeHidden()
  await expect(etapa(b, 'Por hacer')).toBeVisible()
})
