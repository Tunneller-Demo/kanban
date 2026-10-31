import { expect, test, type Page } from '@playwright/test'
import {
  abrirTableroVacio,
  llenarDeEtapas,
  problemasDeFocoAlRecorrer,
  tabularHasta,
  ventanasEstrechas,
} from './ayudas'

const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true })
const estado = (page: Page) => page.getByRole('status')

// La propia preparación es solo con teclado: una vez fuera el ratón, nada lo devuelve.
const abrirVacioConTeclado = async (page: Page) => {
  await page.goto('/kanban/')
  await tabularHasta(page, boton(page, 'Vaciar'))
  await page.keyboard.press('Enter')
  await expect(boton(page, 'Ver el Tablero de ejemplo')).toBeVisible()
}

const crear = async (page: Page, etapa: string, ...titulos: string[]) => {
  const abrir = boton(page, `Añadir Pendiente a ${etapa}`)
  const campo = page.getByRole('textbox', { name: `Título del nuevo Pendiente en ${etapa}` })
  await tabularHasta(page, abrir)
  await page.keyboard.press('Enter')
  for (const titulo of titulos) {
    await page.keyboard.type(titulo)
    await page.keyboard.press('Enter')
    await expect(campo).toBeFocused()
    await expect(campo).toHaveValue('')
  }
  await page.keyboard.press('Escape')
  await expect(abrir).toBeFocused()
}

const elegir = async (page: Page, opcion: string) => {
  const item = page.getByRole('menuitem', { name: opcion, exact: true })
  // Abrir con teclado ya enfoca la primera opción activa, que puede ser la buscada.
  await expect(page.getByRole('menuitem').and(page.locator(':focus'))).toBeVisible()
  const opciones = await page.getByRole('menuitem').count()
  for (let pulsacion = 0; pulsacion < opciones; pulsacion++) {
    if (await item.evaluate((nodo) => nodo === document.activeElement)) break
    await page.keyboard.press('ArrowDown')
  }
  await expect(item).toBeFocused()
  await page.keyboard.press('Enter')
}

