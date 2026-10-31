import AxeBuilder from '@axe-core/playwright'
import { expect, type Locator, type Page } from '@playwright/test'

export const infracciones = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations
}

// La primera visita abre el Tablero de ejemplo, intacto: «Vaciar» no pide confirmación.
export const abrirTableroVacio = async (page: Page) => {
  await page.goto('/kanban/')
  await page.getByRole('button', { name: 'Vaciar' }).click()
  await expect(page.getByRole('button', { name: 'Ver el Tablero de ejemplo' })).toBeVisible()
}

export const llenarDeEtapas = async (page: Page) => {
  const boton = page.getByRole('button', { name: 'Añadir Etapa' })
  for (const nombre of ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava']) {
    await boton.click()
    const campo = page.getByRole('textbox', { name: 'Nombre de la nueva Etapa' })
    await campo.fill(nombre)
    await campo.press('Enter')
  }
  await expect(page.getByText('El Tablero admite hasta 8 Etapas')).toBeVisible()
}

const PULSACIONES_MAXIMAS = 150

// Sin contar pulsaciones: cada navegador se para en sitios algo distintos. Va hacia atrás si
// hace falta, porque `Firefox` no da la vuelta al llegar al final de la página.
export const tabularHasta = async (page: Page, destino: Locator) => {
  for (let pulsacion = 0; pulsacion < PULSACIONES_MAXIMAS; pulsacion++) {
    const tecla = await destino.evaluate((nodo) => {
      const activo = document.activeElement
      if (nodo === activo) return null
      const detras = activo && nodo.compareDocumentPosition(activo) & Node.DOCUMENT_POSITION_FOLLOWING
      return detras && activo !== document.body ? 'Shift+Tab' : 'Tab'
    })
    if (!tecla) return
    await page.keyboard.press(tecla)
  }
  throw new Error(`Tab no ha llegado a ${destino}`)
}

export const ventanasEstrechas = [
  // Lo que ve el diseño con el zoom al 200 % en la ventana de escritorio de 1280 × 800.
  { nombre: 'con zoom al 200 %', proyecto: 'escritorio', tamano: { width: 640, height: 400 } },
  { nombre: 'a 320 px', proyecto: 'movil', tamano: { width: 320, height: 568 } },
]

// Lo que le falta al elemento enfocado para que se vea bien el foco.
const problemasDelFoco = () => {
  const activo = document.activeElement as HTMLElement
  // Las Etiquetas esconden su radio: el contorno lo pinta la etiqueta que lo envuelve.
  const elemento = (activo.matches('[type="radio"]') && activo.closest('label')) || activo
  const estilo = getComputedStyle(elemento)
  const caja = elemento.getBoundingClientRect()
  const campo = activo as HTMLInputElement
  const nombre =
    activo.getAttribute('aria-label') ??
    (campo.labels?.[0] ?? activo).textContent?.trim().slice(0, 30)
  const problemas: string[] = []

  const sobreLima = estilo.backgroundColor === 'rgb(198, 242, 78)'
  const color = sobreLima ? 'rgb(233, 236, 244)' : 'rgb(198, 242, 78)'
  if (estilo.outlineColor !== color) problemas.push(`color ${estilo.outlineColor}`)
  if (estilo.outlineStyle !== 'solid') problemas.push(`estilo ${estilo.outlineStyle}`)
  if (estilo.outlineWidth !== '2px') problemas.push(`grosor ${estilo.outlineWidth}`)
  if (estilo.outlineOffset !== '2px') problemas.push(`separación ${estilo.outlineOffset}`)

  const margen = 4
  for (let padre = elemento.parentElement; padre; padre = padre.parentElement) {
    if (getComputedStyle(padre).overflow === 'visible') continue
    const marco = padre.getBoundingClientRect()
    const recortado =
      caja.top - margen < marco.top ||
      caja.bottom + margen > marco.bottom ||
      caja.left - margen < marco.left ||
      caja.right + margen > marco.right
    if (recortado) problemas.push(`recortado por ${padre.tagName}`)
  }

  const { clientWidth, clientHeight } = document.documentElement
  if (caja.top < 0 || caja.left < 0 || caja.bottom > clientHeight || caja.right > clientWidth) {
    problemas.push('fuera de la ventana')
  }
  const encima = document.elementFromPoint(caja.left + caja.width / 2, caja.top + caja.height / 2)
  if (!encima || !(elemento.contains(encima) || encima.contains(elemento))) {
    problemas.push(`tapado por ${encima?.tagName}`)
  }

  return problemas.map((problema) => `${nombre}: ${problema}`)
}

// `Firefox` también detiene Tab en lo que se desplaza: su foco no es un control.
const esControl = () => {
  const activo = document.activeElement
  return !!activo?.matches('a, button, input, textarea, [role="menuitem"]')
}

// Recorre lo que alcanza `tecla` desde el foco actual, hasta dar la vuelta o salir de la página.
export const problemasDeFocoAlRecorrer = async (page: Page, tecla = 'Tab') => {
  const problemas: string[] = []
  await page.evaluate(() => {
    ;(window as unknown as { vistos: Set<Element> }).vistos = new Set()
  })

  for (let pulsacion = 0; pulsacion < PULSACIONES_MAXIMAS; pulsacion++) {
    await page.keyboard.press(tecla)
    const nuevo = await page.evaluate(() => {
      const { vistos } = window as unknown as { vistos: Set<Element> }
      const activo = document.activeElement
      if (!activo || activo === document.body || vistos.has(activo)) return false
      vistos.add(activo)
      return true
    })
    if (!nuevo) return problemas
    // El carrusel encaja justo después del desplazamiento que trae el foco.
    await page.evaluate(
      () => new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(listo))),
    )
    if (await page.evaluate(esControl)) problemas.push(...(await page.evaluate(problemasDelFoco)))
  }
  throw new Error(`${tecla} no ha dado la vuelta`)
}
