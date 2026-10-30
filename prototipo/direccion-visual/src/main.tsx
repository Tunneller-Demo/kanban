import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/space-grotesk'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/dm-sans'
import './estilos.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
