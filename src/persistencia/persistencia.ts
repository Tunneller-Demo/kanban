// Persistencia: oculta el almacenamiento del navegador al resto de la app.
import { esTablero, type Tablero } from '@/modelo/tablero'
import { claveDeAlmacenamiento } from './clave'

const VERSION = 1

export type Carga =
  | { tipo: 'primera-visita' }
  | { tipo: 'guardado'; tablero: Tablero; ejemploIntacto: boolean }
  | { tipo: 'danado'; contenido: string }

export type ResultadoDeGuardar = 'guardado' | 'fallo'

export function cargarTablero(): Carga {
  const contenido = leer()
  return contenido === null ? { tipo: 'primera-visita' } : interpretar(contenido)
}

export function guardarTablero(tablero: Tablero, ejemploIntacto: boolean): ResultadoDeGuardar {
  try {
    localStorage.setItem(
      claveDeAlmacenamiento(),
      JSON.stringify({ version: VERSION, tablero, ejemploIntacto }),
    )
    return 'guardado'
  } catch {
    return 'fallo'
  }
}

// El navegador solo lanza `storage` en las demás pestañas. Lo que no se puede mostrar
// (un borrado, datos dañados, otra versión) se ignora: la pestaña sigue con lo que tiene.
export function escucharOtrasPestanas(
  avisar: (guardado: Extract<Carga, { tipo: 'guardado' }>) => void,
): () => void {
  function alCambiar({ key, newValue }: StorageEvent) {
    if (key !== claveDeAlmacenamiento() || newValue === null) return

    const carga = interpretar(newValue)
    if (carga.tipo === 'guardado') avisar(carga)
  }

  window.addEventListener('storage', alCambiar)
  return () => window.removeEventListener('storage', alCambiar)
}

// Con el almacenamiento bloqueado no hay nada que rescatar: cuenta como primera visita.
function leer(): string | null {
  try {
    return localStorage.getItem(claveDeAlmacenamiento())
  } catch {
    return null
  }
}

function interpretar(contenido: string): Carga {
  const datos = analizar(contenido)
  return datos?.version === VERSION && esTablero(datos.tablero)
    ? { tipo: 'guardado', tablero: datos.tablero, ejemploIntacto: datos.ejemploIntacto === true }
    : { tipo: 'danado', contenido }
}

function analizar(
  contenido: string,
): { version?: unknown; tablero?: unknown; ejemploIntacto?: unknown } | null {
  try {
    return JSON.parse(contenido)
  } catch {
    return null
  }
}
