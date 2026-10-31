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

const nombreDe = (page: Page, etapa: string) =>
  page.getByRole('button', { name: etapa, exact: true })

const campoDe = (page: Page, etapa: string) =>
  page.getByRole('textbox', { name: `Nombre de la Etapa ${etapa}` })

const empezarARenombrar = async (page: Page, etapa: string) => {
  await nombreDe(page, etapa).click()
  return campoDe(page, etapa)
}

const anadir = (page: Page) => page.getByRole('button', { name: 'Añadir Etapa' })
const campoNuevo = (page: Page) => page.getByRole('textbox', { name: 'Nombre de la nueva Etapa' })

const anadirEtapa = async (page: Page, nombre: string) => {
  await anadir(page).click()
  await campoNuevo(page).fill(nombre)
  await campoNuevo(page).press('Enter')
}

const hastaOcho = async (page: Page) => {
  for (const nombre of ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava']) {
    await anadirEtapa(page, nombre)
  }
}

const titulos = (page: Page) => page.getByRole('heading', { level: 2 })
const menuDe = (page: Page, etapa: string) =>
  page.getByRole('button', { name: `Menú de la Etapa ${etapa}` })
const opcion = (page: Page, nombre: string) => page.getByRole('menuitem', { name: nombre })

// Abre el menú y va hasta la opción solo con teclado, como lo haría quien no usa el ratón.
const elegirConTeclado = async (page: Page, etapa: string, nombre: string) => {
  await menuDe(page, etapa).focus()
  await page.keyboard.press('Enter')
  const destino = opcion(page, nombre)
  await expect(page.getByRole('menu')).toBeVisible()
  for (let intento = 0; intento < 4; intento++) {
    if (await destino.evaluate((nodo) => nodo === document.activeElement)) break
    await page.keyboard.press('ArrowDown')
  }
  await expect(destino).toBeFocused()
  await page.keyboard.press('Enter')
}

const confirmacion = (page: Page, etapa: string) =>
  page.getByRole('alertdialog', { name: `Borrar la Etapa ${etapa}` })

const pie = (page: Page) => page.getByRole('contentinfo')
const deshacer = (page: Page) => pie(page).getByRole('button', { name: 'Deshacer' })
const anuncio = (page: Page) => page.getByRole('status')

test.beforeEach(async ({ page }) => {
  await page.goto('/kanban/')
})

test.describe('renombrar', () => {
  test('Enter guarda, anuncia y devuelve el foco al nombre', async ({ page }) => {
    const campo = await empezarARenombrar(page, 'Hecho')
    await expect(campo).toBeFocused()
    await expect(campo).toHaveValue('Hecho')

    await campo.fill('Terminado')
    await campo.press('Enter')

    await expect(nombreDe(page, 'Terminado')).toBeFocused()
    await expect(anuncio(page)).toHaveText('Etapa renombrada a Terminado')
  })

  test('salir del campo guarda', async ({ page }) => {
    const campo = await empezarARenombrar(page, 'Hecho')
    await campo.fill('Terminado')

    await page.getByRole('heading', { level: 1 }).click()

    await expect(nombreDe(page, 'Terminado')).toBeVisible()
    await expect(campoDe(page, 'Hecho')).toHaveCount(0)
  })

  test('Escape cierra sin guardar y devuelve el foco', async ({ page }) => {
    const campo = await empezarARenombrar(page, 'Hecho')
    await campo.fill('Terminado')

    await campo.press('Escape')

    await expect(nombreDe(page, 'Hecho')).toBeFocused()
    await expect(nombreDe(page, 'Terminado')).toHaveCount(0)
  })

  test('el nombre vacío recupera el anterior y lo anuncia', async ({ page }) => {
    const campo = await empezarARenombrar(page, 'Hecho')
    await campo.fill('   ')

    await campo.press('Enter')

    await expect(nombreDe(page, 'Hecho')).toBeFocused()
    await expect(anuncio(page)).toHaveText('Nombre vacío. Se recupera "Hecho"')
  })

  test('más de 30 caracteres no guarda: el campo sigue abierto con el contador', async ({
    page,
  }) => {
    const region = page.getByRole('region', { name: 'Hecho' })
    const campo = await empezarARenombrar(page, 'Hecho')
    await campo.fill('a'.repeat(33))
    await expect(region).toContainText('33/30')

    await campo.press('Enter')

    await expect(campo).toBeFocused()
    await expect(campo).toHaveValue('a'.repeat(33))
    await expect(anuncio(page)).toHaveText('Nombre sin guardar. Sobran 3 caracteres')
  })

  test('salir con más de 30 caracteres conserva el nombre anterior y lo anuncia', async ({
    page,
  }) => {
    const campo = await empezarARenombrar(page, 'Hecho')
    await campo.fill('a'.repeat(33))

    await page.getByRole('heading', { level: 1 }).click()

    await expect(nombreDe(page, 'Hecho')).toBeVisible()
    await expect(anuncio(page)).toHaveText('Nombre sin guardar. Sobran 3 caracteres')
  })

  test('el nombre se ve en mayúsculas pequeñas', async ({ page }) => {
    await expect(nombreDe(page, 'Hecho')).toHaveCSS('text-transform', 'uppercase')
  })

  test('el nombre sigue tras recargar', async ({ page }) => {
    const campo = await empezarARenombrar(page, 'Hecho')
    await campo.fill('Terminado')
    await campo.press('Enter')
    await expect(nombreDe(page, 'Terminado')).toBeFocused()

    await page.reload()

    await expect(nombreDe(page, 'Terminado')).toBeVisible()
  })

  test('dos Etapas pueden llamarse igual', async ({ page }) => {
    const campo = await empezarARenombrar(page, 'Hecho')
    await campo.fill('Por hacer')
    await campo.press('Enter')

    await expect(titulos(page)).toHaveText([/Por hacer/i, /En curso/i, /Por hacer/i])
  })
})

