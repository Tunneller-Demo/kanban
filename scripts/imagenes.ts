// Rehace los PNG de `public/` y la captura del README desde la app compilada: `npm run imagenes`.
import { readFile } from 'node:fs/promises'
import { chromium, type Browser } from '@playwright/test'
import { build, preview } from 'vite'

const PUERTO = 4274
const VENTANA = { width: 1280, height: 800 }
const TARJETA = { width: 1200, height: 630 }

const capturarElTablero = async (navegador: Browser, url: string) => {
  const pagina = await navegador.newPage({ viewport: VENTANA, deviceScaleFactor: 2 })
  await pagina.goto(url)
  await pagina.getByRole('region', { name: 'Hecho' }).getByRole('listitem').waitFor()
  await pagina.evaluate(() => document.fonts.ready)
  const captura = await pagina.screenshot({ path: 'docs/captura.png' })
  await pagina.close()
  return captura
}

// Se monta sobre la propia app para que la tarjeta use sus textos y sus fuentes ya cargadas.
const crearLaTarjeta = async (navegador: Browser, url: string, captura: Buffer) => {
  const pagina = await navegador.newPage({ viewport: TARJETA })
  await pagina.goto(url)
  await pagina.evaluate(() => document.fonts.ready)
  await pagina.evaluate(
    ({ titulo, imagen }) => {
      const frase = document.querySelector('meta[name="description"]')?.getAttribute('content')
      document.body.innerHTML = `
        <main style="box-sizing: border-box; height: 100vh; overflow: hidden; padding: 52px 64px 0">
          <h1 style="margin: 0; font-size: 60px; font-weight: 700; line-height: 1.1">${titulo}</h1>
          <p style="margin: 14px 0 30px; font-size: 26px; line-height: 1.35; color: var(--muted-foreground)">${frase}</p>
          <img src="data:image/png;base64,${imagen}" alt="" style="display: block; width: 100%;
            border: 1px solid var(--border); border-radius: 12px 12px 0 0" />
        </main>`
      return document.querySelector('img')?.decode()
    },
    { titulo: await pagina.title(), imagen: captura.toString('base64') },
  )
  await pagina.screenshot({ path: 'public/tarjeta.png' })
  await pagina.close()
}

const rasterizarElFavicon = async (navegador: Browser) => {
  const svg = await readFile('public/favicon.svg', 'utf8')
  const iconos = [
    { lado: 32, ruta: 'public/favicon.png' },
    { lado: 180, ruta: 'public/apple-touch-icon.png' },
  ]
  for (const { lado, ruta } of iconos) {
    const pagina = await navegador.newPage({ viewport: { width: lado, height: lado } })
    await pagina.setContent(`<body style="margin: 0">${svg}</body>`)
    await pagina.screenshot({ path: ruta })
    await pagina.close()
  }
}

await build()
const servidor = await preview({ preview: { port: PUERTO, strictPort: true } })
const navegador = await chromium.launch()
const url = `http://localhost:${PUERTO}/kanban/`

await crearLaTarjeta(navegador, url, await capturarElTablero(navegador, url))
await rasterizarElFavicon(navegador)

await navegador.close()
await servidor.close()
