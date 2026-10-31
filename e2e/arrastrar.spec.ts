import { expect, test, type Locator, type Page } from '@playwright/test'

const crear = async (page: Page, etapa: string, ...titulos: string[]) => {
  await page.getByRole('button', { name: `Añadir Pendiente a ${etapa}` }).click()
  const campo = page.getByRole('textbox', { name: `Título del nuevo Pendiente en ${etapa}` })
  for (const titulo of titulos) {
    await campo.fill(titulo)
    await campo.press('Enter')
  }
  await campo.press('Escape')
}

const etapa = (page: Page, nombre: string) => page.getByRole('region', { name: nombre })

const pendientes = (page: Page, nombre: string) => etapa(page, nombre).getByRole('listitem')

const pendiente = (page: Page, titulo: string) =>
  page.getByRole('button', { name: titulo, exact: true })

// En estrecho, de la Etapa vecina solo asoma el borde.
const enVentana = (page: Page, x: number) =>
  Math.max(2, Math.min(x, page.viewportSize()!.width - 2))

const centro = async (elemento: Locator) => {
  const area = (await elemento.boundingBox())!
  return { x: enVentana(elemento.page(), area.x + area.width / 2), y: area.y + area.height / 2 }
}

const coger = async (page: Page, elemento: Locator) => {
  await elemento.scrollIntoViewIfNeeded()
  const { x, y } = await centro(elemento)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 3, y + 3)
  await page.mouse.move(x + 8, y + 8)
}

const fotogramas = (page: Page) =>
  page.evaluate(
    () => new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(listo))),
  )

// A pasos: dnd-kit mide las colisiones en cada movimiento, y lo hace al pintar el fotograma.
const llevar = async (page: Page, destino: { x: number; y: number }) => {
  await page.mouse.move(destino.x, destino.y, { steps: 12 })
  await fotogramas(page)
  await page.mouse.move(destino.x, destino.y + 1)
  await fotogramas(page)
}

const arrastrar = async (
  page: Page,
  elemento: Locator,
  destino: Locator,
  desfase = 0,
  punto?: { x: number; y: number },
) => {
  await coger(page, elemento)
  const { x, y } = punto ?? (await centro(destino))
  await llevar(page, { x, y: y + desfase })
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/kanban/')
})

