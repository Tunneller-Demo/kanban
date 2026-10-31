import AxeBuilder from '@axe-core/playwright'
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

const muchos = (cuantos: number) =>
  Array.from({ length: cuantos }, (_, indice) => `Pendiente ${indice + 1}`)

const etapa = (page: Page, nombre: string) => page.getByRole('region', { name: nombre })
const carrusel = (page: Page) => page.getByRole('main')
const tira = (page: Page) => page.getByRole('navigation', { name: 'Etapas' })
const pestana = (page: Page, nombre: string) =>
  tira(page).getByRole('button', { name: new RegExp(`^${nombre} \\d`) })
const pendiente = (page: Page, titulo: string) =>
  page.getByRole('button', { name: titulo, exact: true })

const anadirEtapas = async (page: Page, ...nombres: string[]) => {
  for (const nombre of nombres) {
    await page.getByRole('button', { name: 'Añadir Etapa' }).click()
    const campo = page.getByRole('textbox', { name: 'Nombre de la nueva Etapa' })
    await campo.fill(nombre)
    await campo.press('Enter')
  }
}

const moverA = async (page: Page, titulo: string, nombre: string) => {
  await page.getByRole('button', { name: `Mover "${titulo}"` }).click()
  await page.getByRole('menu').getByRole('menuitem', { name: nombre, exact: true }).click()
}

const sinDesbordeDePagina = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )

test('en escritorio no hay pestañas ni encaje', async ({ page }, info) => {
  test.skip(info.project.name.endsWith('movil'), 'Solo aplica a partir de 720 px')
  await page.goto('/kanban/')

  await expect(tira(page)).toBeHidden()
  await expect(carrusel(page)).toHaveCSS('scroll-snap-type', 'none')
})

