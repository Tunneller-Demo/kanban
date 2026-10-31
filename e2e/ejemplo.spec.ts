import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { abrirTableroVacio } from './ayudas'

const infracciones = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations
}

const etapa = (page: Page, nombre: string) => page.getByRole('region', { name: nombre })
const vaciar = (page: Page) => page.getByRole('banner').getByRole('button', { name: 'Vaciar' })
const verEjemplo = (page: Page) => page.getByRole('button', { name: 'Ver el Tablero de ejemplo' })
const confirmacion = (page: Page) => page.getByRole('alertdialog', { name: 'Vaciar el Tablero' })
const anuncios = (page: Page) => page.getByRole('status')
const pendientes = (page: Page, nombre: string) => etapa(page, nombre).getByRole('listitem')
const pendiente = (page: Page, titulo: string) =>
  page.getByRole('button', { name: new RegExp(`^${titulo}`) })
const crear = (page: Page, nombre: string) =>
  page.getByRole('button', { name: `Añadir Pendiente a ${nombre}` })

const moverA = async (page: Page, titulo: string, nombre: string) => {
  await page.getByRole('button', { name: `Mover "${titulo}"` }).click()
  await page.getByRole('menu').getByRole('menuitem', { name: nombre, exact: true }).click()
}

const renombrar = async (page: Page, nombre: string, nuevo: string) => {
  await page.getByRole('button', { name: nombre, exact: true }).click()
  const campo = page.getByRole('textbox', { name: `Nombre de la Etapa ${nombre}` })
  await campo.fill(nuevo)
  await campo.press('Enter')
}

const esperarElEjemplo = async (page: Page) => {
  await expect(pendientes(page, 'Por hacer')).toHaveCount(3)
  await expect(pendientes(page, 'En curso')).toHaveCount(2)
  await expect(pendientes(page, 'Hecho')).toHaveCount(1)
}

const esperarVacio = async (page: Page) => {
  for (const nombre of ['Por hacer', 'En curso', 'Hecho']) {
    await expect(etapa(page, nombre)).toContainText('0 Pendientes')
  }
}

test.describe('primera visita', () => {
  test('abre los seis Pendientes de ejemplo en las tres Etapas de partida', async ({ page }) => {
    await page.goto('/kanban/')

    await esperarElEjemplo(page)
    await expect(pendientes(page, 'Por hacer').nth(0)).toContainText('Arrástrame a «En curso»')
    await expect(pendientes(page, 'Por hacer').nth(1)).toContainText('Ábreme para ver mi nota')
    await expect(pendientes(page, 'Por hacer').nth(2)).toContainText('Añade tu primer Pendiente')
    await expect(pendientes(page, 'En curso').nth(0)).toContainText('Adapta las Etapas')
    await expect(pendientes(page, 'En curso').nth(1)).toContainText('Guarda una Copia de seguridad')
    await expect(pendientes(page, 'Hecho').nth(0)).toContainText('Abrir el Tablero por primera vez')
    await expect(verEjemplo(page)).toBeHidden()
  })

  test('sus notas se abren y el Pendiente terminado no tiene', async ({ page }) => {
    await page.goto('/kanban/')

    await pendiente(page, 'Ábreme para ver mi nota').click()
    const dialogo = page.getByRole('dialog', { name: 'Editar Pendiente' })
    await expect(dialogo.getByRole('textbox', { name: 'Nota' })).toHaveValue(/Etiqueta de color/)
    await page.keyboard.press('Escape')

    await pendiente(page, 'Abrir el Tablero por primera vez').click()
    await expect(dialogo.getByRole('textbox', { name: 'Nota' })).toHaveValue('')
  })

  test('el ejemplo sigue tras recargar, también si ya no está intacto', async ({ page }) => {
    await page.goto('/kanban/')
    await page.reload()
    await esperarElEjemplo(page)

    await moverA(page, 'Abrir el Tablero por primera vez', 'En curso')
    await page.reload()

    await expect(pendientes(page, 'En curso')).toHaveCount(3)
    await expect(pendientes(page, 'Hecho')).toHaveCount(0)
  })

  test('un Tablero guardado no vuelve a abrir el ejemplo', async ({ page }) => {
    await abrirTableroVacio(page)

    await page.reload()

    await esperarVacio(page)
    await expect(verEjemplo(page)).toBeVisible()
  })
})

