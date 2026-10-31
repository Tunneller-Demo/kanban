// Modelo del Tablero: tipos y operaciones puras. No conoce React, el navegador ni dnd-kit.

export const MINIMO_DE_ETAPAS = 1
export const MAXIMO_DE_ETAPAS = 8
export const LIMITE_NOMBRE = 30
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

// Las notas enseñan los gestos de la app: si cambia uno, cambia su nota.
export function tableroDeEjemplo(): Tablero {
  return {
    etapas: [
      {
        id: 'por-hacer',
        nombre: 'Por hacer',
        pendientes: [
          {
            id: 'ejemplo-arrastrame',
            titulo: 'Arrástrame a «En curso»',
            nota: 'Arrastra este Pendiente hasta la Etapa «En curso». En el móvil, mantén pulsado antes de moverlo. Si prefieres no arrastrar, usa «Mover a» en su menú.',
          },
          {
            id: 'ejemplo-abreme',
            titulo: 'Ábreme para ver mi nota',
            nota: 'Aquí puedes cambiar el título, escribir una nota y poner una Etiqueta de color. Los cambios se guardan solos.',
            etiqueta: 'azul',
          },
          {
            id: 'ejemplo-anade',
            titulo: 'Añade tu primer Pendiente',
            nota: 'Pulsa «Añadir Pendiente» en cualquier Etapa, escribe el título y pulsa Intro. Cuando acabes de probar, «Vaciar» deja el Tablero limpio y conserva las Etapas.',
          },
        ],
      },
      {
        id: 'en-curso',
        nombre: 'En curso',
        pendientes: [
          {
            id: 'ejemplo-adapta',
            titulo: 'Adapta las Etapas a tu forma de trabajar',
            nota: 'Pulsa el nombre de una Etapa para renombrarla. Añade otra con «Añadir Etapa», bórrala desde su menú y reordénalas arrastrando su asa.',
            etiqueta: 'violeta',
          },
          {
            id: 'ejemplo-guarda',
            titulo: 'Guarda una Copia de seguridad',
            nota: 'Tus datos se guardan solo en este navegador: si borras sus datos, se pierden. Para conservarlos, usa «Exportar» en la Copia de seguridad, al pie de la página.',
            etiqueta: 'naranja',
          },
        ],
      },
      {
        id: 'hecho',
        nombre: 'Hecho',
        pendientes: [
          {
            id: 'ejemplo-abrir',
            titulo: 'Abrir el Tablero por primera vez',
            etiqueta: 'verde',
          },
        ],
      },
    ],
  }
}

// Conserva las Etapas. Sin Pendientes que quitar, devuelve el mismo Tablero.
export function vaciarTablero(tablero: Tablero): Tablero {
  if (contarPendientes(tablero) === 0) return tablero

  return { etapas: tablero.etapas.map((etapa) => ({ ...etapa, pendientes: [] })) }
}

