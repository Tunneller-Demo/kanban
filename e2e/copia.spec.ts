import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { abrirTableroVacio, infracciones } from './ayudas'

const enlace = (page: Page) =>
  page.getByRole('contentinfo').getByRole('button', { name: 'Copia de seguridad', exact: true })
const dialogo = (page: Page) => page.getByRole('dialog', { name: 'Copia de seguridad' })
const confirmacion = (page: Page) =>
  page.getByRole('alertdialog', { name: 'Importar la Copia de seguridad' })
const error = (page: Page) => page.getByRole('dialog', { name: 'No se ha podido importar' })
const etapa = (page: Page, nombre: string) => page.getByRole('region', { name: nombre })
const pendientes = (page: Page, nombre: string) => etapa(page, nombre).getByRole('listitem')
const deshacer = (page: Page) => page.getByRole('button', { name: 'Deshacer' })
const anuncios = (page: Page) => page.getByRole('status')

const copia = (tablero: unknown, version = 1) =>
  JSON.stringify({ app: 'tablero-de-pendientes', version, tablero })

const COPIA_VALIDA = copia({
  etapas: [
    {
      nombre: 'Hoy',
      pendientes: [
        { titulo: 'Comprar pan', nota: 'Integral', etiqueta: 'azul' },
        { titulo: 'Regar' },
      ],
    },
    { nombre: 'Mañana', pendientes: [{ titulo: 'Llamar al banco' }] },
    { nombre: 'Algún día', pendientes: [] },
    { nombre: 'Nunca', pendientes: [] },
  ],
})

const elegir = async (page: Page, abrir: () => Promise<void>, contenido: string) => {
  const selector = page.waitForEvent('filechooser')
  await abrir()
  await (
    await selector
  ).setFiles({
    name: 'copia.json',
    mimeType: 'application/json',
    buffer: Buffer.from(contenido),
  })
}

const importar = (page: Page, contenido: string) =>
  elegir(
    page,
    async () => {
      await enlace(page).click()
      await dialogo(page).getByRole('button', { name: 'Importar' }).click()
    },
    contenido,
  )

const crearPendiente = async (page: Page, titulo: string) => {
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill(titulo)
  await campo.press('Enter')
  await campo.press('Escape')
}

const moverPrimerPendiente = async (page: Page) => {
  await page.getByRole('button', { name: 'Mover "Abrir el Tablero por primera vez"' }).click()
  await page.getByRole('menu').getByRole('menuitem', { name: 'En curso', exact: true }).click()
}

test.describe('el diálogo', () => {
  test('se abre junto a la frase del pie y dice dónde viven los datos', async ({ page }) => {
    await page.goto('/kanban/')

    await enlace(page).click()

    await expect(dialogo(page)).toContainText('Tus datos se guardan solo en este navegador')
    await expect(dialogo(page).getByRole('button', { name: 'Exportar' })).toBeVisible()
    await expect(dialogo(page).getByRole('button', { name: 'Importar' })).toBeVisible()
    expect(await infracciones(page)).toEqual([])

    await page.keyboard.press('Escape')

    await expect(enlace(page)).toBeFocused()
  })
})

