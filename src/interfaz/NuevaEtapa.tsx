import { Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { MOTIVO_SIN_ANADIR_ETAPA } from '@/anuncios/anuncios'
import { CampoDeNombre } from './CampoDeNombre'

type Props = {
  llena: boolean
  onCrear: (nombre: string) => boolean
}

export function NuevaEtapa({ llena, onCrear }: Props) {
  const idMotivo = useId()
  const boton = useRef<HTMLButtonElement>(null)
  const devolverFoco = useRef(false)
  const [creando, setCreando] = useState(false)

  // El botón no existe hasta que el campo se cierra.
  useEffect(() => {
    if (creando || !devolverFoco.current) return
    devolverFoco.current = false
    boton.current?.focus()
  }, [creando])

  function cerrarCampo(conFoco: boolean) {
    devolverFoco.current = conFoco
    setCreando(false)
  }

  // Al crear, el foco lo decide el Estado.
  function alEnviar(nombre: string) {
    const creada = onCrear(nombre)
    if (creada) cerrarCampo(false)
    return creada
  }

  return (
    // Alineado con el encabezado de las Etapas; pegado a `main`, su contorno de foco se recortaría.
    <div className="flex w-[85vw] flex-none snap-center snap-always flex-col pt-2.5 carriles:w-70">
      {creando ? (
        <CampoDeNombre
          etiqueta="Nombre de la nueva Etapa"
          onEnviar={alEnviar}
          onCerrar={cerrarCampo}
        />
      ) : (
        <>
          {/* aria-disabled y no disabled: el teclado debe poder llegar hasta el motivo. */}
          <button
            ref={boton}
            type="button"
            onClick={() => {
              if (!llena) setCreando(true)
            }}
            aria-disabled={llena || undefined}
            aria-describedby={llena ? idMotivo : undefined}
            className="flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground not-aria-disabled:hover:bg-muted not-aria-disabled:hover:text-foreground aria-disabled:cursor-default carriles:min-h-8"
          >
            <Plus aria-hidden className="size-4 flex-none" />
            Añadir Etapa
          </button>
          {llena && (
            <p id={idMotivo} className="px-2.5 pt-1 text-xs text-muted-foreground">
              {MOTIVO_SIN_ANADIR_ETAPA}
            </p>
          )}
        </>
      )}
    </div>
  )
}
