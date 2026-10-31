import '@fontsource-variable/space-grotesk'
import '@fontsource/ibm-plex-mono/400.css'
import './tema.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
