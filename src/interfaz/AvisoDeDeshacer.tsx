import { X } from 'lucide-react'

type Props = {
  texto: string
  onDeshacer: () => void
  onCerrar: () => void
}

// Vive en el flujo del pie, sin flotar: así `main` encoge y el aviso nunca tapa el foco.
// Lo oye el lector de pantalla por la región de anuncios, no por aquí.
export function AvisoDeDeshacer({ texto, onDeshacer, onCerrar }: Props) {
  return (
    <div className="flex w-full items-center gap-2 rounded-md bg-card py-1 pl-3 pr-1 text-sm text-card-foreground">
      <p className="min-w-0 flex-1 wrap-anywhere">{texto}</p>
      <button
        type="button"
        onClick={onDeshacer}
        className="min-h-11 flex-none rounded-md px-2.5 font-medium text-primary hover:bg-muted carriles:min-h-8"
      >
        Deshacer
      </button>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar aviso"
        className="grid size-11 flex-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground carriles:size-8"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  )
}
