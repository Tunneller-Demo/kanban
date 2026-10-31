import { ArrowLeft, ArrowRight, EllipsisVertical, Trash2 } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { MOTIVO_SIN_BORRAR_ETAPA, textoDeConfirmacionDeEtapa } from '@/anuncios/anuncios'
import { estiloDeBoton, estiloDeTitulo } from './estilos'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

type Props = {
  nombre: string
  totalDePendientes: number
  claveDeFoco: string
  puedeIrIzquierda: boolean
  puedeIrDerecha: boolean
  puedeBorrar: boolean
  onMoverIzquierda: () => void
  onMoverDerecha: () => void
  onBorrar: () => void
}

export function MenuDeEtapa({
  nombre,
  totalDePendientes,
  claveDeFoco,
  puedeIrIzquierda,
  puedeIrDerecha,
  puedeBorrar,
  onMoverIzquierda,
  onMoverDerecha,
  onBorrar,
}: Props) {
  const idMotivo = useId()
  const disparador = useRef<HTMLButtonElement>(null)
  const [confirmando, setConfirmando] = useState(false)

  function alElegirBorrar(evento: Event) {
    if (!puedeBorrar) evento.preventDefault() // Deja el menú abierto, con el motivo a la vista.
    else if (totalDePendientes > 0) setConfirmando(true)
    else onBorrar()
  }

  return (
    <>
      {/* No modal por lo mismo que el menú del Pendiente: el foco lo pide el Estado al mover. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          ref={disparador}
          data-foco={claveDeFoco}
          aria-label={`Menú de la Etapa ${nombre}`}
          className="grid size-11 flex-none place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground carriles:size-8 carriles:pointer-coarse:size-11"
        >
          <EllipsisVertical aria-hidden className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          // Al confirmar, el foco ya está en el diálogo: volver al botón se lo quitaría.
          onCloseAutoFocus={(evento) => {
            if (confirmando) evento.preventDefault()
          }}
        >
          <DropdownMenuItem disabled={!puedeIrIzquierda} onSelect={onMoverIzquierda}>
            <ArrowLeft aria-hidden className="size-4 flex-none" />
            Mover a la izquierda
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!puedeIrDerecha} onSelect={onMoverDerecha}>
            <ArrowRight aria-hidden className="size-4 flex-none" />
            Mover a la derecha
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* aria-disabled y no disabled: el teclado debe poder llegar hasta el motivo. */}
          <DropdownMenuItem
            aria-disabled={!puedeBorrar || undefined}
            aria-describedby={puedeBorrar ? undefined : idMotivo}
            onSelect={alElegirBorrar}
            className="aria-disabled:cursor-default aria-disabled:text-muted-foreground"
          >
            <Trash2 aria-hidden className="size-4 flex-none" />
            Borrar
          </DropdownMenuItem>
          {!puedeBorrar && (
            <DropdownMenuLabel id={idMotivo} className="pt-1 text-xs font-normal">
              {MOTIVO_SIN_BORRAR_ETAPA}
            </DropdownMenuLabel>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogContent
          role="alertdialog"
          className="carriles:max-w-sm"
          onCloseAutoFocus={() => disparador.current?.focus()}
        >
          <DialogTitle className={`${estiloDeTitulo} wrap-anywhere`}>
            {`Borrar la Etapa ${nombre}`}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {textoDeConfirmacionDeEtapa(totalDePendientes)}
          </DialogDescription>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setConfirmando(false)} className={estiloDeBoton}>
              Cancelar
            </button>
            {/* Borrar desmonta el diálogo con su Etapa: el foco lo decide el Estado. */}
            <button
              type="button"
              onClick={onBorrar}
              className={`${estiloDeBoton} text-destructive`}
            >
              <Trash2 aria-hidden className="size-4" />
              Borrar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
