import { useEffect, useId, useRef } from 'react'
import { AYUDA_DE_ARRASTRE, AYUDA_DE_NOMBRE } from '@/anuncios/anuncios'
import { ZonaDeArrastre } from '@/arrastre/arrastre'
import type { Foco } from '@/estado/useEstadoDeLaApp'
import {
  MAXIMO_DE_ETAPAS,
  type CambiosDePendiente,
  type Tablero as DatosTablero,
} from '@/modelo/tablero'
import { Etapa } from './Etapa'
import { claveDeFoco } from './foco'
import { NuevaEtapa } from './NuevaEtapa'

type Props = {
  tablero: DatosTablero
  foco: Foco | null
  onCrear: (etapaId: string, titulo: string) => boolean
  onEditar: (pendienteId: string, cambios: CambiosDePendiente) => void
  onBorrar: (pendienteId: string) => void
  onSubir: (pendienteId: string) => void
  onBajar: (pendienteId: string) => void
  onMoverA: (pendienteId: string, etapaId: string) => void
  onSoltar: (pendienteId: string, etapaId: string, indice: number) => void
  onDejar: (pendienteId: string) => void
  onAnadirEtapa: (nombre: string) => boolean
  onRenombrar: (etapaId: string, texto: string) => void
  onMoverEtapaIzquierda: (etapaId: string) => void
  onMoverEtapaDerecha: (etapaId: string) => void
  onQuitarEtapa: (etapaId: string) => void
  onAnunciar: (texto: string) => void
}

export function Tablero({
  tablero,
  foco,
  onCrear,
  onEditar,
  onBorrar,
  onSubir,
  onBajar,
  onMoverA,
  onSoltar,
  onDejar,
  onAnadirEtapa,
  onRenombrar,
  onMoverEtapaIzquierda,
  onMoverEtapaDerecha,
  onQuitarEtapa,
  onAnunciar,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const idAyuda = useId()
  const idAyudaDeNombre = useId()

  // El destino puede montarse en el mismo cambio que pide el foco: por eso va tras pintar.
  useEffect(() => {
    if (!foco) return
    // El hueco del arrastre es una copia inerte que repite la marca.
    const selector = `[data-foco="${CSS.escape(claveDeFoco(foco))}"]:not([inert] *)`
    contenedor.current?.querySelector<HTMLElement>(selector)?.focus()
  }, [foco])

  return (
    <ZonaDeArrastre
      tablero={tablero}
      onSoltar={onSoltar}
      onDejar={onDejar}
      onAnunciar={onAnunciar}
    >
      {(visible) => (
        <div
          ref={contenedor}
          className="flex flex-1 flex-col gap-2.5 px-4 pb-4 carriles:min-h-0 carriles:flex-row carriles:px-6"
        >
          <p id={idAyuda} hidden>
            {AYUDA_DE_ARRASTRE}
          </p>
          <p id={idAyudaDeNombre} hidden>
            {AYUDA_DE_NOMBRE}
          </p>
          {visible.etapas.map((etapa) => (
            <Etapa
              key={etapa.id}
              etapa={etapa}
              etapas={visible.etapas}
              idAyuda={idAyuda}
              idAyudaDeNombre={idAyudaDeNombre}
              onCrear={(titulo) => onCrear(etapa.id, titulo)}
              onEditar={onEditar}
              onBorrar={onBorrar}
              onSubir={onSubir}
              onBajar={onBajar}
              onMoverA={onMoverA}
              onRenombrar={(texto) => onRenombrar(etapa.id, texto)}
              onMoverIzquierda={() => onMoverEtapaIzquierda(etapa.id)}
              onMoverDerecha={() => onMoverEtapaDerecha(etapa.id)}
              onQuitar={() => onQuitarEtapa(etapa.id)}
              onAnunciar={onAnunciar}
            />
          ))}
          <NuevaEtapa llena={visible.etapas.length >= MAXIMO_DE_ETAPAS} onCrear={onAnadirEtapa} />
        </div>
      )}
    </ZonaDeArrastre>
  )
}
