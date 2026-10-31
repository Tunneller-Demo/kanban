import { useId, useRef, useState, type FocusEvent, type FormEvent, type KeyboardEvent } from 'react'
import { LIMITE_TITULO } from '@/modelo/tablero'
import { ContadorDeCaracteres } from './ContadorDeCaracteres'

type Props = {
  nombreDeEtapa: string
  onCrear: (titulo: string) => boolean
  onCerrar: (devolverFoco: boolean) => void
}

export function CampoDePendiente({ nombreDeEtapa, onCrear, onCerrar }: Props) {
  const idContador = useId()
  const campo = useRef<HTMLInputElement>(null)
  const [titulo, setTitulo] = useState('')
  const longitud = titulo.trim().length

  function alEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (onCrear(titulo)) setTitulo('')
  }

  function alPulsarTecla(evento: KeyboardEvent) {
    if (evento.key === 'Escape') onCerrar(true)
  }

  function alSalir(evento: FocusEvent) {
    // Al cambiar de ventana el campo pierde el evento, pero sigue siendo el elemento activo.
    if (document.activeElement === campo.current) return
    onCerrar(evento.relatedTarget === null)
  }

  return (
    <form onSubmit={alEnviar} className="mt-2">
      <input
        ref={campo}
        autoFocus
        type="text"
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        onKeyDown={alPulsarTecla}
        onBlur={alSalir}
        aria-label={`Título del nuevo Pendiente en ${nombreDeEtapa}`}
        aria-describedby={idContador}
        aria-invalid={longitud > LIMITE_TITULO}
        autoComplete="off"
        enterKeyHint="done"
        className="min-h-11 w-full rounded-md border border-input bg-card px-2.5 text-sm carriles:min-h-8"
      />
      <ContadorDeCaracteres id={idContador} longitud={longitud} limite={LIMITE_TITULO} />
    </form>
  )
}
