import { useId, useRef, useState, type FocusEvent, type FormEvent, type KeyboardEvent } from 'react'
import { AVISO_SIN_GUARDAR } from '@/anuncios/anuncios'
import { LIMITE_NOMBRE } from '@/modelo/tablero'
import { ContadorDeCaracteres } from './ContadorDeCaracteres'

type Props = {
  etiqueta: string
  inicial?: string
  onEnviar: (texto: string) => boolean // Devuelve si el campo se cierra.
  onSalir?: (texto: string) => void
  onCerrar: (devolverFoco: boolean) => void
}

// Campo del nombre de una Etapa, al renombrarla y al añadirla. No corta lo que sobra.
export function CampoDeNombre({ etiqueta, inicial = '', onEnviar, onSalir, onCerrar }: Props) {
  const idContador = useId()
  const campo = useRef<HTMLInputElement>(null)
  // El campo puede perder el foco al desmontarse: ese blur no debe contar como salir.
  const cerrado = useRef(false)
  const [texto, setTexto] = useState(inicial)
  const longitud = texto.trim().length

  function alEnviar(evento: FormEvent) {
    evento.preventDefault()
    cerrado.current = onEnviar(texto)
  }

  function alPulsarTecla(evento: KeyboardEvent) {
    if (evento.key !== 'Escape') return
    cerrado.current = true
    onCerrar(true)
  }

  function alSalir(evento: FocusEvent) {
    // Al cambiar de ventana el campo pierde el evento, pero sigue siendo el elemento activo.
    if (cerrado.current || document.activeElement === campo.current) return
    onSalir?.(texto)
    onCerrar(evento.relatedTarget === null)
  }

  return (
    <form onSubmit={alEnviar} className="min-w-0 flex-1">
      <input
        ref={campo}
        autoFocus
        type="text"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        onKeyDown={alPulsarTecla}
        onBlur={alSalir}
        aria-label={etiqueta}
        aria-describedby={idContador}
        aria-invalid={longitud > LIMITE_NOMBRE}
        autoComplete="off"
        enterKeyHint="done"
        className="min-h-11 w-full rounded-md border border-input bg-card px-2.5 text-sm aria-invalid:border-destructive carriles:min-h-8"
      />
      <ContadorDeCaracteres
        id={idContador}
        longitud={longitud}
        limite={LIMITE_NOMBRE}
        aviso={AVISO_SIN_GUARDAR}
      />
    </form>
  )
}
