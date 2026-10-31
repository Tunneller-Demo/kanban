import { ArrowDown, ArrowUp, EllipsisVertical } from 'lucide-react'
import { useId } from 'react'
import type { Etapa } from '@/modelo/tablero'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

type Props = {
  titulo: string
  etapas: Etapa[]
  etapaId: string
  puedeSubir: boolean
  puedeBajar: boolean
  onSubir: () => void
  onBajar: () => void
  onMoverA: (etapaId: string) => void
}

// La vía garantizada para mover: todo lo que se puede arrastrar se puede hacer desde aquí.
export function MenuDePendiente({
  titulo,
  etapas,
  etapaId,
  puedeSubir,
  puedeBajar,
  onSubir,
  onBajar,
  onMoverA,
}: Props) {
  const idMoverA = useId()

  return (
    // No modal: uno modal retendría el foco que pide el Estado al mover y ocultaría el Tablero
    // con aria-hidden pese a tener botones enfocables.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Mover "${titulo}"`}
        className="grid size-11 flex-none place-items-center rounded-r-md bg-card text-muted-foreground hover:text-foreground hover:brightness-125 carriles:size-8 carriles:pointer-coarse:size-11"
      >
        <EllipsisVertical aria-hidden className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!puedeSubir} onSelect={onSubir}>
          <ArrowUp aria-hidden className="size-4 flex-none" />
          Subir
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!puedeBajar} onSelect={onBajar}>
          <ArrowDown aria-hidden className="size-4 flex-none" />
          Bajar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup aria-labelledby={idMoverA}>
          <DropdownMenuLabel id={idMoverA}>Mover a</DropdownMenuLabel>
          {etapas.map((etapa) => (
            <DropdownMenuItem
              key={etapa.id}
              disabled={etapa.id === etapaId}
              onSelect={() => onMoverA(etapa.id)}
            >
              {etapa.nombre}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
