// Estado de la app: une el Modelo con la Persistencia, guarda tras cada cambio
// y mantiene el único «Deshacer» disponible.
import { useState } from 'react'
import {
  anuncioEtapaBorrada,
  anuncioEtapaCreada,
  anuncioEtapaMovida,
  anuncioEtapaRenombrada,
  anuncioEtapaRestaurada,
  anuncioEtapaSinCrear,
  anuncioNombreRecuperado,
  anuncioNombreSinGuardar,
  anuncioPendienteBorrado,
  anuncioPendienteCreado,
  anuncioPendienteMovido,
  anuncioPendienteRestaurado,
  anuncioPendienteSinMover,
  anuncioTituloDemasiadoLargo,
  avisoEtapaBorrada,
  avisoPendienteBorrado,
} from '@/anuncios/anuncios'
import {
  bajarPendiente,
  borrarEtapa,
  borrarPendiente,
  crearEtapa,
  crearPendiente,
  editarPendiente,
  LIMITE_NOMBRE,
  LIMITE_TITULO,
  localizarPendiente,
  moverEtapa,
  moverPendiente,
  moverPendienteAEtapa,
  renombrarEtapa,
  subirPendiente,
  tableroDePartida,
  type CambiosDePendiente,
  type Tablero,
} from '@/modelo/tablero'
import { cargarTablero, guardarTablero } from '@/persistencia/persistencia'

// Cada petición es un objeto nuevo: repetir el mismo destino vuelve a llevar el foco allí.
export type Foco = { tipo: 'pendiente' | 'crear' | 'etapa'; id: string }

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

  function aplicarMovimiento(pendienteId: string, nuevo: Tablero) {
    if (nuevo === tablero) return

    aplicar(nuevo)

    const { etapa, indice, pendiente } = localizarPendiente(nuevo, pendienteId)!
    setFoco({ tipo: 'pendiente', id: pendienteId })
    anunciar(
      anuncioPendienteMovido(pendiente.titulo, etapa.nombre, indice + 1, etapa.pendientes.length),
    )
  }

  function subir(pendienteId: string) {
    aplicarMovimiento(pendienteId, subirPendiente(tablero, pendienteId))
  }

  function bajar(pendienteId: string) {
    aplicarMovimiento(pendienteId, bajarPendiente(tablero, pendienteId))
  }

  function moverA(pendienteId: string, etapaId: string) {
    aplicarMovimiento(pendienteId, moverPendienteAEtapa(tablero, pendienteId, etapaId))
  }

  function soltar(pendienteId: string, etapaId: string, indice: number) {
    const nuevo = moverPendiente(tablero, pendienteId, etapaId, indice)
    if (nuevo === tablero) dejar(pendienteId)
    else aplicarMovimiento(pendienteId, nuevo)
  }

  // Arrastre sin cambios: quien lo seguía necesita saber dónde quedó el Pendiente.
  function dejar(pendienteId: string) {
    const sitio = localizarPendiente(tablero, pendienteId)
    if (!sitio) return

    const { etapa, indice, pendiente } = sitio
    setFoco({ tipo: 'pendiente', id: pendienteId })
    anunciar(
      anuncioPendienteSinMover(pendiente.titulo, etapa.nombre, indice + 1, etapa.pendientes.length),
    )
  }

  // Devuelve si se creó: el campo solo se cierra entonces.
  function anadirEtapa(texto: string): boolean {
    const id = crypto.randomUUID()
    const nuevo = crearEtapa(tablero, texto, id)
    if (nuevo === tablero) {
      const exceso = texto.trim().length - LIMITE_NOMBRE
      if (exceso > 0) anunciar(anuncioEtapaSinCrear(exceso))
      return false
    }

    aplicar(nuevo)
    setFoco({ tipo: 'crear', id })
    anunciar(anuncioEtapaCreada(texto.trim(), nuevo.etapas.length))
    return true
  }

  function renombrar(etapaId: string, texto: string) {
    const nombre = texto.trim()
    const exceso = nombre.length - LIMITE_NOMBRE
    const anterior = tablero.etapas.find((etapa) => etapa.id === etapaId)?.nombre
    if (anterior === undefined) return

    if (!nombre) {
      anunciar(anuncioNombreRecuperado(anterior))
    } else if (exceso > 0) {
      anunciar(anuncioNombreSinGuardar(exceso))
    } else if (nombre !== anterior) {
      aplicar(renombrarEtapa(tablero, etapaId, nombre))
      anunciar(anuncioEtapaRenombrada(nombre))
    }
  }

  function desplazarEtapa(etapaId: string, salto: number) {
    const indice = tablero.etapas.findIndex((etapa) => etapa.id === etapaId)
    const nuevo = moverEtapa(tablero, etapaId, indice + salto)
    if (nuevo === tablero) return

    aplicar(nuevo)
    setFoco({ tipo: 'etapa', id: etapaId })
    anunciar(
      anuncioEtapaMovida(tablero.etapas[indice].nombre, indice + salto + 1, nuevo.etapas.length),
    )
  }

  function moverEtapaIzquierda(etapaId: string) {
    desplazarEtapa(etapaId, -1)
  }

  function moverEtapaDerecha(etapaId: string) {
    desplazarEtapa(etapaId, 1)
  }

  function quitarEtapa(etapaId: string) {
    const nuevo = borrarEtapa(tablero, etapaId)
    if (nuevo === tablero) return

    const indice = tablero.etapas.findIndex((etapa) => etapa.id === etapaId)
    const { nombre, pendientes } = tablero.etapas[indice]
    const vecina = tablero.etapas[indice + 1] ?? tablero.etapas[indice - 1]
    const focoAlCerrar: Foco = { tipo: 'etapa', id: vecina.id }

    aplicar(nuevo)
    setDeshacerDisponible({
      tablero,
      aviso: avisoEtapaBorrada(nombre),
      anuncioAlDeshacer: anuncioEtapaRestaurada(nombre, indice + 1, tablero.etapas.length),
      focoAlDeshacer: { tipo: 'etapa', id: etapaId },
      focoAlCerrar,
    })
    setFoco(focoAlCerrar)
    anunciar(anuncioEtapaBorrada(nombre, pendientes.length))
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
    subir,
    bajar,
    moverA,
    soltar,
    dejar,
    anadirEtapa,
    renombrar,
    moverEtapaIzquierda,
    moverEtapaDerecha,
    quitarEtapa,
    deshacer,
    cerrarAviso,
    anunciar,
  }
}
