import { StickyNote } from 'lucide-react'
import { nombreDePendiente } from '@/anuncios/anuncios'
import type { CambiosDePendiente, Pendiente as DatosPendiente } from '@/modelo/tablero'
import { DialogoDePendiente } from './DialogoDePendiente'
import { colorDeEtiqueta, FormaDeEtiqueta } from './FormaDeEtiqueta'

type Props = {
  pendiente: DatosPendiente
  onEditar: (cambios: CambiosDePendiente) => void
  onAnunciar: (texto: string) => void
}

export function Pendiente({ pendiente, onEditar, onAnunciar }: Props) {
  const { titulo, nota, etiqueta } = pendiente

  return (
    <li>
      <DialogoDePendiente pendiente={pendiente} onEditar={onEditar} onAnunciar={onAnunciar}>
        <button
          type="button"
          aria-label={nombreDePendiente(pendiente)}
          className="relative flex w-full items-start gap-1.5 rounded-md bg-card px-2.5 py-2 text-left text-sm wrap-anywhere text-card-foreground hover:brightness-125"
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
    </li>
  )
}
