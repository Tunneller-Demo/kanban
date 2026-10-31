// Estado de la app: une el Modelo con la Persistencia y guarda tras cada cambio.
import { useState } from 'react'
import { anuncioPendienteCreado, anuncioTituloDemasiadoLargo } from '@/anuncios/anuncios'
import {
  crearPendiente,
  editarPendiente,
  LIMITE_TITULO,
  tableroDePartida,
  type CambiosDePendiente,
  type Tablero,
} from '@/modelo/tablero'
import { cargarTablero, guardarTablero } from '@/persistencia/persistencia'

export function useEstadoDeLaApp() {
  const [carga] = useState(cargarTablero)
  const [tablero, setTablero] = useState(() =>
    carga.tipo === 'guardado' ? carga.tablero : tableroDePartida(),
  )
  const [anuncio, setAnuncio] = useState('')

  function aplicar(nuevo: Tablero) {
    setTablero(nuevo)
    // Los datos dañados no se sobrescriben: el rescate llega antes que cualquier escritura.
    if (carga.tipo !== 'danado') guardarTablero(nuevo)
  }

  // Devuelve si se creó: el campo solo se vacía entonces.
  function crear(etapaId: string, texto: string): boolean {
    const nuevo = crearPendiente(tablero, etapaId, texto, crypto.randomUUID())
    if (nuevo === tablero) {
      const exceso = texto.trim().length - LIMITE_TITULO
      if (exceso > 0) setAnuncio(anuncioTituloDemasiadoLargo(exceso))
      return false
    }

    aplicar(nuevo)

    const etapa = nuevo.etapas.find((candidata) => candidata.id === etapaId)!
    setAnuncio(anuncioPendienteCreado(texto.trim(), etapa.nombre, etapa.pendientes.length))
    return true
  }

  function editar(pendienteId: string, cambios: CambiosDePendiente) {
    const nuevo = editarPendiente(tablero, pendienteId, cambios)
    if (nuevo !== tablero) aplicar(nuevo)
  }

  return { tablero, anuncio, crear, editar, anunciar: setAnuncio }
}
