import { useEffect, useId, useRef, useState } from 'react'
import { useEtapaReceptora } from '@/arrastre/arrastre'
import type { CambiosDePendiente, Etapa as DatosEtapa } from '@/modelo/tablero'
import { CampoDePendiente } from './CampoDePendiente'
import { claveDeFoco } from './foco'
import { Pendiente } from './Pendiente'

type Props = {
  etapa: DatosEtapa
  etapas: DatosEtapa[]
  idAyuda: string
  onCrear: (titulo: string) => boolean
  onEditar: (pendienteId: string, cambios: CambiosDePendiente) => void
  onBorrar: (pendienteId: string) => void
  onSubir: (pendienteId: string) => void
  onBajar: (pendienteId: string) => void
  onMoverA: (pendienteId: string, etapaId: string) => void
  onAnunciar: (texto: string) => void
}

export function Etapa({
  etapa,
  etapas,
  idAyuda,
  onCrear,
  onEditar,
  onBorrar,
  onSubir,
  onBajar,
  onMoverA,
  onAnunciar,
}: Props) {
  const idEncabezado = useId()
  const total = etapa.pendientes.length
  const botonCrear = useRef<HTMLButtonElement>(null)
  const devolverFoco = useRef(false)
  const [creando, setCreando] = useState(false)
  const { ref, esDestino } = useEtapaReceptora(etapa.id)

  // El botón no existe hasta que el campo se cierra.
  useEffect(() => {
    if (creando || !devolverFoco.current) return
    devolverFoco.current = false
    botonCrear.current?.focus()
  }, [creando])

  function cerrarCampo(conFoco: boolean) {
    devolverFoco.current = conFoco
    setCreando(false)
  }

  return (
    <section
      ref={ref}
      aria-labelledby={idEncabezado}
      data-destino={esDestino || undefined}
      className="flex min-w-0 flex-col rounded-[10px] bg-muted p-2.5 data-destino:ring data-destino:ring-primary data-destino:ring-inset carriles:min-h-0 carriles:w-70 carriles:flex-none"
    >
      <header className="flex items-center gap-2">
        <h2
          id={idEncabezado}
          className="min-w-0 flex-1 text-[13px] font-semibold tracking-[.06em] wrap-anywhere text-muted-foreground uppercase"
        >
          {etapa.nombre}
        </h2>
        <span className="rounded-sm bg-card px-1.5 py-px font-mono text-xs">
          {total}
          <span className="sr-only"> {total === 1 ? 'Pendiente' : 'Pendientes'}</span>
        </span>
      </header>
      {creando ? (
        <CampoDePendiente nombreDeEtapa={etapa.nombre} onCrear={onCrear} onCerrar={cerrarCampo} />
      ) : (
        <button
          ref={botonCrear}
          data-foco={claveDeFoco({ tipo: 'crear', id: etapa.id })}
          type="button"
          onClick={() => setCreando(true)}
          aria-label={`Añadir Pendiente a ${etapa.nombre}`}
          className="mt-2 min-h-11 rounded-md px-2.5 text-left text-sm text-muted-foreground hover:bg-card hover:text-foreground carriles:min-h-8"
        >
          <span aria-hidden>+ </span>Añadir Pendiente
        </button>
      )}
      {total > 0 && (
        // El relleno deja sitio al contorno de foco, que el desplazamiento recortaría.
        <ol
          aria-labelledby={idEncabezado}
          className="-mx-1 mt-1 flex flex-col gap-1.5 p-1 carriles:min-h-0 carriles:flex-1 carriles:overflow-y-auto carriles:overscroll-contain"
        >
          {etapa.pendientes.map((pendiente, indice) => (
            <Pendiente
              key={pendiente.id}
              pendiente={pendiente}
              etapas={etapas}
              etapaId={etapa.id}
              indice={indice}
              idAyuda={idAyuda}
              puedeSubir={indice > 0}
              puedeBajar={indice < total - 1}
              onEditar={(cambios) => onEditar(pendiente.id, cambios)}
              onBorrar={() => onBorrar(pendiente.id)}
              onSubir={() => onSubir(pendiente.id)}
              onBajar={() => onBajar(pendiente.id)}
              onMoverA={(etapaId) => onMoverA(pendiente.id, etapaId)}
              onAnunciar={onAnunciar}
            />
          ))}
        </ol>
      )}
    </section>
  )
}
