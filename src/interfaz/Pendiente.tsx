import { StickyNote } from 'lucide-react'
import { nombreDePendiente } from '@/anuncios/anuncios'
import type { CambiosDePendiente, Etapa, Pendiente as DatosPendiente } from '@/modelo/tablero'
import { DialogoDePendiente } from './DialogoDePendiente'
import { claveDeFoco } from './foco'
import { colorDeEtiqueta, FormaDeEtiqueta } from './FormaDeEtiqueta'
import { MenuDePendiente } from './MenuDePendiente'

type Props = {
  pendiente: DatosPendiente
  etapas: Etapa[]
  etapaId: string
  puedeSubir: boolean
  puedeBajar: boolean
  onEditar: (cambios: CambiosDePendiente) => void
  onBorrar: () => void
  onSubir: () => void
  onBajar: () => void
  onMoverA: (etapaId: string) => void
  onAnunciar: (texto: string) => void
}

export function Pendiente({
  pendiente,
  etapas,
  etapaId,
  puedeSubir,
  puedeBajar,
  onEditar,
  onBorrar,
  onSubir,
  onBajar,
  onMoverA,
  onAnunciar,
}: Props) {
  const { titulo, nota, etiqueta } = pendiente

  return (
    <li className="flex">
      <DialogoDePendiente
        pendiente={pendiente}
        onEditar={onEditar}
        onBorrar={onBorrar}
        onAnunciar={onAnunciar}
      >
        <button
          data-foco={claveDeFoco({ tipo: 'pendiente', id: pendiente.id })}
          type="button"
          aria-label={nombreDePendiente(pendiente)}
          className="relative flex min-w-0 flex-1 items-start gap-1.5 rounded-l-md bg-card px-2.5 py-2 text-left text-sm wrap-anywhere text-card-foreground hover:brightness-125"
        >
          {etiqueta && (
            <>
              <span
                aria-hidden
                data-barra-de-etiqueta
                className="absolute inset-y-0 left-0 w-[3px] rounded-l-md"
                style={{ backgroundColor: colorDeEtiqueta(etiqueta) }}
              />
              <FormaDeEtiqueta etiqueta={etiqueta} className="mt-1 size-3 flex-none" />
            </>
          )}
          <span className="min-w-0 flex-1">{titulo}</span>
          {nota && (
            <StickyNote
              aria-hidden
              data-icono-de-nota
              className="mt-0.5 size-3.5 flex-none text-muted-foreground"
            />
          )}
        </button>
      </DialogoDePendiente>
      <MenuDePendiente
        titulo={titulo}
        etapas={etapas}
        etapaId={etapaId}
        puedeSubir={puedeSubir}
        puedeBajar={puedeBajar}
        onSubir={onSubir}
        onBajar={onBajar}
        onMoverA={onMoverA}
      />
    </li>
  )
}