test.describe('en estrecho', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(!info.project.name.endsWith('movil'), 'El carrusel solo existe en estrecho')
    await page.goto('/kanban/')
  })

  test.describe('carrusel', () => {
    test('encaja en cada Etapa, que ocupa cerca del 85 % y deja asomar la siguiente', async ({
      page,
    }) => {
      const ancho = page.viewportSize()!.width
      await expect(etapa(page, 'Por hacer')).toBeVisible()

      const area = (await etapa(page, 'Por hacer').boundingBox())!
      const siguiente = (await etapa(page, 'En curso').boundingBox())!

      expect(area.width / ancho).toBeCloseTo(0.85, 1)
      expect(siguiente.x).toBeLessThan(ancho)
      await expect(carrusel(page)).toHaveCSS('scroll-snap-type', /x mandatory/)
    })

    test('deslizar y soltar a medias acaba encajado en una Etapa', async ({ page }) => {
      await carrusel(page).evaluate((nodo) => nodo.scrollTo({ left: 200, behavior: 'instant' }))

      await expect(pestana(page, 'En curso')).toHaveAttribute('aria-current', 'true')
      await expect(etapa(page, 'En curso')).toBeInViewport({ ratio: 0.99 })
    })

    test('una Etapa larga se desplaza sola y su cabecera sigue a la vista', async ({
      page,
      browserName,
    }) => {
      await crear(page, 'Por hacer', ...muchos(24))
      const lista = etapa(page, 'Por hacer').getByRole('list')
      // El WebKit de Playwright en Windows no expone la propiedad.
      if (browserName !== 'webkit') await expect(lista).toHaveCSS('overscroll-behavior-y', 'contain')

      await lista.evaluate((nodo) => nodo.scrollTo({ top: nodo.scrollHeight }))

      await expect.poll(() => lista.evaluate((nodo) => nodo.scrollTop)).toBeGreaterThan(0)
      await expect(etapa(page, 'Por hacer').getByRole('heading')).toBeInViewport()
      await expect(pendiente(page, 'Pendiente 1')).toBeInViewport()
    })

    test('la lista deja pasar al carrusel el deslizamiento en horizontal', async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === 'webkit', 'El WebKit de Playwright en Windows no expone la propiedad')
      await crear(page, 'Por hacer', 'Comprar pan')

      await expect(etapa(page, 'Por hacer').getByRole('list')).toHaveCSS(
        'overscroll-behavior-x',
        'auto',
      )
    })

    test('el encaje se apaga mientras se arrastra y vuelve al soltar', async ({ page }) => {
      await crear(page, 'Por hacer', 'Comprar pan')
      await pendiente(page, 'Comprar pan').focus()

      await page.keyboard.press('Space')
      await expect(page.getByRole('status')).toHaveText(/cogido/)
      await expect(carrusel(page)).toHaveCSS('scroll-snap-type', 'none')

      await page.keyboard.press('Space')
      await expect(carrusel(page)).toHaveCSS('scroll-snap-type', /x mandatory/)
    })
  })

  test.describe('pestañas', () => {
    test('son navegación, no pestañas de ARIA: una por Etapa y la activa en lima', async ({
      page,
    }) => {
      await expect(tira(page).getByRole('button')).toHaveCount(3)
      await expect(page.getByRole('tablist')).toHaveCount(0)
      await expect(page.getByRole('tab')).toHaveCount(0)

      await expect(pestana(page, 'Por hacer')).toHaveAttribute('aria-current', 'true')
      await expect(pestana(page, 'Por hacer')).toHaveCSS('background-color', 'rgb(198, 242, 78)')
      await expect(pestana(page, 'En curso')).not.toHaveAttribute('aria-current', /.*/)
      await expect(pestana(page, 'En curso')).not.toHaveCSS('background-color', 'rgb(198, 242, 78)')
    })

    test('quedan bajo la cabecera de la app y por encima del Tablero', async ({ page }) => {
      const cabecera = (await page.getByRole('banner').boundingBox())!
      const pestanas = (await tira(page).boundingBox())!
      const tablero = (await carrusel(page).boundingBox())!

      expect(pestanas.y).toBeGreaterThanOrEqual(cabecera.y + cabecera.height - 1)
      expect(tablero.y).toBeGreaterThanOrEqual(pestanas.y + pestanas.height - 1)
    })

    test('muestran los Pendientes de cada Etapa en monoespaciada, al día', async ({ page }) => {
      await crear(page, 'En curso', 'Pagar', 'Cobrar')

      await expect(pestana(page, 'Por hacer')).toHaveAccessibleName('Por hacer 0 Pendientes')
      await expect(pestana(page, 'En curso')).toHaveAccessibleName('En curso 2 Pendientes')
      await expect(pestana(page, 'En curso').getByText('2')).toHaveCSS(
        'font-family',
        /IBM Plex Mono/,
      )
    })

    test('miden al menos 44 px de alto', async ({ page }) => {
      const area = (await pestana(page, 'Hecho').boundingBox())!

      expect(area.height).toBeGreaterThanOrEqual(44)
    })

    test('tocar una lleva a su Etapa', async ({ page }) => {
      await pestana(page, 'Hecho').click()

      await expect(etapa(page, 'Hecho')).toBeInViewport({ ratio: 0.99 })
      await expect(pestana(page, 'Hecho')).toHaveAttribute('aria-current', 'true')
      await expect(pestana(page, 'Por hacer')).not.toHaveAttribute('aria-current', /.*/)

      await pestana(page, 'En curso').click()

      await expect(etapa(page, 'En curso')).toBeInViewport({ ratio: 0.99 })
      await expect(pestana(page, 'En curso')).toHaveAttribute('aria-current', 'true')
    })

    test('deslizar el carrusel cambia la activa', async ({ page }) => {
      await etapa(page, 'Hecho').getByRole('heading').scrollIntoViewIfNeeded()

      await expect(pestana(page, 'Hecho')).toHaveAttribute('aria-current', 'true')
    })

    test('con 8 Etapas la activa siempre está a la vista, sin desbordar la página', async ({
      page,
    }) => {
      await anadirEtapas(page, 'Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava')
      await pestana(page, 'Por hacer').click()
      await expect(pestana(page, 'Por hacer')).toBeInViewport({ ratio: 0.99 })

      await pestana(page, 'Octava').click()

      await expect(etapa(page, 'Octava')).toBeInViewport({ ratio: 0.99 })
      await expect(pestana(page, 'Octava')).toHaveAttribute('aria-current', 'true')
      await expect(pestana(page, 'Octava')).toBeInViewport({ ratio: 0.99 })
      await sinDesbordeDePagina(page)
    })

    test('un nombre largo se recorta en la pestaña', async ({ page }) => {
      await anadirEtapas(page, 'a'.repeat(30))

      const area = (await pestana(page, 'a+').boundingBox())!

      expect(area.width).toBeLessThan(page.viewportSize()!.width)
    })

    test('al borrar la última Etapa, la activa pasa a la anterior', async ({ page }) => {
      await pestana(page, 'Hecho').click()
      await expect(pestana(page, 'Hecho')).toHaveAttribute('aria-current', 'true')

      await page.getByRole('button', { name: 'Menú de la Etapa Hecho' }).click()
      await page.getByRole('menuitem', { name: 'Borrar' }).click()

      await expect(tira(page).getByRole('button')).toHaveCount(2)
      await expect(pestana(page, 'En curso')).toHaveAttribute('aria-current', 'true')
      await expect(etapa(page, 'En curso')).toBeInViewport({ ratio: 0.99 })
    })

    test('con una sola Etapa, su pestaña es la activa', async ({ page }) => {
      for (const nombre of ['Hecho', 'En curso']) {
        await page.getByRole('button', { name: `Menú de la Etapa ${nombre}` }).click()
        await page.getByRole('menuitem', { name: 'Borrar' }).click()
      }

      await expect(tira(page).getByRole('button')).toHaveCount(1)
      await expect(pestana(page, 'Por hacer')).toHaveAttribute('aria-current', 'true')
      await expect(etapa(page, 'Por hacer')).toBeInViewport({ ratio: 0.99 })
    })

    test('al reordenar, la activa sigue a la Etapa movida', async ({ page }) => {
      await page.getByRole('button', { name: 'Menú de la Etapa Por hacer' }).click()
      await page.getByRole('menuitem', { name: 'Mover a la derecha' }).click()

      await expect(etapa(page, 'Por hacer')).toBeInViewport({ ratio: 0.99 })
      await expect(pestana(page, 'Por hacer')).toHaveAttribute('aria-current', 'true')

      await page.getByRole('button', { name: 'Menú de la Etapa Por hacer' }).click()
      await page.getByRole('menuitem', { name: 'Mover a la izquierda' }).click()

      await expect(etapa(page, 'Por hacer')).toBeInViewport({ ratio: 0.99 })
      await expect(pestana(page, 'Por hacer')).toHaveAttribute('aria-current', 'true')
    })

    test('durante un arrastre muestran la vista previa', async ({ page }) => {
      await crear(page, 'Por hacer', 'Comprar pan')
      await pendiente(page, 'Comprar pan').focus()

      await page.keyboard.press('Space')
      await expect(page.getByRole('status')).toHaveText(/cogido/)
      await page.keyboard.press('ArrowRight')

      await expect(pestana(page, 'En curso')).toHaveAccessibleName('En curso 1 Pendiente')
      await expect(pestana(page, 'Por hacer')).toHaveAccessibleName('Por hacer 0 Pendientes')
    })

    test('al ensanchar la ventana y volver a estrecho, sigue habiendo una activa', async ({
      page,
    }) => {
      const estrecho = page.viewportSize()!
      await pestana(page, 'Hecho').click()
      await expect(pestana(page, 'Hecho')).toHaveAttribute('aria-current', 'true')

      await page.setViewportSize({ width: 1400, height: estrecho.height })
      await expect(tira(page)).toBeHidden()
      await page.setViewportSize(estrecho)

      await expect(tira(page).locator('[aria-current="true"]')).toHaveCount(1)
    })

    test('no tienen infracciones de WCAG A y AA', async ({ page }) => {
      await pestana(page, 'En curso').click()
      await expect(pestana(page, 'En curso')).toHaveAttribute('aria-current', 'true')

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()

      expect(violations).toEqual([])
    })
  })

  test.describe('«Mover a»', () => {
    test('el carrusel viaja con el Pendiente, que sigue a la vista con el foco', async ({ page }) => {
      await crear(page, 'Por hacer', 'Comprar pan')

      await moverA(page, 'Comprar pan', 'Hecho')

      await expect(pendiente(page, 'Comprar pan')).toBeFocused()
      await expect(pendiente(page, 'Comprar pan')).toBeInViewport({ ratio: 0.99 })
      await expect(etapa(page, 'Hecho')).toBeInViewport({ ratio: 0.99 })
      await expect(pestana(page, 'Hecho')).toHaveAttribute('aria-current', 'true')
    })

    test('también hacia atrás y con el destino lleno de Pendientes', async ({ page }) => {
      await crear(page, 'Por hacer', ...muchos(24))
      await crear(page, 'Hecho', 'Comprar pan')

      await moverA(page, 'Comprar pan', 'Por hacer')

      await expect(pendiente(page, 'Comprar pan')).toBeFocused()
      await expect(pendiente(page, 'Comprar pan')).toBeInViewport({ ratio: 0.99 })
      await expect(pestana(page, 'Por hacer')).toHaveAttribute('aria-current', 'true')
    })
  })

  test('con teclado, un Pendiente llega hasta la tercera Etapa y el carrusel lo sigue', async ({
    page,
  }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await pendiente(page, 'Comprar pan').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('status')).toHaveText(/sobre En curso/)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('status')).toHaveText(/sobre Hecho/)
    await page.keyboard.press('Space')

    await expect(etapa(page, 'Hecho').getByRole('listitem')).toHaveText(['Comprar pan'])
    await expect(pendiente(page, 'Comprar pan')).toBeFocused()
    await expect(pendiente(page, 'Comprar pan')).toBeInViewport({ ratio: 0.99 })
    await expect(pestana(page, 'Hecho')).toHaveAttribute('aria-current', 'true')
  })

  test.describe('con movimiento reducido', () => {
    test('el carrusel salta sin deslizar', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })

      const posicion = await pestana(page, 'Hecho').evaluate((boton, selector) => {
        ;(boton as HTMLElement).click()
        return document.querySelector(selector)!.scrollLeft
      }, 'main')

      expect(posicion).toBeGreaterThan(0)
      await expect(carrusel(page)).toHaveCSS('scroll-behavior', 'auto')
      await expect(tira(page)).toHaveCSS('scroll-behavior', 'auto')
    })

    test('sin esa preferencia, el carrusel y las pestañas deslizan', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })

      await expect(carrusel(page)).toHaveCSS('scroll-behavior', 'smooth')
      await expect(tira(page)).toHaveCSS('scroll-behavior', 'smooth')
    })
  })

  test.describe('a 320 px', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 })
    })

    test('la página no se desplaza en horizontal, tampoco con 8 Etapas', async ({ page }) => {
      await sinDesbordeDePagina(page)

      await anadirEtapas(page, 'Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava')

      await sinDesbordeDePagina(page)
    })

    test('ni con el diálogo, ni con el menú abiertos', async ({ page }) => {
      await crear(page, 'Por hacer', 'Comprar pan')

      await pendiente(page, 'Comprar pan').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await sinDesbordeDePagina(page)
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)

      await page.getByRole('button', { name: 'Mover "Comprar pan"' }).click()
      await expect(page.getByRole('menu')).toBeVisible()
      await sinDesbordeDePagina(page)
    })
  })
})
