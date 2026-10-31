import { expect, test } from '@playwright/test'

test('muestra las tres Etapas de partida vacías', async ({ page }) => {
  await page.goto('/kanban/')

  await expect(page.getByRole('heading', { level: 1, name: 'Tablero de pendientes' })).toBeVisible()
  for (const nombre of ['Por hacer', 'En curso', 'Hecho']) {
    const etapa = page.getByRole('region', { name: nombre })
    await expect(etapa.getByRole('heading', { level: 2, name: nombre })).toBeVisible()
    await expect(etapa).toContainText('0 Pendientes')
  }
})

test('declara idioma, título y color del navegador', async ({ page }) => {
  await page.goto('/kanban/')

  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page).toHaveTitle('Tablero de pendientes')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111319')
})

test('carga todo bajo su ruta base, sin terceros ni errores', async ({ page, baseURL }) => {
  const peticiones: string[] = []
  const fallidas: string[] = []
  // El favicon llega con los metadatos; hasta entonces algunos navegadores lo piden en la raíz.
  const sinFavicon = (urls: string[]) => urls.filter((url) => !url.endsWith('/favicon.ico'))
  page.on('request', (peticion) => peticiones.push(peticion.url()))
  page.on('requestfailed', (peticion) => fallidas.push(peticion.url()))
  page.on('response', (respuesta) => {
    if (respuesta.status() >= 400) fallidas.push(respuesta.url())
  })

  await page.goto('/kanban/', { waitUntil: 'networkidle' })

  expect(peticiones.length).toBeGreaterThan(1)
  expect(sinFavicon(peticiones).filter((url) => !url.startsWith(`${baseURL}/kanban/`))).toEqual([])
  expect(sinFavicon(fallidas)).toEqual([])
})

test('usa las fuentes empaquetadas', async ({ page }) => {
  await page.goto('/kanban/')

  // WebKit empieza a pedir cada fuente al pintar: `document.fonts.ready` puede llegar antes.
  const cargadas = () =>
    page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replaceAll('"', '')),
    )

  await expect.poll(cargadas).toContain('Space Grotesk Variable')
  await expect.poll(cargadas).toContain('IBM Plex Mono')
})

test('se ve con Panel nocturno', async ({ page }) => {
  await page.goto('/kanban/')

  const etapa = page.getByRole('region', { name: 'Por hacer' })
  const nombre = etapa.getByRole('heading')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 19, 25)')
  await expect(etapa).toHaveCSS('background-color', 'rgb(24, 27, 36)')
  await expect(etapa).toHaveCSS('border-top-color', 'rgb(48, 54, 74)')
  await expect(nombre).toHaveCSS('text-transform', 'uppercase')
  await expect(nombre).toHaveCSS('font-size', '13px')
  await expect(etapa.getByText('0', { exact: false })).toHaveCSS('font-family', /IBM Plex Mono/)
})

test('marca el foco con el contorno del tema', async ({ page }) => {
  await page.goto('/kanban/')
  // Aún no hay controles lima: los campos se añaden para ver cómo se pinta el foco.
  await page.evaluate(() => {
    for (const clase of ['normal', 'bg-primary']) {
      const campo = document.createElement('input')
      campo.className = clase
      document.body.append(campo)
    }
  })

  const normal = page.locator('input.normal')
  await normal.focus()
  await expect(normal).toHaveCSS('outline-color', 'rgb(198, 242, 78)')
  await expect(normal).toHaveCSS('outline-style', 'solid')
  await expect(normal).toHaveCSS('outline-width', '2px')
  await expect(normal).toHaveCSS('outline-offset', '2px')

  const sobreLima = page.locator('input.bg-primary')
  await sobreLima.focus()
  await expect(sobreLima).toHaveCSS('outline-color', 'rgb(233, 236, 244)')
  await expect(sobreLima).toHaveCSS('outline-offset', '2px')
})
