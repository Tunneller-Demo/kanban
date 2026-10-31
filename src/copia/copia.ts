// Copia de seguridad: exporta un Tablero a texto y analiza un texto. No conoce el navegador.
import { esObjeto, esTablero, type Tablero } from '@/modelo/tablero'

const APP = 'tablero-de-pendientes'

export type MotivoDeRechazo = 'no-se-reconoce' | 'version-nueva' | 'danado'

type ResultadoDeAnalisis =
  | { tipo: 'valida'; tablero: Tablero }
  | { tipo: 'rechazada'; motivo: MotivoDeRechazo }

type Migracion = (tablero: unknown) => unknown

// Cada migración lleva el `tablero` de la versión `n`, su clave, a la versión `n + 1`.
type Formato = {
  version: number
  migraciones: Record<number, Migracion>
}

const FORMATO_ACTUAL: Formato = { version: 1, migraciones: {} }

export function exportarCopia(tablero: Tablero, ahora: Date): string {
  return JSON.stringify(
    {
      app: APP,
      version: FORMATO_ACTUAL.version,
      exportadoEn: ahora.toISOString(),
      tablero: {
        etapas: tablero.etapas.map(({ nombre, pendientes }) => ({
          nombre,
          // JSON.stringify omite las claves sin valor: `nota` y `etiqueta` solo salen si existen.
          pendientes: pendientes.map(({ titulo, nota, etiqueta }) => ({ titulo, nota, etiqueta })),
        })),
      },
    },
    null,
    2,
  )
}

export function nombreDeCopia(ahora: Date): string {
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${APP}-${ahora.getFullYear()}-${mes}-${dia}.json`
}

// `formato` solo cambia en las pruebas: aún no hay versiones anteriores que migrar.
export function analizarCopia(
  texto: string,
  generarId: () => string,
  formato = FORMATO_ACTUAL,
): ResultadoDeAnalisis {
  const datos = leerJson(texto)
  if (!esObjeto(datos) || datos.app !== APP) return rechazada('no-se-reconoce')

  const { version } = datos
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return rechazada('danado')
  }
  if (version > formato.version) return rechazada('version-nueva')

  const tablero = conIdentificadores(migrar(datos.tablero, version, formato), generarId)
  return esTablero(tablero) ? { tipo: 'valida', tablero } : rechazada('danado')
}

function rechazada(motivo: MotivoDeRechazo): ResultadoDeAnalisis {
  return { tipo: 'rechazada', motivo }
}

function leerJson(texto: string): unknown {
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

// Sin migración o si una falla devuelve null, que `esTablero` rechazará como dañado.
function migrar(tablero: unknown, version: number, formato: Formato): unknown {
  try {
    let migrado = tablero
    for (let actual = version; actual < formato.version; actual++) {
      migrado = formato.migraciones[actual](migrado)
    }
    return migrado
  } catch {
    return null
  }
}

// Copia solo los campos conocidos. Lo que no tenga la forma esperada se deja tal cual
// para que `esTablero`, la única definición de las reglas, sea quien lo rechace.
function conIdentificadores(tablero: unknown, generarId: () => string): unknown {
  if (!esObjeto(tablero) || !Array.isArray(tablero.etapas)) return tablero

  return {
    etapas: tablero.etapas.map((etapa: unknown) => {
      if (!esObjeto(etapa) || !Array.isArray(etapa.pendientes)) return etapa

      return {
        id: generarId(),
        nombre: etapa.nombre,
        pendientes: etapa.pendientes.map((pendiente: unknown) => {
          if (!esObjeto(pendiente)) return pendiente

          const { titulo, nota, etiqueta } = pendiente
          return {
            id: generarId(),
            titulo,
            ...(nota !== undefined && { nota }),
            ...(etiqueta !== undefined && { etiqueta }),
          }
        }),
      }
    }),
  }
}
