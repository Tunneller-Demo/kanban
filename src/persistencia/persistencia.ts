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
  if (contenido === null) return { tipo: 'primera-visita' }

  const datos = analizar(contenido)
  return datos?.version === VERSION && esTablero(datos.tablero)
    ? { tipo: 'guardado', tablero: datos.tablero, ejemploIntacto: datos.ejemploIntacto === true }
    : { tipo: 'danado', contenido }
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

// Con el almacenamiento bloqueado no hay nada que rescatar: cuenta como primera visita.
function leer(): string | null {
  try {
    return localStorage.getItem(claveDeAlmacenamiento())
  } catch {
    return null
  }
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
