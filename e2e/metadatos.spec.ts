import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

const DESCRIPCION =
  'Organiza tus Pendientes en un tablero visual y muévelos entre Etapas. Sin cuentas: tus datos se quedan en tu navegador'
const TARJETA = 'https://tunneller-demo.github.io/kanban/tarjeta.png'

const meta = (page: Page, nombre: string) =>
  page.locator(`meta[name="${nombre}"], meta[property="${nombre}"]`)

const enlace = async (page: Page, rel: string, tipo?: string) => {
  const selector = tipo ? `link[rel="${rel}"][type="${tipo}"]` : `link[rel="${rel}"]`
  return (await page.locator(selector).getAttribute('href')) ?? ''
}

// El ancho y el alto de un PNG van en su cabecera, a partir del byte 16.
const medidasDelPng = async (request: APIRequestContext, ruta: string) => {
  const respuesta = await request.get(ruta)
  expect(respuesta.status(), ruta).toBe(200)
  expect(respuesta.headers()['content-type']).toBe('image/png')
  const cuerpo = await respuesta.body()
  return { ancho: cuerpo.readUInt32BE(16), alto: cuerpo.readUInt32BE(20) }
}

test('al compartir el enlace se ven el título, la descripción y la tarjeta', async ({ page }) => {
  await page.goto('/kanban/')

  await expect(page).toHaveTitle('Tablero de pendientes')
  await expect(meta(page, 'description')).toHaveAttribute('content', DESCRIPCION)
  await expect(meta(page, 'og:title')).toHaveAttribute('content', 'Tablero de pendientes')
  await expect(meta(page, 'og:description')).toHaveAttribute('content', DESCRIPCION)
  await expect(meta(page, 'og:image')).toHaveAttribute('content', TARJETA)
  await expect(meta(page, 'twitter:card')).toHaveAttribute('content', 'summary_large_image')
})

test('la tarjeta mide 1200 × 630', async ({ request }) => {
  expect(await medidasDelPng(request, '/kanban/tarjeta.png')).toEqual({ ancho: 1200, alto: 630 })
})

test('el favicon es un SVG con PNG de respaldo e icono para iOS', async ({ page, request }) => {
  await page.goto('/kanban/')

  const svg = await request.get(await enlace(page, 'icon', 'image/svg+xml'))
  expect(svg.status()).toBe(200)
  expect(svg.headers()['content-type']).toContain('image/svg+xml')
  const icono = await svg.text()
  expect(icono).toContain('#111319')
  // Una vez por cada una de las tres barras.
  expect(icono.match(/#C6F24E/g)).toHaveLength(3)

  expect(await medidasDelPng(request, await enlace(page, 'icon', 'image/png'))).toEqual({
    ancho: 32,
    alto: 32,
  })
  expect(await medidasDelPng(request, await enlace(page, 'apple-touch-icon'))).toEqual({
    ancho: 180,
    alto: 180,
  })
})