test.describe('añadir', () => {
  test('la Etapa entra la última y el foco pasa a «Añadir Pendiente»', async ({ page }) => {
    await anadirEtapa(page, 'Revisión')

    await expect(titulos(page).last()).toHaveText(/Revisión/i)
    await expect(page.getByRole('button', { name: 'Añadir Pendiente a Revisión' })).toBeFocused()
    await expect(anuncio(page)).toHaveText('Etapa Revisión añadida, posición 4 de 4')
  })

  test('Escape no crea y devuelve el foco al botón', async ({ page }) => {
    await anadir(page).click()
    await campoNuevo(page).fill('Revisión')

    await campoNuevo(page).press('Escape')

    await expect(anadir(page)).toBeFocused()
    await expect(titulos(page)).toHaveCount(3)
  })

  test('salir del campo no crea', async ({ page }) => {
    await anadir(page).click()
    await campoNuevo(page).fill('Revisión')

    await page.getByRole('heading', { level: 1 }).click()

    await expect(anadir(page)).toBeVisible()
    await expect(titulos(page)).toHaveCount(3)
  })

  test('el nombre vacío no crea', async ({ page }) => {
    await anadir(page).click()

    await campoNuevo(page).press('Enter')

    await expect(titulos(page)).toHaveCount(3)
  })

  test('con 8 Etapas el botón explica el límite y se llega con desplazamiento', async ({
    page,
  }) => {
    await hastaOcho(page)
    await expect(titulos(page)).toHaveCount(8)

    await anadir(page).focus()
    await expect(anadir(page)).toBeInViewport()
    await expect(anadir(page)).toHaveAttribute('aria-disabled', 'true')
    await expect(anadir(page)).toHaveAccessibleDescription('El Tablero admite hasta 8 Etapas')
    await expect(page.getByText('El Tablero admite hasta 8 Etapas')).toBeVisible()

    await page.keyboard.press('Enter')

    await expect(campoNuevo(page)).toHaveCount(0)
    await expect(titulos(page)).toHaveCount(8)
  })

  test('con 8 Etapas solo se desplaza `main`, no la página', async ({ page }) => {
    await hastaOcho(page)
    const ventana = page.viewportSize()!

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      ventana.width,
    )
  })
})

test.describe('reordenar solo con teclado', () => {
  test('el foco sigue en el ⋮ de la Etapa y se anuncia la posición', async ({ page }) => {
    await elegirConTeclado(page, 'Hecho', 'Mover a la izquierda')

    await expect(titulos(page)).toHaveText([/Por hacer/i, /Hecho/i, /En curso/i])
    await expect(menuDe(page, 'Hecho')).toBeFocused()
    await expect(anuncio(page)).toHaveText('Etapa Hecho movida a la posición 2 de 3')

    await elegirConTeclado(page, 'Hecho', 'Mover a la derecha')

    await expect(titulos(page)).toHaveText([/Por hacer/i, /En curso/i, /Hecho/i])
    await expect(menuDe(page, 'Hecho')).toBeFocused()
    await expect(anuncio(page)).toHaveText('Etapa Hecho movida a la posición 3 de 3')
  })

  test('el orden sigue tras recargar', async ({ page }) => {
    await elegirConTeclado(page, 'Hecho', 'Mover a la izquierda')
    await expect(menuDe(page, 'Hecho')).toBeFocused()

    await page.reload()

    await expect(titulos(page)).toHaveText([/Por hacer/i, /Hecho/i, /En curso/i])
  })

  test('en los extremos la opción que no cabe está desactivada', async ({ page }) => {
    await menuDe(page, 'Por hacer').click()
    await expect(opcion(page, 'Mover a la izquierda')).toBeDisabled()
    await expect(opcion(page, 'Mover a la derecha')).toBeEnabled()
    await page.keyboard.press('Escape')

    await menuDe(page, 'Hecho').click()
    await expect(opcion(page, 'Mover a la izquierda')).toBeEnabled()
    await expect(opcion(page, 'Mover a la derecha')).toBeDisabled()
  })
})

