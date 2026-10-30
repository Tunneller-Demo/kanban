import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PROTOTIPO desechable. `--host` en el script dev lo abre a los móviles de la red local.
export default defineConfig({ plugins: [react()] })