test.describe('Vaciar', () => {
  test('con el ejemplo intacto no pide confirmación, conserva las Etapas y no ofrece «Deshacer»', async ({
    page,
  }) => {
    await page.goto('/kanban/')

    await vaciar(page).click()

    await esperarVacio(page)
    await expect(confirmacion(page)).toBeHidden()
    await expect(page.getByRole('button', { name: 'Deshacer' })).toBeHidden()
    await expect(anuncios(page)).toHaveText('Tablero vaciado. 6 Pendientes quitados')
    await expect(crear(page, 'Por hacer')).toBeFocused()
  })

  test('sigue sin pedirla tras recargar con el ejemplo intacto', async ({ page }) => {
    await page.goto('/kanban/')
    await page.reload()

    await vaciar(page).click()

    await esperarVacio(page)
  })

  test('mover un Pendiente basta para pedirla, también tras recargar', async ({ page }) => {
    await page.goto('/kanban/')
    await moverA(page, 'Abrir el Tablero por primera vez', 'En curso')
    await page.reload()

    await vaciar(page).click()

    await expect(confirmacion(page)).toBeVisible()
  })

  test('la confirmación dice qué pasa; «Cancelar» no cambia nada y devuelve el foco', async ({
    page,
  }) => {
    await page.goto('/kanban/')
    await moverA(page, 'Abrir el Tablero por primera vez', 'En curso')

    await vaciar(page).click()
    await expect(confirmacion(page)).toContainText('Se borrarán 6 Pendientes')
    await expect(confirmacion(page)).toContainText('Las Etapas se conservan')
    expect(await infracciones(page)).toEqual([])

    await confirmacion(page).getByRole('button', { name: 'Cancelar' }).click()

    await expect(confirmacion(page)).toBeHidden()
    await expect(pendientes(page, 'En curso')).toHaveCount(3)
    await expect(vaciar(page)).toBeFocused()
  })

  test('al confirmar quita los Pendientes, conserva las Etapas renombradas y mueve el foco', async ({
    page,
  }) => {
    await page.goto('/kanban/')
    await renombrar(page, 'Hecho', 'Terminado')

    await vaciar(page).click()
    await confirmacion(page).getByRole('button', { name: 'Vaciar' }).click()

    await expect(confirmacion(page)).toBeHidden()
    await expect(etapa(page, 'Terminado')).toContainText('0 Pendientes')
    await expect(page.getByRole('button', { name: 'Deshacer' })).toBeHidden()
    await expect(crear(page, 'Por hacer')).toBeFocused()

    await page.reload()
    await expect(etapa(page, 'Terminado')).toContainText('0 Pendientes')
  })

  test('con el Tablero vacío sigue a mano, desactivado y con su motivo', async ({ page }) => {
    await abrirTableroVacio(page)

    await expect(vaciar(page)).toHaveAttribute('aria-disabled', 'true')
    await expect(vaciar(page)).toHaveAccessibleDescription('El Tablero ya está vacío')
    await vaciar(page).focus()
    await expect(vaciar(page)).toBeFocused()

    // force: Playwright no pulsa un botón con aria-disabled, y aquí se prueba que no haga nada.
    await vaciar(page).click({ force: true })

    await expect(confirmacion(page)).toBeHidden()
  })
})

test.describe('Tablero vacío', () => {
  test('invita a crear el primer Pendiente y la invitación se va al crearlo', async ({ page }) => {
    await abrirTableroVacio(page)
    await expect(page.getByText('Crea tu primer Pendiente')).toBeVisible()

    await crear(page, 'En curso').click()
    const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en En curso' })
    await campo.fill('Comprar pan')
    await campo.press('Enter')

    await expect(page.getByText('Crea tu primer Pendiente')).toBeHidden()
  })

  test('también invita si se borran los Pendientes uno a uno', async ({ page }) => {
    await abrirTableroVacio(page)
    await crear(page, 'Por hacer').click()
    const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
    await campo.fill('Comprar pan')
    await campo.press('Enter')
    await campo.press('Escape')

    await pendiente(page, 'Comprar pan').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()

    await expect(verEjemplo(page)).toBeVisible()
  })

  test('«Ver el Tablero de ejemplo» sustituye al Tablero, también sus Etapas', async ({ page }) => {
    await abrirTableroVacio(page)
    await renombrar(page, 'Hecho', 'Terminado')

    await verEjemplo(page).click()

    await esperarElEjemplo(page)
    await expect(etapa(page, 'Terminado')).toBeHidden()
    await expect(anuncios(page)).toHaveText('Tablero de ejemplo abierto. Deshacer disponible')
    await expect(pendiente(page, 'Arrástrame a «En curso»')).toBeFocused()
  })

  test('«Deshacer» recupera el Tablero vacío con sus Etapas', async ({ page }) => {
    await abrirTableroVacio(page)
    await renombrar(page, 'Hecho', 'Terminado')
    await verEjemplo(page).click()

    await page.getByRole('button', { name: 'Deshacer' }).click()

    await expect(etapa(page, 'Terminado')).toContainText('0 Pendientes')
    await expect(anuncios(page)).toHaveText('Tablero vacío recuperado')
    await expect(crear(page, 'Por hacer')).toBeFocused()
    await expect(verEjemplo(page)).toBeVisible()
  })

  test('el ejemplo recuperado cuenta como intacto: Vaciar no pide confirmación', async ({
    page,
  }) => {
    await abrirTableroVacio(page)
    await verEjemplo(page).click()
    await page.getByRole('button', { name: 'Cerrar aviso' }).click()
    await expect(pendiente(page, 'Arrástrame a «En curso»')).toBeFocused()

    await vaciar(page).click()

    await esperarVacio(page)
    await expect(confirmacion(page)).toBeHidden()
  })
})

test.describe('accesibilidad', () => {
  test('el Tablero de ejemplo no tiene infracciones de WCAG A y AA', async ({ page }) => {
    await page.goto('/kanban/')
    await esperarElEjemplo(page)

    expect(await infracciones(page)).toEqual([])
  })

  test('el Tablero vacío no tiene infracciones de WCAG A y AA', async ({ page }) => {
    await abrirTableroVacio(page)

    expect(await infracciones(page)).toEqual([])
  })
})