test.describe('con ratón', () => {
  // En estrecho, para medir el Pendiente con el carrusel ya quieto.
  test.beforeEach(async ({ page }, info) => {
    if (info.project.name.endsWith('movil')) await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('reordena dentro de la Etapa, lo anuncia y el foco sigue al Pendiente', async ({ page }) => {
    await crear(page, 'Por hacer', 'Tercero', 'Segundo', 'Primero')

    await arrastrar(page, pendiente(page, 'Primero'), pendiente(page, 'Tercero'), 8)

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Segundo', 'Tercero', 'Primero'])
    await expect(page.getByRole('status')).toHaveText('"Primero" movido a Por hacer, posición 3 de 3')
    await expect(pendiente(page, 'Primero')).toBeFocused()
  })

  test('lleva un Pendiente a otra Etapa y sigue tras recargar', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')

    await arrastrar(page, pendiente(page, 'Comprar pan'), pendiente(page, 'Pagar'), -8)

    await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
    await expect(pendientes(page, 'En curso')).toHaveCount(2)
    await expect(pendientes(page, 'En curso')).toContainText(['Comprar pan'])
    await expect(page.getByRole('status')).toHaveText(/"Comprar pan" movido a En curso/)
    await expect(pendiente(page, 'Comprar pan')).toBeFocused()

    await page.reload()
    await expect(pendientes(page, 'En curso')).toContainText(['Comprar pan'])
  })

  test('sin animaciones el foco también sigue al Pendiente', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await crear(page, 'Por hacer', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')

    await arrastrar(page, pendiente(page, 'Comprar pan'), pendiente(page, 'Pagar'), -8)

    await expect(pendientes(page, 'En curso')).toHaveCount(2)
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)
    await expect(pendiente(page, 'Comprar pan')).toBeFocused()
  })

  test('sin animaciones sigue al puntero y soltar es instantáneo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await crear(page, 'Por hacer', 'Segundo', 'Primero')
    const inicio = (await pendiente(page, 'Primero').boundingBox())!
    const { x, y } = await centro(pendiente(page, 'Primero'))

    await coger(page, pendiente(page, 'Primero'))
    await llevar(page, { x, y: y + 40 })

    const arrastrado = page.locator('[data-dnd-dragging]')
    expect(Math.abs((await arrastrado.boundingBox())!.y - inicio.y - 40)).toBeLessThan(5)

    await page.mouse.up()

    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
    await expect(arrastrado).toHaveCount(0)
  })

  test('acepta una Etapa vacía como destino', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')

    await arrastrar(page, pendiente(page, 'Comprar pan'), etapa(page, 'En curso'))

    await expect(pendientes(page, 'En curso')).toHaveText(['Comprar pan'])
    await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
  })

  test('soltar en el vacío bajo la lista deja el Pendiente al final', async ({ page }) => {
    await crear(page, 'Por hacer', 'Tercero', 'Segundo', 'Primero')
    await crear(page, 'En curso', 'Pagar', 'Cobrar')
    await pendiente(page, 'Primero').scrollIntoViewIfNeeded()
    const area = (await etapa(page, 'Por hacer').boundingBox())!
    const fondo = (await pendiente(page, 'Primero').boundingBox())!.y + 140

    await arrastrar(page, pendiente(page, 'Segundo'), page.locator('main'), 0, {
      x: area.x + area.width / 2,
      y: fondo,
    })
    await expect(pendientes(page, 'Por hacer')).toHaveText(['Primero', 'Tercero', 'Segundo'])
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)

    // Más abajo: en estrecho, a la altura de la lista el fantasma aún la pisa y gana ella.
    const otra = (await etapa(page, 'En curso').boundingBox())!
    await arrastrar(page, pendiente(page, 'Tercero'), page.locator('main'), 0, {
      x: enVentana(page, otra.x + otra.width / 2),
      y: fondo + 60,
    })
    await expect(pendientes(page, 'En curso')).toHaveText(['Cobrar', 'Pagar', 'Tercero'])
  })

  test('soltar sobre la cabecera de otra Etapa deja el Pendiente arriba', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar', 'Cobrar')

    await arrastrar(page, pendiente(page, 'Comprar pan'), etapa(page, 'En curso').getByRole('heading'))

    await expect(pendientes(page, 'En curso')).toHaveText(['Comprar pan', 'Cobrar', 'Pagar'])
  })

  test('el foco no se roba a lo que se pulse durante la animación', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')

    await arrastrar(page, pendiente(page, 'Comprar pan'), pendiente(page, 'Pagar'), -8)
    await expect(pendiente(page, 'Comprar pan')).toBeFocused()
    await page.getByRole('button', { name: 'Añadir Pendiente a Hecho' }).focus()

    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)
    await fotogramas(page)
    await expect(page.getByRole('button', { name: 'Añadir Pendiente a Hecho' })).toBeFocused()
  })

  test('nada se guarda ni se retira «Deshacer» hasta soltar', async ({ page }) => {
    await crear(page, 'Por hacer', 'Regar', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')
    await pendiente(page, 'Comprar pan').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
    const deshacer = page.getByRole('contentinfo').getByRole('button', { name: 'Deshacer' })

    await coger(page, pendiente(page, 'Regar'))
    await llevar(page, await centro(pendiente(page, 'Pagar')))

    await expect(deshacer).toBeVisible()
    await page.reload()
    await expect(pendientes(page, 'Por hacer')).toHaveText(['Regar'])
  })

  test('un clic sigue abriendo el Pendiente', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')

    await pendiente(page, 'Comprar pan').click()

    await expect(page.getByRole('dialog', { name: 'Editar Pendiente' })).toBeVisible()
  })

  test('el botón «⋮» no arrastra', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')
    const menu = page.getByRole('button', { name: 'Mover "Comprar pan"' })

    await arrastrar(page, menu, pendiente(page, 'Pagar'))

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Comprar pan'])
    await expect(pendientes(page, 'En curso')).toHaveText(['Pagar'])
  })

  test('levantado se aclara con borde lima y sin inclinarse; deja un hueco discontinuo', async ({
    page,
  }) => {
    await crear(page, 'Por hacer', 'Regar', 'Comprar pan')

    await coger(page, pendiente(page, 'Comprar pan'))

    const levantado = page.locator('[data-dnd-dragging]')
    await expect(levantado).toHaveCSS('box-shadow', /rgb\(198, 242, 78\)/)
    await expect(levantado).toHaveCSS('rotate', 'none')
    await expect(levantado.getByRole('button', { name: 'Comprar pan', exact: true })).toHaveCSS(
      'background-color',
      'rgb(42, 48, 66)',
    )
    await expect(page.locator('[data-dnd-placeholder]')).toHaveCSS('outline-style', 'dashed')
    await expect(page.locator('[data-dnd-placeholder]')).toBeVisible()
  })

  test('marca la Etapa de destino con borde lima, también sobre sus Pendientes', async ({
    page,
  }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')
    const lima = /rgb\(198, 242, 78\)/

    await coger(page, pendiente(page, 'Comprar pan'))
    await expect(etapa(page, 'Por hacer')).toHaveCSS('box-shadow', lima)

    await llevar(page, await centro(pendiente(page, 'Pagar')))

    await expect(etapa(page, 'En curso')).toHaveCSS('box-shadow', lima)
    await expect(etapa(page, 'Por hacer')).toHaveCSS('box-shadow', 'none')
  })

  test('el Pendiente no deja seleccionar su texto', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')

    await expect(pendientes(page, 'Por hacer')).toHaveCSS('user-select', 'none')
  })

  test('una Etapa larga se desplaza sola al arrastrar', async ({ page, browserName }) => {
    const titulos = Array.from({ length: 24 }, (_, indice) => `Pendiente ${indice + 1}`)
    await crear(page, 'Por hacer', ...titulos)
    const lista = etapa(page, 'Por hacer').getByRole('list')
    // El WebKit de Playwright en Windows no expone la propiedad.
    if (browserName !== 'webkit') await expect(lista).toHaveCSS('overscroll-behavior-y', 'contain')

    await coger(page, pendiente(page, 'Pendiente 24'))
    const area = (await lista.boundingBox())!
    await llevar(page, { x: area.x + area.width / 2, y: area.y + area.height - 4 })

    await expect.poll(() => lista.evaluate((nodo) => nodo.scrollTop)).toBeGreaterThan(0)
  })
})

