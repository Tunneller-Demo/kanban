import { useEffect, useRef, useState } from 'react'
import { LIMITE_NOMBRE } from '@/modelo/tablero'
import { CampoDeNombre } from './CampoDeNombre'

type Props = {
  id: string
  nombre: string
  idAyuda: string
  onRenombrar: (texto: string) => void
}

export function NombreDeEtapa({ id, nombre, idAyuda, onRenombrar }: Props) {
  const boton = useRef<HTMLButtonElement>(null)
  const devolverFoco = useRef(false)
  const [editando, setEditando] = useState(false)

  // El botón no existe hasta que el campo se cierra.
  useEffect(() => {
    if (editando || !devolverFoco.current) return
    devolverFoco.current = false
    boton.current?.focus()
  }, [editando])

  function cerrarCampo(conFoco: boolean) {
    devolverFoco.current = conFoco
    setEditando(false)
  }

  function alEnviar(texto: string) {
    onRenombrar(texto)
    const cabe = texto.trim().length <= LIMITE_NOMBRE
    if (cabe) cerrarCampo(true)
    return cabe
  }

  if (editando) {
    return (
      <>
        {/* La sección y sus listas se nombran con este encabezado: sigue ahí mientras se edita. */}
        <h2 id={id} className="sr-only">
          {nombre}
        </h2>
        <CampoDeNombre
          etiqueta={`Nombre de la Etapa ${nombre}`}
          inicial={nombre}
          onEnviar={alEnviar}
          onSalir={onRenombrar}
          onCerrar={cerrarCampo}
        />
      </>
    )
  }

  return (
    <h2
      id={id}
      className="min-w-0 flex-1 text-[13px] font-semibold tracking-[.06em] wrap-anywhere text-muted-foreground"
    >
      {/* Sin aria-label: daría ese nombre también a la sección. La acción es una descripción. */}
      <button
        ref={boton}
        type="button"
        onClick={() => setEditando(true)}
        aria-describedby={idAyuda}
        className="min-h-11 w-full rounded-sm text-left uppercase hover:text-foreground carriles:min-h-8"
      >
        {nombre}
      </button>
    </h2>
  )
}