test.describe('solo con teclado', () => {
  test.beforeEach(async ({ page }) => {
    await abrirVacioConTeclado(page)
  })

  test('crear deja el foco en el campo y cerrarlo, en el botón que lo abrió', async ({ page }) => {
    await crear(page, 'En curso', 'Comprar pan')

    await expect(estado(page)).toHaveText('"Comprar pan" creado en En curso, posición 1 de 1')
    await expect(boton(page, 'Comprar pan')).toBeVisible()
  })

  test('al mover, el foco sigue al Pendiente', async ({ page }) => {
    await crear(page, 'Por hacer', 'Segundo', 'Primero')

    await tabularHasta(page, boton(page, 'Mover "Primero"'))
    await page.keyboard.press('Enter')
    await elegir(page, 'Bajar')
    await expect(estado(page)).toHaveText('"Primero" movido a Por hacer, posición 2 de 2')
    await expect(boton(page, 'Primero')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(boton(page, 'Mover "Primero"')).toBeFocused()
    await page.keyboard.press('Enter')
    await elegir(page, 'En curso')
    await expect(estado(page)).toHaveText('"Primero" movido a En curso, posición 1 de 1')
    await expect(boton(page, 'Primero')).toBeFocused()
    await expect(boton(page, 'Primero')).toBeInViewport({ ratio: 0.99 })

    await page.keyboard.press('Space')
    await expect(estado(page)).toHaveText('"Primero" cogido en En curso, posición 1 de 1')
    await page.keyboard.press('ArrowRight')
    await expect(estado(page)).toHaveText(/sobre Hecho/)
    await page.keyboard.press('Enter')
    await expect(estado(page)).toHaveText('"Primero" movido a Hecho, posición 1 de 1')
    await expect(boton(page, 'Primero')).toBeFocused()
    await expect(boton(page, 'Primero')).toBeInViewport({ ratio: 0.99 })
  })

  test('al mover una Etapa, el foco la sigue', async ({ page }) => {
    // Sin deslizar: en estrecho, las flechas no responden si se coge durante el deslizamiento.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await tabularHasta(page, boton(page, 'Menú de la Etapa Hecho'))
    await page.keyboard.press('Enter')
    await elegir(page, 'Mover a la izquierda')
    await expect(estado(page)).toHaveText('Etapa Hecho movida a la posición 2 de 3')
    await expect(boton(page, 'Menú de la Etapa Hecho')).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await expect(boton(page, 'Reordenar Hecho')).toBeFocused()
    await page.keyboard.press('Space')
    await expect(estado(page)).toHaveText('Etapa Hecho cogida, posición 2 de 3')
    await page.keyboard.press('ArrowLeft')
    await expect(estado(page)).toHaveText(/Etapa Hecho sobre la posición 1 de 3/)
    await page.keyboard.press('Space')
    await expect(estado(page)).toHaveText('Etapa Hecho movida a la posición 1 de 3')
    await expect(boton(page, 'Reordenar Hecho')).toBeFocused()
  })

  test('cerrar un diálogo devuelve el foco a quien lo abrió', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')

    await tabularHasta(page, boton(page, 'Comprar pan'))
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Editar Pendiente' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(boton(page, 'Comprar pan')).toBeFocused()

    await tabularHasta(page, boton(page, 'Menú de la Etapa Por hacer'))
    await page.keyboard.press('Enter')
    await elegir(page, 'Borrar')
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(boton(page, 'Menú de la Etapa Por hacer')).toBeFocused()

    await tabularHasta(page, boton(page, 'Vaciar'))
    await page.keyboard.press('Enter')
    await expect(page.getByRole('alertdialog', { name: 'Vaciar el Tablero' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(boton(page, 'Vaciar')).toBeFocused()

    await tabularHasta(page, boton(page, 'Copia de seguridad'))
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Copia de seguridad' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(boton(page, 'Copia de seguridad')).toBeFocused()
  })

  test('borrar lleva el foco al siguiente, al anterior o a crear, y «Deshacer» lo recupera', async ({
    page,
  }) => {
    const borrar = async (titulo: string) => {
      await expect(boton(page, titulo)).toBeFocused()
      await page.keyboard.press('Enter')
      const dialogo = page.getByRole('dialog', { name: 'Editar Pendiente' })
      await tabularHasta(page, dialogo.getByRole('button', { name: 'Borrar' }))
      await page.keyboard.press('Enter')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(estado(page)).toHaveText(`"${titulo}" borrado. Deshacer disponible`)
    }
    await crear(page, 'Por hacer', 'Tercero', 'Segundo', 'Primero')
    await tabularHasta(page, boton(page, 'Segundo'))

    await borrar('Segundo')
    await expect(boton(page, 'Tercero')).toBeFocused()

    await borrar('Tercero')
    await expect(boton(page, 'Primero')).toBeFocused()

    await borrar('Primero')
    await expect(boton(page, 'Añadir Pendiente a Por hacer')).toBeFocused()

    await tabularHasta(page, boton(page, 'Deshacer'))
    await page.keyboard.press('Enter')
    await expect(boton(page, 'Primero')).toBeFocused()
  })
})

test.describe('el foco se ve entero', () => {
  const pendientes = (page: Page) =>
    page.getByRole('main').getByRole('listitem').first().getByRole('button')

  for (const { nombre, proyecto, tamano } of [
    { nombre: 'con el tamaño normal' },
    ...ventanasEstrechas,
  ]) {
    test.describe(nombre, () => {
      // Sin deslizar: se mide el elemento enfocado ya en su sitio.
      test.beforeEach(async ({ page }, info) => {
        test.skip(
          !!proyecto && !info.project.name.endsWith(proyecto),
          'Basta con un ancho por navegador',
        )
        await page.emulateMedia({ reducedMotion: 'reduce' })
        if (tamano) await page.setViewportSize(tamano)
      })

      test('en el Tablero, el diálogo, el menú y la confirmación', async ({ page }) => {
        await page.goto('/kanban/')
        await expect(boton(page, 'Vaciar')).toBeVisible()

        expect(await problemasDeFocoAlRecorrer(page)).toEqual([])

        await pendientes(page).first().focus()
        await page.keyboard.press('Enter')
        await expect(page.getByRole('dialog')).toBeVisible()
        expect(await problemasDeFocoAlRecorrer(page)).toEqual([])
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toHaveCount(0)

        await pendientes(page).last().focus()
        await page.keyboard.press('Enter')
        await expect(page.getByRole('menu')).toBeVisible()
        expect(await problemasDeFocoAlRecorrer(page, 'ArrowDown')).toEqual([])
        await page.keyboard.press('Escape')
        await expect(page.getByRole('menu')).toHaveCount(0)

        await boton(page, 'Menú de la Etapa Hecho').focus()
        await page.keyboard.press('Enter')
        await elegir(page, 'Borrar')
        await expect(page.getByRole('alertdialog')).toBeVisible()
        expect(await problemasDeFocoAlRecorrer(page)).toEqual([])
      })

      test('en el Tablero vacío', async ({ page }) => {
        await abrirTableroVacio(page)
        await page.reload()
        await expect(boton(page, 'Ver el Tablero de ejemplo')).toBeVisible()

        expect(await problemasDeFocoAlRecorrer(page)).toEqual([])
      })

      test('con el aviso de «Deshacer» a la vista', async ({ page }) => {
        await page.goto('/kanban/')
        await pendientes(page).first().click()
        await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
        await expect(boton(page, 'Deshacer')).toBeInViewport()

        expect(await problemasDeFocoAlRecorrer(page)).toEqual([])
      })

      test('en el menú de mover con 8 Etapas', async ({ page }) => {
        await abrirTableroVacio(page)
        await llenarDeEtapas(page)
        await boton(page, 'Añadir Pendiente a Por hacer').click()
        await page.keyboard.type('Comprar pan')
        await page.keyboard.press('Enter')
        await page.keyboard.press('Escape')

        await tabularHasta(page, boton(page, 'Mover "Comprar pan"'))
        await page.keyboard.press('Enter')
        await expect(page.getByRole('menu')).toBeVisible()
        expect(await problemasDeFocoAlRecorrer(page, 'ArrowDown')).toEqual([])
      })
    })
  }
})
