import { Eraser } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { MOTIVO_SIN_VACIAR, textoDeConfirmacionDeVaciar } from '@/anuncios/anuncios'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'

type Props = {
  totalDePendientes: number
  ejemploIntacto: boolean
  onVaciar: () => void
}

const estiloDeBoton =
  'flex min-h-11 items-center gap-1.5 rounded-md border border-input px-2.5 text-sm hover:bg-muted carriles:min-h-8'

export function Vaciar({ totalDePendientes, ejemploIntacto, onVaciar }: Props) {
  const idMotivo = useId()
  const boton = useRef<HTMLButtonElement>(null)
  const vaciado = useRef(false)
  const [confirmando, setConfirmando] = useState(false)
  const vacio = totalDePendientes === 0

  function alPulsar() {
    if (vacio) return
    if (ejemploIntacto) onVaciar()
    else setConfirmando(true)
  }

  function alConfirmar() {
    vaciado.current = true
    setConfirmando(false)
  }

  return (
    <>
      {/* aria-disabled y no disabled: el teclado debe poder llegar hasta el motivo. */}
      <button
        ref={boton}
        type="button"
        onClick={alPulsar}
        aria-disabled={vacio || undefined}
        aria-describedby={vacio ? idMotivo : undefined}
        title={vacio ? MOTIVO_SIN_VACIAR : undefined}
        className="flex min-h-11 flex-none items-center gap-1.5 rounded-md px-2.5 text-sm font-normal text-muted-foreground not-aria-disabled:hover:bg-muted not-aria-disabled:hover:text-foreground aria-disabled:cursor-default carriles:min-h-8"
      >
        <Eraser aria-hidden className="size-4 flex-none" />
        Vaciar
      </button>
      <p id={idMotivo} hidden>
        {MOTIVO_SIN_VACIAR}
      </p>
      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogContent
          role="alertdialog"
          className="carriles:max-w-sm"
          // Vaciar se hace aquí, ya cerrado: si no, el diálogo se llevaría el foco del Estado.
          onCloseAutoFocus={(evento) => {
            evento.preventDefault()
            if (vaciado.current) {
              vaciado.current = false
              onVaciar()
            } else {
              boton.current?.focus()
            }
          }}
        >
          <DialogTitle className="flex min-h-7 items-center pr-10 text-[15px] font-semibold">
            Vaciar el Tablero
          </DialogTitle>
          <DialogDescription className="text-sm">
            {textoDeConfirmacionDeVaciar(totalDePendientes)}
          </DialogDescription>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setConfirmando(false)} className={estiloDeBoton}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={alConfirmar}
              className={`${estiloDeBoton} text-destructive`}
            >
              <Eraser aria-hidden className="size-4" />
              Vaciar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