test.describe('con teclado', () => {
  test('Espacio coge, las flechas mueven y Espacio suelta', async ({ page }) => {
    await crear(page, 'Por hacer', 'Tercero', 'Segundo', 'Primero')
    await pendiente(page, 'Primero').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText('"Primero" cogido en Por hacer, posición 1 de 3')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('status')).toHaveText('"Primero" sobre Por hacer, posición 2 de 3')
    await page.keyboard.press('Space')

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Segundo', 'Primero', 'Tercero'])
    await expect(page.getByRole('status')).toHaveText('"Primero" movido a Por hacer, posición 2 de 3')
    await expect(pendiente(page, 'Primero')).toBeFocused()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('Intro suelta y no abre el Pendiente', async ({ page }) => {
    await crear(page, 'Por hacer', 'Segundo', 'Primero')
    await pendiente(page, 'Primero').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText('"Primero" cogido en Por hacer, posición 1 de 2')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('status')).toHaveText('"Primero" sobre Por hacer, posición 2 de 2')
    await page.keyboard.press('Enter')

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Segundo', 'Primero'])
    await expect(pendiente(page, 'Primero')).toBeFocused()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('las flechas llevan el Pendiente a otra Etapa', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')
    await pendiente(page, 'Comprar pan').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('status')).toHaveText(/sobre En curso/)
    await page.keyboard.press('Space')

    await expect(pendientes(page, 'Por hacer')).toHaveCount(0)
    await expect(pendientes(page, 'En curso')).toContainText(['Comprar pan'])
    await expect(page.getByRole('status')).toHaveText(/"Comprar pan" movido a En curso/)
    await expect(pendiente(page, 'Comprar pan')).toBeFocused()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('Escape cancela: nada cambia, el foco vuelve y lo anuncia', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')
    await pendiente(page, 'Comprar pan').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('status')).toHaveText(/sobre En curso/)
    await page.keyboard.press('Escape')

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Comprar pan'])
    await expect(pendientes(page, 'En curso')).toHaveText(['Pagar'])
    await expect(page.getByRole('status')).toHaveText(
      '"Comprar pan" sigue en Por hacer, posición 1 de 1',
    )
    await expect(pendiente(page, 'Comprar pan')).toBeFocused()
  })

  test('la flecha abajo sobre el último no lo mueve', async ({ page }) => {
    await crear(page, 'Por hacer', 'Segundo', 'Primero')
    await pendiente(page, 'Segundo').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowDown')
    await fotogramas(page)
    await page.keyboard.press('Space')

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Primero', 'Segundo'])
  })

  test('la flecha arriba sobre el primero no lo mueve', async ({ page }) => {
    await crear(page, 'Por hacer', 'Segundo', 'Primero')
    await pendiente(page, 'Primero').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowUp')
    await fotogramas(page)
    await page.keyboard.press('Space')

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Primero', 'Segundo'])
  })

  test('tras cancelar porque el Tablero cambia, las teclas vuelven a funcionar', async ({ page }) => {
    await crear(page, 'Por hacer', 'Regar', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')
    await pendiente(page, 'Comprar pan').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
    await pendiente(page, 'Regar').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('status')).toHaveText(/sobre En curso/)
    await page.getByRole('contentinfo').getByRole('button', { name: 'Deshacer' }).click()
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)

    await pendiente(page, 'Regar').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Editar Pendiente' })).toBeVisible()
  })

  test('si el Tablero cambia durante el arrastre, se cancela', async ({ page }) => {
    await crear(page, 'Por hacer', 'Regar', 'Comprar pan')
    await crear(page, 'En curso', 'Pagar')
    await pendiente(page, 'Comprar pan').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
    await pendiente(page, 'Regar').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('status')).toHaveText(/sobre En curso/)
    await page.getByRole('contentinfo').getByRole('button', { name: 'Deshacer' }).click()

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Comprar pan', 'Regar'])
    await expect(pendientes(page, 'En curso')).toHaveText(['Pagar'])
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)
  })

  test('mantener pulsada la tecla no coge ni abre el Pendiente', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await pendiente(page, 'Comprar pan').focus()
    const repetir = (code: string) =>
      page.evaluate((code) => {
        const opciones = { code, key: code === 'Space' ? ' ' : code, bubbles: true, cancelable: true }
        const evento = new KeyboardEvent('keydown', { ...opciones, repeat: true })
        return document.activeElement?.dispatchEvent(evento)
      }, code)

    await repetir('Space')
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)
    expect(await repetir('Enter')).toBe(false)
  })

  test('tras soltar se puede volver a coger el mismo Pendiente', async ({ page }) => {
    await crear(page, 'Por hacer', 'Segundo', 'Primero')
    await pendiente(page, 'Primero').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('status')).toHaveText(/sobre/)
    await page.keyboard.press('Space')
    await expect(pendientes(page, 'Por hacer')).toHaveText(['Segundo', 'Primero'])
    await expect(pendiente(page, 'Primero')).toBeFocused()
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText('"Primero" cogido en Por hacer, posición 2 de 2')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('status')).toHaveText(/sigue en/)
  })

  test('una tecla durante la animación de soltar no abre el Pendiente', async ({ page }) => {
    await crear(page, 'Por hacer', 'Segundo', 'Primero')
    await pendiente(page, 'Primero').focus()

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('status')).toHaveText(/sobre/)
    await page.keyboard.press('Space')
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')

    await expect(pendientes(page, 'Por hacer')).toHaveText(['Segundo', 'Primero'])
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)
    await expect(pendiente(page, 'Primero')).toBeFocused()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('Intro sobre un Pendiente en reposo abre el diálogo y nunca lo coge', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    await pendiente(page, 'Comprar pan').focus()

    await page.keyboard.press('Enter')

    await expect(page.getByRole('dialog', { name: 'Editar Pendiente' })).toBeVisible()
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0)
    await expect(page.getByRole('status')).toHaveText(/creado/)
  })

  test('todo se dice en español y por una sola región', async ({ page }) => {
    await crear(page, 'Por hacer', 'Comprar pan')
    const boton = pendiente(page, 'Comprar pan')
    await boton.focus()

    const descripcion = await boton.getAttribute('aria-describedby')
    await expect(page.locator(`[id="${descripcion}"]`)).toContainText('Espacio')
    await expect(boton).not.toHaveAttribute('aria-roledescription', /.*/)

    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toHaveText(/cogido/)
    await expect(page.locator('[role="status"]')).toHaveCount(1)
    await expect(boton).not.toHaveAttribute('aria-pressed', /.*/)
    await page.keyboard.press('Escape')
  })
})
