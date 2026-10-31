import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { infracciones } from './ayudas'

const CLAVE = 'tablero-de-pendientes:/kanban/'
const TEXTO_DE_LA_BARRA =
  'No se están guardando tus cambios. Exporta una Copia de seguridad para no perderlos'
const FRASE_DEL_PIE = 'Tus datos se guardan solo en este navegador'
const FRASE_DURANTE_EL_FALLO = 'Tus cambios solo están en esta pestaña'

const barra = (page: Page) => page.getByRole('alert').filter({ hasText: TEXTO_DE_LA_BARRA })
const pie = (page: Page) => page.getByRole('contentinfo')
const etapa = (page: Page, nombre: string) => page.getByRole('region', { name: nombre })
const pendientes = (page: Page, nombre: string) => etapa(page, nombre).getByRole('listitem')
const rescate = (page: Page) =>
  page.getByRole('alertdialog', { name: 'No hemos podido leer tu Tablero' })
const empezarDeCero = (page: Page) => rescate(page).getByRole('button', { name: 'Empezar de cero' })

// Guarda el original para poder recuperarlo, como si el almacenamiento volviera a tener sitio.
const romperElGuardado = (page: Page) =>
  page.evaluate(() => {
    const original = Storage.prototype.setItem
    Object.assign(window, { setItemOriginal: original })
    Storage.prototype.setItem = () => {
      throw new DOMException('Sin espacio', 'QuotaExceededError')
    }
  })

const recuperarElGuardado = (page: Page) =>
  page.evaluate(() => {
    Storage.prototype.setItem = (window as unknown as { setItemOriginal: Storage['setItem'] })
      .setItemOriginal
  })

const moverPrimerPendiente = async (page: Page, destino: string) => {
  await page.getByRole('button', { name: 'Mover "Abrir el Tablero por primera vez"' }).click()
  await page.getByRole('menu').getByRole('menuitem', { name: destino, exact: true }).click()
}

const abrirConDatosDanados = async (page: Page, contenido: string) => {
  await page.goto('/kanban/')
  await page.evaluate(([c, valor]) => localStorage.setItem(c, valor), [CLAVE, contenido])
  await page.reload()
}

const leerGuardado = (page: Page) => page.evaluate((c) => localStorage.getItem(c), CLAVE)

test.describe('guardado que falla', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kanban/')
  })

  test('sin fallos no hay barra y el pie dice dónde viven los datos', async ({ page }) => {
    await moverPrimerPendiente(page, 'En curso')

    await expect(barra(page)).toBeHidden()
    await expect(pie(page)).toContainText(FRASE_DEL_PIE)
  })

  test('muestra la barra, sin cierre, y sustituye la frase del pie', async ({ page }) => {
    await romperElGuardado(page)

    await moverPrimerPendiente(page, 'En curso')

    await expect(pendientes(page, 'En curso')).toHaveCount(3)
    await expect(barra(page)).toHaveText(`${TEXTO_DE_LA_BARRA}Exportar`)
    await expect(barra(page).getByRole('button')).toHaveText(['Exportar'])
    await expect(pie(page)).toContainText(FRASE_DURANTE_EL_FALLO)
    await expect(pie(page)).not.toContainText(FRASE_DEL_PIE)
    expect(await infracciones(page)).toEqual([])
  })

  test('la barra no tapa el Tablero ni se va al desplazarse', async ({ page }) => {
    await romperElGuardado(page)

    await moverPrimerPendiente(page, 'En curso')
    await page.getByRole('main').evaluate((tablero) => {
      tablero.scrollTo({ left: tablero.scrollWidth, behavior: 'instant' })
    })

    await expect(barra(page)).toBeInViewport({ ratio: 1 })
    await expect(pie(page)).toBeInViewport({ ratio: 1 })
    const cajaDeLaBarra = (await barra(page).boundingBox())!
    const cajaDelTablero = (await page.getByRole('main').boundingBox())!
    expect(cajaDelTablero.y).toBeGreaterThanOrEqual(cajaDeLaBarra.y + cajaDeLaBarra.height)
  })

  test('«Exportar» descarga el Tablero que hay en memoria', async ({ page }) => {
    await romperElGuardado(page)
    await moverPrimerPendiente(page, 'En curso')

    const descarga = page.waitForEvent('download')
    await barra(page).getByRole('button', { name: 'Exportar' }).click()

    const datos = JSON.parse(await readFile(await (await descarga).path(), 'utf8'))
    expect(datos.tablero.etapas[1].pendientes[0].titulo).toBe('Abrir el Tablero por primera vez')
    await expect(page.getByRole('status')).toHaveText('Copia de seguridad exportada')
    await expect(barra(page)).toBeVisible()
  })

  test('el navegador avisa al salir mientras dura el fallo', async ({ page }) => {
    const pideConfirmar = () =>
      page.evaluate(() => {
        const evento = new Event('beforeunload', { cancelable: true })
        window.dispatchEvent(evento)
        return evento.defaultPrevented
      })

    expect(await pideConfirmar()).toBe(false)

    await romperElGuardado(page)
    await moverPrimerPendiente(page, 'En curso')
    await expect(barra(page)).toBeVisible()
    expect(await pideConfirmar()).toBe(true)

    await recuperarElGuardado(page)
    await moverPrimerPendiente(page, 'Hecho')
    await expect(barra(page)).toBeHidden()
    expect(await pideConfirmar()).toBe(false)
  })

  test('la barra desaparece sola en cuanto un guardado funciona', async ({ page }) => {
    await romperElGuardado(page)
    await moverPrimerPendiente(page, 'En curso')
    await expect(barra(page)).toBeVisible()

    await recuperarElGuardado(page)
    await moverPrimerPendiente(page, 'Por hacer')

    await expect(barra(page)).toBeHidden()
    await expect(pie(page)).toContainText(FRASE_DEL_PIE)

    await page.reload()

    await expect(pendientes(page, 'Por hacer')).toHaveCount(4)
  })

  test('una importación demasiado grande se muestra con la barra', async ({ page }) => {
    await romperElGuardado(page)
    const copia = JSON.stringify({
      app: 'tablero-de-pendientes',
      version: 1,
      tablero: { etapas: [{ nombre: 'Hoy', pendientes: [{ titulo: 'Comprar pan' }] }] },
    })

    const selector = page.waitForEvent('filechooser')
    await pie(page).getByRole('button', { name: 'Copia de seguridad', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Importar' }).click()
    await (
      await selector
    ).setFiles({
      name: 'copia.json',
      mimeType: 'application/json',
      buffer: Buffer.from(copia),
    })

    await expect(pendientes(page, 'Hoy')).toHaveCount(1)
    await expect(barra(page)).toBeVisible()
  })
})

