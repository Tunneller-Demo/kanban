import { defineConfig, devices } from '@playwright/test'

const PUERTO = 4273
const NAVEGADORES = [
  ['chromium', devices['Desktop Chrome']],
  ['firefox', devices['Desktop Firefox']],
  ['webkit', devices['Desktop Safari']],
] as const
// Solo cambia el ancho: Firefox no emula móviles y el táctil real se comprueba a mano.
const ANCHOS = [
  ['escritorio', { width: 1280, height: 800 }],
  ['movil', { width: 390, height: 844 }],
] as const

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'line',
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: 'on-first-retry',
  },
  projects: NAVEGADORES.flatMap(([navegador, dispositivo]) =>
    ANCHOS.map(([ancho, viewport]) => ({
      name: `${navegador}-${ancho}`,
      use: { ...dispositivo, viewport },
    })),
  ),
  webServer: {
    command: `npm run build && npm run preview -- --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}/kanban/`,
  },
})
