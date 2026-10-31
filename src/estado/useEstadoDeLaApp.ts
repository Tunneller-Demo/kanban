// Estado de la app: une el Modelo con la Persistencia, guarda tras cada cambio
// y mantiene el único «Deshacer» disponible.
import { useState } from 'react'
import {
  anuncioPendienteBorrado,
  anuncioPendienteCreado,
  anuncioPendienteRestaurado,
  anuncioTituloDemasiadoLargo,
  avisoPendienteBorrado,
} from '@/anuncios/anuncios'
import {
  borrarPendiente,
  crearPendiente,
  editarPendiente,
  LIMITE_TITULO,
  localizarPendiente,
  tableroDePartida,
  type CambiosDePendiente,
  type Tablero,
} from '@/modelo/tablero'
import { cargarTablero, guardarTablero } from '@/persistencia/persistencia'

// Cada petición es un objeto nuevo: repetir el mismo destino vuelve a llevar el foco allí.
export type Foco = { tipo: 'pendiente' | 'crear'; id: string }

// Cualquier cambio retira el aviso, así que `tablero` siempre es justo el estado anterior.
type Deshacer = {
  tablero: Tablero
  aviso: string
  anuncioAlDeshacer: string
  focoAlDeshacer: Foco
  focoAlCerrar: Foco
}

export function useEstadoDeLaApp() {
  const [carga] = useState(cargarTablero)
  const [tablero, setTablero] = useState(() =>
    carga.tipo === 'guardado' ? carga.tablero : tableroDePartida(),
  )
  const [anuncio, setAnuncio] = useState({ texto: '', orden: 0 })
  const [foco, setFoco] = useState<Foco | null>(null)
  const [deshacerDisponible, setDeshacerDisponible] = useState<Deshacer | null>(null)

  function aplicar(nuevo: Tablero) {
    setTablero(nuevo)
    setDeshacerDisponible(null)
    // Los datos dañados no se sobrescriben: el rescate llega antes que cualquier escritura.
    if (carga.tipo !== 'danado') guardarTablero(nuevo)
  }

  // El orden distingue dos anuncios con el mismo texto: si no, el segundo no se oiría.
  function anunciar(texto: string) {
    setAnuncio(({ orden }) => ({ texto, orden: orden + 1 }))
  }

  // Devuelve si se creó: el campo solo se vacía entonces.
  function crear(etapaId: string, texto: string): boolean {
    const nuevo = crearPendiente(tablero, etapaId, texto, crypto.randomUUID())
    if (nuevo === tablero) {
      const exceso = texto.trim().length - LIMITE_TITULO
      if (exceso > 0) anunciar(anuncioTituloDemasiadoLargo(exceso))
      return false
    }

    aplicar(nuevo)

    const etapa = nuevo.etapas.find((candidata) => candidata.id === etapaId)!
    anunciar(anuncioPendienteCreado(texto.trim(), etapa.nombre, etapa.pendientes.length))
    return true
  }

  function editar(pendienteId: string, cambios: CambiosDePendiente) {
    const nuevo = editarPendiente(tablero, pendienteId, cambios)
    if (nuevo !== tablero) aplicar(nuevo)
  }

  function borrar(pendienteId: string) {
    const sitio = localizarPendiente(tablero, pendienteId)
    if (!sitio) return

    const { etapa, indice, pendiente } = sitio
    const vecino = etapa.pendientes[indice + 1] ?? etapa.pendientes[indice - 1]
    const focoAlCerrar: Foco = vecino
      ? { tipo: 'pendiente', id: vecino.id }
      : { tipo: 'crear', id: etapa.id }

    aplicar(borrarPendiente(tablero, pendienteId))
    setDeshacerDisponible({
      tablero,
      aviso: avisoPendienteBorrado(pendiente.titulo),
      anuncioAlDeshacer: anuncioPendienteRestaurado(
        pendiente.titulo,
        etapa.nombre,
        indice + 1,
        etapa.pendientes.length,
      ),
      focoAlDeshacer: { tipo: 'pendiente', id: pendienteId },
      focoAlCerrar,
    })
    setFoco(focoAlCerrar)
    anunciar(anuncioPendienteBorrado(pendiente.titulo))
  }

  function deshacer() {
    if (!deshacerDisponible) return

    aplicar(deshacerDisponible.tablero)
    setFoco(deshacerDisponible.focoAlDeshacer)
    anunciar(deshacerDisponible.anuncioAlDeshacer)
  }

  function cerrarAviso() {
    if (!deshacerDisponible) return

    setDeshacerDisponible(null)
    setFoco({ ...deshacerDisponible.focoAlCerrar })
  }

  return {
    tablero,
    anuncio: anuncio.texto,
    ordenDeAnuncio: anuncio.orden,
    foco,
    avisoDeDeshacer: deshacerDisponible?.aviso ?? null,
    crear,
    editar,
    borrar,
    deshacer,
    cerrarAviso,
    anunciar,
  }
}