test.describe('datos guardados dañados', () => {
  const DANADOS = '{dañado: "ñ", 1'

  test('abre el diálogo, sin escribir nada ni tratarlo como primera visita', async ({ page }) => {
    await abrirConDatosDanados(page, DANADOS)

    await expect(rescate(page)).toBeVisible()
    await expect(page.getByText('Abrir el Tablero por primera vez')).toBeHidden()
    expect(await leerGuardado(page)).toBe(DANADOS)
    expect(await infracciones(page)).toEqual([])
  })

  test('no se puede cerrar sin decidir', async ({ page }) => {
    await abrirConDatosDanados(page, DANADOS)

    await page.keyboard.press('Escape')
    await page.mouse.click(2, 2)

    await expect(rescate(page)).toBeVisible()
    await expect(rescate(page).getByRole('button', { name: 'Cerrar' })).toHaveCount(0)
  })

  test('«Descargar los datos guardados» baja el contenido tal cual', async ({ page }) => {
    await abrirConDatosDanados(page, DANADOS)

    const descarga = page.waitForEvent('download')
    await rescate(page).getByRole('button', { name: 'Descargar los datos guardados' }).click()
    const archivo = await descarga

    expect(archivo.suggestedFilename()).toBe('tablero-de-pendientes-datos-guardados.json')
    expect(await readFile(await archivo.path(), 'utf8')).toBe(DANADOS)
    await expect(rescate(page)).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Datos guardados descargados')
    expect(await leerGuardado(page)).toBe(DANADOS)
  })

  test('recargar sin decidir vuelve a ofrecer el rescate', async ({ page }) => {
    await abrirConDatosDanados(page, DANADOS)
    await expect(rescate(page)).toBeVisible()

    await page.reload()

    await expect(rescate(page)).toBeVisible()
    expect(await leerGuardado(page)).toBe(DANADOS)
  })

  test('«Empezar de cero» abre un Tablero vacío con las tres Etapas', async ({ page }) => {
    await abrirConDatosDanados(page, DANADOS)

    await empezarDeCero(page).click()

    await expect(rescate(page)).toBeHidden()
    await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
    await expect(pendientes(page, 'En curso')).toHaveCount(0)
    await expect(pendientes(page, 'Hecho')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' })).toBeFocused()
    await expect(page.getByRole('status')).toHaveText('Tablero vacío abierto')

    await page.reload()

    await expect(rescate(page)).toBeHidden()
    await expect(etapa(page, 'Por hacer')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver el Tablero de ejemplo' })).toBeVisible()
  })

  test('«Empezar de cero» con el guardado fallando muestra la barra', async ({ page }) => {
    await abrirConDatosDanados(page, DANADOS)
    await romperElGuardado(page)

    await empezarDeCero(page).click()

    await expect(etapa(page, 'Por hacer')).toBeVisible()
    await expect(barra(page)).toBeVisible()
    expect(await leerGuardado(page)).toBe(DANADOS)
  })
})
