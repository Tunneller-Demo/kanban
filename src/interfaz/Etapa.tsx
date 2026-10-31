import { useEffect, useId, useRef, useState } from 'react'
import type { CambiosDePendiente, Etapa as DatosEtapa } from '@/modelo/tablero'
import { CampoDePendiente } from './CampoDePendiente'
import { claveDeFoco } from './foco'
import { Pendiente } from './Pendiente'

type Props = {
  etapa: DatosEtapa
  onCrear: (titulo: string) => boolean
  onEditar: (pendienteId: string, cambios: CambiosDePendiente) => void
  onBorrar: (pendienteId: string) => void
  onAnunciar: (texto: string) => void
}

export function Etapa({ etapa, onCrear, onEditar, onBorrar, onAnunciar }: Props) {
  const idEncabezado = useId()
  const total = etapa.pendientes.length
  const botonCrear = useRef<HTMLButtonElement>(null)
  const devolverFoco = useRef(false)
  const [creando, setCreando] = useState(false)

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
      aria-labelledby={idEncabezado}
      className="flex min-w-0 flex-col rounded-[10px] bg-muted p-2.5 carriles:w-70 carriles:flex-none"
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
        <ol aria-labelledby={idEncabezado} className="mt-2 flex flex-col gap-1.5">
          {etapa.pendientes.map((pendiente) => (
            <Pendiente
              key={pendiente.id}
              pendiente={pendiente}
              onEditar={(cambios) => onEditar(pendiente.id, cambios)}
              onBorrar={() => onBorrar(pendiente.id)}
              onAnunciar={onAnunciar}
            />
          ))}
        </ol>
      )}
    </section>
  )
}