export function contarPendientes(tablero: Tablero): number {
  return tablero.etapas.reduce((total, etapa) => total + etapa.pendientes.length, 0)
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

// `indice` es la posición final en la Etapa de destino. La usan el menú y el arrastre.
// Si algo no vale o el Pendiente ya está ahí, devuelve el mismo Tablero.
export function moverPendiente(
  tablero: Tablero,
  pendienteId: string,
  etapaId: string,
  indice: number,
): Tablero {
  const origen = localizarPendiente(tablero, pendienteId)
  const destino = tablero.etapas.find((etapa) => etapa.id === etapaId)
  if (!origen || !destino) return tablero

  const mismaEtapa = origen.etapa === destino
  const ultimoIndice = destino.pendientes.length - (mismaEtapa ? 1 : 0)
  const enSuSitio = mismaEtapa && indice === origen.indice
  if (!Number.isInteger(indice) || indice < 0 || indice > ultimoIndice || enSuSitio) {
    return tablero
  }

  return {
    etapas: tablero.etapas.map((etapa) => {
      const pendientes = etapa.pendientes.filter((pendiente) => pendiente.id !== pendienteId)
      if (etapa === destino) pendientes.splice(indice, 0, origen.pendiente)
      return { ...etapa, pendientes }
    }),
  }
}

// El primero de su Etapa se queda donde está.
export function subirPendiente(tablero: Tablero, pendienteId: string): Tablero {
  return desplazarPendiente(tablero, pendienteId, -1)
}

// El último de su Etapa se queda donde está.
export function bajarPendiente(tablero: Tablero, pendienteId: string): Tablero {
  return desplazarPendiente(tablero, pendienteId, 1)
}

// Entra arriba de la Etapa. Hacia su propia Etapa no hace nada: no hay «Al principio».
export function moverPendienteAEtapa(
  tablero: Tablero,
  pendienteId: string,
  etapaId: string,
): Tablero {
  if (localizarPendiente(tablero, pendienteId)?.etapa.id === etapaId) return tablero

  return moverPendiente(tablero, pendienteId, etapaId, 0)
}

// Entra la última. Si el nombre no vale o ya hay 8 Etapas, devuelve el mismo Tablero.
export function crearEtapa(tablero: Tablero, texto: string, id: string): Tablero {
  const nombre = texto.trim()
  if (!esNombreValido(nombre) || tablero.etapas.length >= MAXIMO_DE_ETAPAS) return tablero

  return { etapas: [...tablero.etapas, { id, nombre, pendientes: [] }] }
}

// Si no cambia nada, el nombre no vale o la Etapa no existe, devuelve el mismo Tablero.
export function renombrarEtapa(tablero: Tablero, etapaId: string, texto: string): Tablero {
  const nombre = texto.trim()
  const actual = tablero.etapas.find((etapa) => etapa.id === etapaId)
  if (!actual || actual.nombre === nombre || !esNombreValido(nombre)) return tablero

  return {
    etapas: tablero.etapas.map((etapa) => (etapa === actual ? { ...etapa, nombre } : etapa)),
  }
}

// `indice` es la posición final en el Tablero.
// Si algo no vale o la Etapa ya está ahí, devuelve el mismo Tablero.
export function moverEtapa(tablero: Tablero, etapaId: string, indice: number): Tablero {
  const origen = tablero.etapas.findIndex((etapa) => etapa.id === etapaId)
  const fuera = !Number.isInteger(indice) || indice < 0 || indice >= tablero.etapas.length
  if (origen === -1 || fuera || indice === origen) return tablero

  const etapas = tablero.etapas.filter((etapa) => etapa.id !== etapaId)
  etapas.splice(indice, 0, tablero.etapas[origen])
  return { etapas }
}

// Se lleva sus Pendientes. Si es la única o no existe, devuelve el mismo Tablero.
export function borrarEtapa(tablero: Tablero, etapaId: string): Tablero {
  const etapas = tablero.etapas.filter((etapa) => etapa.id !== etapaId)
  if (etapas.length === tablero.etapas.length || etapas.length < MINIMO_DE_ETAPAS) return tablero

  return { etapas }
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

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

function desplazarPendiente(tablero: Tablero, pendienteId: string, salto: number): Tablero {
  const sitio = localizarPendiente(tablero, pendienteId)
  if (!sitio) return tablero

  return moverPendiente(tablero, pendienteId, sitio.etapa.id, sitio.indice + salto)
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

function esNombreValido(nombre: string): boolean {
  return nombre.trim().length > 0 && nombre.length <= LIMITE_NOMBRE
}

function esEtapa(valor: unknown): valor is Etapa {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.nombre === 'string' &&
    esNombreValido(valor.nombre) &&
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

function sinRepetidos(elementos: { id: string }[]): boolean {
  return new Set(elementos.map((elemento) => elemento.id)).size === elementos.length
}
