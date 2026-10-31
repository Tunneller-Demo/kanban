// Modelo del Tablero: tipos y operaciones puras. No conoce React, el navegador ni dnd-kit.

const MAXIMO_DE_ETAPAS = 8
const LIMITE_NOMBRE = 30
export const LIMITE_TITULO = 120
export const LIMITE_NOTA = 2000

export const ETIQUETAS = ['rojo', 'naranja', 'amarillo', 'verde', 'azul', 'violeta'] as const

export type Etiqueta = (typeof ETIQUETAS)[number]

export type Pendiente = {
  id: string
  titulo: string
  nota?: string
  etiqueta?: Etiqueta
}

export type Etapa = {
  id: string
  nombre: string
  pendientes: Pendiente[]
}

export type Tablero = {
  etapas: Etapa[]
}

// `etiqueta: null` quita la Etiqueta; una nota en blanco quita la nota.
export type CambiosDePendiente = {
  titulo?: string
  nota?: string
  etiqueta?: Etiqueta | null
}

export type SitioDePendiente = {
  etapa: Etapa
  indice: number
  pendiente: Pendiente
}

export function tableroDePartida(): Tablero {
  return {
    etapas: [
      { id: 'por-hacer', nombre: 'Por hacer', pendientes: [] },
      { id: 'en-curso', nombre: 'En curso', pendientes: [] },
      { id: 'hecho', nombre: 'Hecho', pendientes: [] },
    ],
  }
}

// Si el título no vale o la Etapa no existe, devuelve el mismo Tablero.
export function crearPendiente(
  tablero: Tablero,
  etapaId: string,
  texto: string,
  id: string,
): Tablero {
  const titulo = texto.trim()
  if (!esTituloValido(titulo) || !tablero.etapas.some((etapa) => etapa.id === etapaId)) {
    return tablero
  }

  return {
    etapas: tablero.etapas.map((etapa) =>
      etapa.id === etapaId
        ? { ...etapa, pendientes: [{ id, titulo }, ...etapa.pendientes] }
        : etapa,
    ),
  }
}

// Si no cambia nada, algo no vale o el Pendiente no existe, devuelve el mismo Tablero.
export function editarPendiente(
  tablero: Tablero,
  pendienteId: string,
  cambios: CambiosDePendiente,
): Tablero {
  const actual = localizarPendiente(tablero, pendienteId)?.pendiente
  // La nota en blanco se quita, pero la que no cabe se rechaza aunque solo tenga espacios.
  if (!actual || (cambios.nota?.length ?? 0) > LIMITE_NOTA) return tablero

  const editado = aplicarCambios(actual, cambios)
  if (!esPendiente(editado) || esIgual(actual, editado)) return tablero

  return {
    etapas: tablero.etapas.map((etapa) => ({
      ...etapa,
      pendientes: etapa.pendientes.map((pendiente) =>
        pendiente.id === pendienteId ? editado : pendiente,
      ),
    })),
  }
}

// Si el Pendiente no existe, devuelve el mismo Tablero.
export function borrarPendiente(tablero: Tablero, pendienteId: string): Tablero {
  if (!localizarPendiente(tablero, pendienteId)) return tablero

  return {
    etapas: tablero.etapas.map((etapa) => ({
      ...etapa,
      pendientes: etapa.pendientes.filter((pendiente) => pendiente.id !== pendienteId),
    })),
  }
}

export function localizarPendiente(
  tablero: Tablero,
  pendienteId: string,
): SitioDePendiente | undefined {
  for (const etapa of tablero.etapas) {
    const indice = etapa.pendientes.findIndex((pendiente) => pendiente.id === pendienteId)
    if (indice !== -1) return { etapa, indice, pendiente: etapa.pendientes[indice] }
  }
}

export function esTablero(valor: unknown): valor is Tablero {
  if (!esObjeto(valor) || !Array.isArray(valor.etapas)) return false
  const { etapas } = valor as { etapas: unknown[] }
  if (etapas.length < 1 || etapas.length > MAXIMO_DE_ETAPAS || !etapas.every(esEtapa)) return false

  const pendientes = etapas.flatMap((etapa) => etapa.pendientes)
  return sinRepetidos(etapas) && sinRepetidos(pendientes)
}

function aplicarCambios(pendiente: Pendiente, cambios: CambiosDePendiente): Pendiente {
  const { id, titulo, nota, etiqueta } = { ...pendiente, ...cambios }

  return {
    id,
    titulo: titulo.trim(),
    ...(nota?.trim() && { nota }),
    ...(etiqueta && { etiqueta }),
  }
}

function esIgual(a: Pendiente, b: Pendiente): boolean {
  return a.titulo === b.titulo && a.nota === b.nota && a.etiqueta === b.etiqueta
}

function esTituloValido(titulo: string): boolean {
  return titulo.length > 0 && titulo.length <= LIMITE_TITULO
}

function esEtapa(valor: unknown): valor is Etapa {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.nombre === 'string' &&
    valor.nombre.trim().length > 0 &&
    valor.nombre.length <= LIMITE_NOMBRE &&
    Array.isArray(valor.pendientes) &&
    valor.pendientes.every(esPendiente)
  )
}

function esPendiente(valor: unknown): valor is Pendiente {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.titulo === 'string' &&
    valor.titulo === valor.titulo.trim() &&
    esTituloValido(valor.titulo) &&
    (valor.nota === undefined ||
      (typeof valor.nota === 'string' && valor.nota.length <= LIMITE_NOTA)) &&
    (valor.etiqueta === undefined || ETIQUETAS.includes(valor.etiqueta as Etiqueta))
  )
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

function sinRepetidos(elementos: { id: string }[]): boolean {
  return new Set(elementos.map((elemento) => elemento.id)).size === elementos.length
}