test.describe('exportar', () => {
  test('descarga un JSON legible, sin identificadores, con la fecha local', async ({ page }) => {
    await page.goto('/kanban/')
    await enlace(page).click()

    const descarga = page.waitForEvent('download')
    await dialogo(page).getByRole('button', { name: 'Exportar' }).click()
    const archivo = await descarga

    const hoy = await page.evaluate(() => {
      const ahora = new Date()
      const mes = String(ahora.getMonth() + 1).padStart(2, '0')
      const dia = String(ahora.getDate()).padStart(2, '0')
      return `${ahora.getFullYear()}-${mes}-${dia}`
    })
    expect(archivo.suggestedFilename()).toBe(`tablero-de-pendientes-${hoy}.json`)

    const texto = await readFile(await archivo.path(), 'utf8')
    const datos = JSON.parse(texto)
    expect(datos.app).toBe('tablero-de-pendientes')
    expect(datos.version).toBe(1)
    expect(datos.tablero.etapas.map((e: { nombre: string }) => e.nombre)).toEqual([
      'Por hacer',
      'En curso',
      'Hecho',
    ])
    expect(datos.tablero.etapas[2].pendientes).toEqual([
      { titulo: 'Abrir el Tablero por primera vez', etiqueta: 'verde' },
    ])
    expect(texto).not.toContain('"id"')
    await expect(anuncios(page)).toHaveText('Copia de seguridad exportada')
  })

  test('lo exportado se puede importar y queda igual', async ({ page }) => {
    await page.goto('/kanban/')
    await moverPrimerPendiente(page)
    await enlace(page).click()
    const descarga = page.waitForEvent('download')
    await dialogo(page).getByRole('button', { name: 'Exportar' }).click()
    const texto = await readFile(await (await descarga).path(), 'utf8')
    await page.keyboard.press('Escape')
    await page.getByRole('banner').getByRole('button', { name: 'Vaciar' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Vaciar' }).click()

    await importar(page, texto)

    await expect(pendientes(page, 'Por hacer')).toHaveCount(3)
    await expect(pendientes(page, 'En curso')).toHaveCount(3)
    await expect(pendientes(page, 'Hecho')).toHaveCount(0)
  })
})

test.describe('importar', () => {
  test('pide confirmación con las cifras y reemplaza el Tablero entero', async ({ page }) => {
    await page.goto('/kanban/')
    await moverPrimerPendiente(page)

    await importar(page, COPIA_VALIDA)

    await expect(confirmacion(page)).toHaveAccessibleDescription(
      'Se reemplazarán tus 6 Pendientes en 3 Etapas por 3 Pendientes en 4 Etapas',
    )
    expect(await infracciones(page)).toEqual([])

    await confirmacion(page).getByRole('button', { name: 'Importar' }).click()

    await expect(confirmacion(page)).toBeHidden()
    await expect(pendientes(page, 'Hoy')).toHaveCount(2)
    await expect(pendientes(page, 'Mañana')).toHaveCount(1)
    await expect(etapa(page, 'Por hacer')).toBeHidden()
    await expect(anuncios(page)).toHaveText('Copia de seguridad importada. Deshacer disponible')
    await expect(page.getByRole('button', { name: /^Comprar pan/ })).toBeFocused()

    await page.reload()

    await expect(pendientes(page, 'Hoy')).toHaveCount(2)
  })

  test('«Cancelar» no cambia nada y vuelve al enlace', async ({ page }) => {
    await page.goto('/kanban/')
    await moverPrimerPendiente(page)
    await importar(page, COPIA_VALIDA)

    await confirmacion(page).getByRole('button', { name: 'Cancelar' }).click()

    await expect(confirmacion(page)).toBeHidden()
    await expect(pendientes(page, 'En curso')).toHaveCount(3)
    await expect(deshacer(page)).toBeHidden()
    await expect(enlace(page)).toBeFocused()
  })

  test('cerrar el selector sin elegir nada no cambia nada y vuelve al enlace', async ({ page }) => {
    await page.goto('/kanban/')
    await enlace(page).click()
    const selector = page.waitForEvent('filechooser')
    await dialogo(page).getByRole('button', { name: 'Importar' }).click()
    await selector

    await expect(dialogo(page)).toBeHidden()
    await expect(enlace(page)).toBeFocused()
    await expect(pendientes(page, 'Por hacer')).toHaveCount(3)
  })

  test('con el Tablero de ejemplo intacto no pide confirmación', async ({ page }) => {
    await page.goto('/kanban/')

    await importar(page, COPIA_VALIDA)

    await expect(pendientes(page, 'Hoy')).toHaveCount(2)
    await expect(confirmacion(page)).toBeHidden()
  })

  test('desde el Tablero vacío, sin confirmación', async ({ page }) => {
    await abrirTableroVacio(page)

    await elegir(
      page,
      () => page.getByRole('button', { name: 'Importar una Copia de seguridad' }).click(),
      COPIA_VALIDA,
    )

    await expect(pendientes(page, 'Hoy')).toHaveCount(2)
    await expect(confirmacion(page)).toBeHidden()
    await expect(page.getByRole('button', { name: 'Ver el Tablero de ejemplo' })).toBeHidden()
  })

  test('un error desde el Tablero vacío devuelve el foco a su botón', async ({ page }) => {
    await abrirTableroVacio(page)
    const boton = page.getByRole('button', { name: 'Importar una Copia de seguridad' })

    await elegir(page, () => boton.click(), 'hola')
    await expect(error(page)).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(boton).toBeFocused()
  })

  test('«Deshacer» recupera el Tablero anterior', async ({ page }) => {
    await abrirTableroVacio(page)
    await crearPendiente(page, 'Lo que tenía')
    await importar(page, COPIA_VALIDA)
    await confirmacion(page).getByRole('button', { name: 'Importar' }).click()
    await expect(pendientes(page, 'Hoy')).toHaveCount(2)

    await deshacer(page).click()

    await expect(pendientes(page, 'Por hacer')).toHaveCount(1)
    await expect(etapa(page, 'Hoy')).toBeHidden()
    await expect(anuncios(page)).toHaveText('Tablero anterior recuperado')
    await expect(page.getByRole('button', { name: 'Lo que tenía', exact: true })).toBeFocused()

    await page.reload()

    await expect(pendientes(page, 'Por hacer')).toHaveCount(1)
  })

  test('elegir dos veces el mismo archivo vuelve a analizarlo', async ({ page }) => {
    await page.goto('/kanban/')
    await importar(page, 'hola')
    await expect(error(page)).toBeVisible()
    await page.keyboard.press('Escape')

    await importar(page, 'hola')

    await expect(error(page)).toBeVisible()
  })
})

test.describe('errores', () => {
  const casos: [string, string, string][] = [
    ['otro archivo', 'hola', 'Este archivo no es una Copia de seguridad del Tablero'],
    [
      'una versión más nueva',
      copia({ etapas: [] }, 2),
      'Esta copia es de una versión más nueva de la app. Recarga la página y vuelve a intentarlo',
    ],
    [
      'una Etiqueta desconocida',
      copia({
        etapas: [
          { nombre: 'Hoy', pendientes: [{ titulo: 'Comprar pan', etiqueta: 'fucsia' }] },
        ],
      }),
      'La copia está dañada y no se puede importar. Tu Tablero no ha cambiado',
    ],
  ]

  for (const [nombre, contenido, texto] of casos) {
    test(`${nombre}: avisa con su texto y el Tablero no cambia`, async ({ page }) => {
      await page.goto('/kanban/')

      await importar(page, contenido)

      await expect(error(page).getByRole('alert')).toHaveText(texto)
      expect(await infracciones(page)).toEqual([])

      await error(page).getByRole('button', { name: 'Cerrar' }).click()

      await expect(error(page)).toBeHidden()
      await expect(pendientes(page, 'Por hacer')).toHaveCount(3)
      await expect(deshacer(page)).toBeHidden()
      await expect(enlace(page)).toBeFocused()

      await page.reload()

      await expect(pendientes(page, 'Por hacer')).toHaveCount(3)
    })
  }
})
