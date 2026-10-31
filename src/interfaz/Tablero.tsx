import { useEffect, useRef } from 'react'
import type { Foco } from '@/estado/useEstadoDeLaApp'
import type { CambiosDePendiente, Tablero as DatosTablero } from '@/modelo/tablero'
import { Etapa } from './Etapa'
import { claveDeFoco } from './foco'

type Props = {
  tablero: DatosTablero
  foco: Foco | null
  onCrear: (etapaId: string, titulo: string) => boolean
  onEditar: (pendienteId: string, cambios: CambiosDePendiente) => void
  onBorrar: (pendienteId: string) => void
  onSubir: (pendienteId: string) => void
  onBajar: (pendienteId: string) => void
  onMoverA: (pendienteId: string, etapaId: string) => void
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
  onAnunciar,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null)

  // El destino puede montarse en el mismo cambio que pide el foco: por eso va tras pintar.
  useEffect(() => {
    if (!foco) return
    const selector = `[data-foco="${CSS.escape(claveDeFoco(foco))}"]`
    contenedor.current?.querySelector<HTMLElement>(selector)?.focus()
  }, [foco])

  return (
    <div
      ref={contenedor}
      className="flex flex-1 flex-col gap-2.5 px-4 pb-4 carriles:flex-row carriles:px-6"
    >
      {tablero.etapas.map((etapa) => (
        <Etapa
          key={etapa.id}
          etapa={etapa}
          etapas={tablero.etapas}
          onCrear={(titulo) => onCrear(etapa.id, titulo)}
          onEditar={onEditar}
          onBorrar={onBorrar}
          onSubir={onSubir}
          onBajar={onBajar}
          onMoverA={onMoverA}
          onAnunciar={onAnunciar}
        />
      ))}
    </div>
  )
}
