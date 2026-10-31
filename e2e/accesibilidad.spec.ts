import { expect, test, type Page } from '@playwright/test'
import { abrirTableroVacio, infracciones, llenarDeEtapas, ventanasEstrechas } from './ayudas'

test('el Tablero de ejemplo no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await page.goto('/kanban/')
  await expect(page.getByRole('main').getByRole('listitem').first()).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('la confirmación de vaciar no tiene infracciones de WCAG A y AA', async ({ page }) => {
  await abrirTableroVacio(page)
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  const campo = page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' })
  await campo.fill('Comprar pan')
  await campo.press('Enter')
  await campo.press('Escape')
  await page.getByRole('button', { name: 'Vaciar' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Vaciar el Tablero' })).toBeVisible()

  expect(await infracciones(page)).toEqual([])
})

test('el Tablero vacío no tiene infracciones de WCAG A y AA', async ({ page }) => {
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
  await llenarDeEtapas(page)

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

// Textos que el lector de pantalla puede leer sin que estén a la vista.
const textosOcultos = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('*')].flatMap((nodo) =>
      ['aria-label', 'aria-roledescription', 'aria-description', 'title']
        .map((atributo) => nodo.getAttribute(atributo))
        .concat(nodo.matches('[role="status"], .sr-only') ? nodo.textContent : null)
        .filter((texto) => !!texto),
    ),
  )

const EN_INGLES = /\b(close|dismiss|draggable|sortable|picked up|dragged|dropped|menu)\b/i
const IDENTIFICADOR = /[0-9a-f]{8}-[0-9a-f]{4}/i

test('los textos para el lector de pantalla van en español y sin identificadores', async ({
  page,
}) => {
  await page.goto('/kanban/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  // Los del Tablero de ejemplo llevan identificadores legibles; los creados, un UUID.
  await page.getByRole('button', { name: 'Añadir Pendiente a Por hacer' }).click()
  await page.getByRole('textbox', { name: 'Título del nuevo Pendiente en Por hacer' }).fill('Regar')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  const pendiente = page.getByRole('main').getByRole('listitem').first().getByRole('button').first()
  await expect(pendiente).toHaveAccessibleName(/^Regar/)
  const comprobar = async () => {
    for (const texto of await textosOcultos(page)) {
      expect(texto).not.toMatch(EN_INGLES)
      expect(texto).not.toMatch(IDENTIFICADOR)
    }
  }

  await comprobar()

  await pendiente.focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('status')).toContainText('cogido')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('status')).toContainText('sobre')
  await comprobar()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('status')).toContainText('sigue en')
  await comprobar()

  // Mientras el Pendiente vuelve a su sitio, Intro se ignora.
  await pendiente.focus()
  await expect(async () => {
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 500 })
  }).toPass()
  await comprobar()
})

test('con movimiento reducido no queda ninguna animación', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/kanban/')
  const pendiente = page.getByRole('main').getByRole('listitem').first().getByRole('button')
  const sinAnimaciones = async () => {
    const movimiento = await page.evaluate(() => {
      const dura = (valor: string) => valor.split(',').some((tiempo) => parseFloat(tiempo) > 0)
      return {
        activas: document.getAnimations().length,
        conMovimiento: [...document.querySelectorAll('*')]
          .filter((nodo) => {
            const estilo = getComputedStyle(nodo)
            return (
              dura(estilo.transitionDuration) ||
              dura(estilo.animationDuration) ||
              estilo.scrollBehavior === 'smooth'
            )
          })
          .map((nodo) => nodo.tagName),
      }
    })
    expect(movimiento).toEqual({ activas: 0, conMovimiento: [] })
  }

  await sinAnimaciones()

  await pendiente.last().focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menu')).toBeVisible()
  await sinAnimaciones()
  await page.keyboard.press('Escape')

  await pendiente.first().focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await sinAnimaciones()
  await page.keyboard.press('Escape')
  await expect(pendiente.first()).toBeFocused()

  await page.keyboard.press('Space')
  await expect(page.getByRole('status')).toContainText('cogido')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('status')).toContainText('sobre')
  await sinAnimaciones()
  await page.keyboard.press('Space')
  await expect(page.getByRole('status')).toContainText('movido')
  await sinAnimaciones()
})

test('el color de separador queda para los separadores', async ({ page }) => {
  // El pie lleva el único separador: su borde superior.
  const conLineaDecorativa = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((nodo) => {
          const estilo = getComputedStyle(nodo)
          const conBorde = ['Top', 'Right', 'Bottom', 'Left'].some(
            (lado) =>
              parseFloat(estilo[`border${lado}Width` as 'borderTopWidth']) > 0 &&
              estilo[`border${lado}Color` as 'borderTopColor'] === 'rgb(48, 54, 74)',
          )
          return conBorde && !nodo.matches('footer')
        })
        .map((nodo) => nodo.tagName),
    )
  const bordeDeControl = 'rgb(115, 123, 150)'

  await page.goto('/kanban/')
  await page.getByRole('main').getByRole('listitem').first().getByRole('button').first().click()
  const dialogo = page.getByRole('dialog', { name: 'Editar Pendiente' })
  await expect(dialogo).toBeVisible()

  expect(await conLineaDecorativa()).toEqual([])
  await expect(dialogo).toHaveCSS('border-top-color', bordeDeControl)
  await expect(dialogo.getByRole('textbox', { name: 'Título' })).toHaveCSS(
    'border-top-color',
    bordeDeControl,
  )
  await expect(dialogo.getByRole('textbox', { name: 'Nota' })).toHaveCSS(
    'border-top-color',
    bordeDeControl,
  )
})

for (const { nombre, proyecto, tamano } of ventanasEstrechas) {
  test.describe(nombre, () => {
    test.beforeEach(async ({ page }, info) => {
      test.skip(!info.project.name.endsWith(proyecto), 'Basta con un ancho por navegador')
      await page.setViewportSize(tamano)
    })

    const sinDesborde = async (page: Page) => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => {
        const { scrollWidth, clientWidth } = document.documentElement
        return { scrollWidth, clientWidth }
      })
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    }

    test('el Tablero de ejemplo se usa sin desbordar la página ni dejar de verse', async ({
      page,
    }) => {
      await page.goto('/kanban/')
      const pendiente = page.getByRole('main').getByRole('listitem').first()
      await expect(pendiente).toBeVisible()

      await sinDesborde(page)
      expect((await page.getByRole('main').boundingBox())!.height).toBeGreaterThan(100)
      expect(await infracciones(page)).toEqual([])
    })

    test('el Tablero vacío deja sitio a sus Etapas', async ({ page }) => {
      await abrirTableroVacio(page)

      await sinDesborde(page)
      expect((await page.getByRole('main').boundingBox())!.height).toBeGreaterThan(100)
    })
  })
}