test.describe('borrar', () => {
  test('una Etapa vacía se borra al momento y el foco va al ⋮ de la siguiente', async ({
    page,
  }) => {
    await elegirConTeclado(page, 'En curso', 'Borrar')

    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(titulos(page)).toHaveText([/Por hacer/i, /Hecho/i])
    await expect(menuDe(page, 'Hecho')).toBeFocused()
    await expect(pie(page)).toContainText('Etapa En curso borrada')
  })

  test('al borrar la última, el foco va al ⋮ de la anterior', async ({ page }) => {
    await elegirConTeclado(page, 'Hecho', 'Borrar')

    await expect(menuDe(page, 'En curso')).toBeFocused()
  })

  test('con Pendientes confirma: el foco entra en «Cancelar» y vuelve al ⋮', async ({ page }) => {
    await crear(page, 'Hecho', 'Regar', 'Comprar pan')

    await elegirConTeclado(page, 'Hecho', 'Borrar')

    const dialogo = confirmacion(page, 'Hecho')
    await expect(dialogo).toBeVisible()
    await expect(dialogo).toHaveAccessibleDescription(/2 Pendientes/)
    await expect(dialogo.getByRole('button', { name: 'Cancelar' })).toBeFocused()

    await page.keyboard.press('Enter')

    await expect(dialogo).toHaveCount(0)
    await expect(titulos(page)).toHaveCount(3)
    await expect(menuDe(page, 'Hecho')).toBeFocused()
  })

  test('Escape en la confirmación también devuelve el foco al ⋮', async ({ page }) => {
    await crear(page, 'Hecho', 'Regar')
    await elegirConTeclado(page, 'Hecho', 'Borrar')
    await expect(confirmacion(page, 'Hecho')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(confirmacion(page, 'Hecho')).toHaveCount(0)
    await expect(menuDe(page, 'Hecho')).toBeFocused()
  })

  test('confirmar borra y «Deshacer» restaura posición y Pendientes', async ({ page }) => {
    await crear(page, 'En curso', 'Regar', 'Comprar pan')
    await elegirConTeclado(page, 'En curso', 'Borrar')

    const dialogo = confirmacion(page, 'En curso')
    await dialogo.getByRole('button', { name: 'Borrar' }).focus()
    await page.keyboard.press('Enter')

    await expect(titulos(page)).toHaveText([/Por hacer/i, /Hecho/i])
    await expect(menuDe(page, 'Hecho')).toBeFocused()
    await expect(anuncio(page)).toHaveText(
      'Etapa En curso borrada con 2 Pendientes. Deshacer disponible',
    )

    await deshacer(page).focus()
    await page.keyboard.press('Enter')

    await expect(titulos(page)).toHaveText([/Por hacer/i, /En curso/i, /Hecho/i])
    await expect(menuDe(page, 'En curso')).toBeFocused()
    await expect(page.getByRole('region', { name: 'En curso' }).getByRole('listitem')).toHaveText(
      ['Comprar pan', 'Regar'],
    )
    await expect(anuncio(page)).toHaveText('Etapa En curso restaurada, posición 2 de 3')
    await expect(deshacer(page)).toHaveCount(0)
  })

  test('cerrar el aviso deja el foco donde quedó tras borrar', async ({ page }) => {
    await elegirConTeclado(page, 'En curso', 'Borrar')
    await expect(menuDe(page, 'Hecho')).toBeFocused()

    await pie(page).getByRole('button', { name: 'Cerrar aviso' }).click()

    await expect(deshacer(page)).toHaveCount(0)
    await expect(menuDe(page, 'Hecho')).toBeFocused()
  })

  test('con 1 Etapa «Borrar» se alcanza con flechas, explica el motivo y no cierra', async ({
    page,
  }) => {
    await elegirConTeclado(page, 'Hecho', 'Borrar')
    await expect(menuDe(page, 'En curso')).toBeFocused()
    await elegirConTeclado(page, 'En curso', 'Borrar')
    await expect(menuDe(page, 'Por hacer')).toBeFocused()

    await elegirConTeclado(page, 'Por hacer', 'Borrar')

    const borrar = opcion(page, 'Borrar')
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(borrar).toBeFocused()
    await expect(borrar).toHaveAttribute('aria-disabled', 'true')
    await expect(borrar).toHaveAccessibleDescription('El Tablero necesita al menos 1 Etapa')
    await expect(page.getByText('El Tablero necesita al menos 1 Etapa')).toBeVisible()
    await expect(titulos(page)).toHaveCount(1)
  })
})
