import { GripVertical } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useEtapaOrdenable } from '@/arrastre/arrastre'
import {
  MINIMO_DE_ETAPAS,
  type CambiosDePendiente,
  type Etapa as DatosEtapa,
} from '@/modelo/tablero'
import { CampoDePendiente } from './CampoDePendiente'
import { ContadorDePendientes } from './ContadorDePendientes'
import { claveDeFoco } from './foco'
import { MenuDeEtapa } from './MenuDeEtapa'
import { NombreDeEtapa } from './NombreDeEtapa'
import { Pendiente } from './Pendiente'

type Props = {
  etapa: DatosEtapa
  etapas: DatosEtapa[]
  idAyuda: string
  idAyudaDeNombre: string
  idAyudaDeAsa: string
  onCrear: (titulo: string) => boolean
  onEditar: (pendienteId: string, cambios: CambiosDePendiente) => void
  onBorrar: (pendienteId: string) => void
  onSubir: (pendienteId: string) => void
  onBajar: (pendienteId: string) => void
  onMoverA: (pendienteId: string, etapaId: string) => void
  onRenombrar: (texto: string) => void
  onMoverIzquierda: () => void
  onMoverDerecha: () => void
  onQuitar: () => void
  onAnunciar: (texto: string) => void
}

export function Etapa({
  etapa,
  etapas,
  idAyuda,
  idAyudaDeNombre,
  idAyudaDeAsa,
  onCrear,
  onEditar,
  onBorrar,
  onSubir,
  onBajar,
  onMoverA,
  onRenombrar,
  onMoverIzquierda,
  onMoverDerecha,
  onQuitar,
  onAnunciar,
}: Props) {
  const idEncabezado = useId()
  const total = etapa.pendientes.length
  const posicion = etapas.findIndex((candidata) => candidata.id === etapa.id)
  const botonCrear = useRef<HTMLButtonElement>(null)
  const devolverFoco = useRef(false)
  const [creando, setCreando] = useState(false)
  const { ref, handleRef, esDestino } = useEtapaOrdenable(etapa.id, posicion)

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
      className="flex min-h-0 w-[85vw] flex-none snap-center snap-always flex-col rounded-[10px] bg-muted p-2.5 data-destino:ring data-destino:ring-primary data-destino:ring-inset carriles:w-70"
    >
      <header className="flex items-center gap-2">
        <NombreDeEtapa
          id={idEncabezado}
          nombre={etapa.nombre}
          idAyuda={idAyudaDeNombre}
          onRenombrar={onRenombrar}
        />
        <ContadorDePendientes total={total} />
        <button
          ref={handleRef}
          data-foco={claveDeFoco({ tipo: 'asa', id: etapa.id })}
          type="button"
          aria-label={`Reordenar ${etapa.nombre}`}
          aria-describedby={idAyudaDeAsa}
          className="grid size-11 flex-none cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground carriles:size-8 carriles:pointer-coarse:size-11"
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
        <MenuDeEtapa
          nombre={etapa.nombre}
          totalDePendientes={total}
          claveDeFoco={claveDeFoco({ tipo: 'etapa', id: etapa.id })}
          puedeIrIzquierda={posicion > 0}
          puedeIrDerecha={posicion < etapas.length - 1}
          puedeBorrar={etapas.length > MINIMO_DE_ETAPAS}
          onMoverIzquierda={onMoverIzquierda}
          onMoverDerecha={onMoverDerecha}
          onBorrar={onQuitar}
        />
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
          className="-mx-1 mt-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain p-1"
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
