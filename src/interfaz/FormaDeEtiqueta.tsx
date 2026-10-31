import type { ReactNode } from 'react'
import type { Etiqueta } from '@/modelo/tablero'

const FORMAS: Record<Etiqueta, ReactNode> = {
  rojo: <circle cx="6" cy="6" r="5" />,
  naranja: <rect x="1.5" y="1.5" width="9" height="9" />,
  amarillo: <path d="M6 1 11.5 11H.5z" />,
  verde: <path d="M6 .5 11.5 6 6 11.5 .5 6z" />,
  azul: (
    <path d="M6 .5 7.41 4.36 11.52 4.51 8.28 7.04 9.41 10.99 6 8.7 2.59 10.99 3.72 7.04.48 4.51 4.59 4.36z" />
  ),
  violeta: <path d="M4 1h4v3h3v4H8v3H4V8H1V4h3z" />,
}

export function colorDeEtiqueta(etiqueta: Etiqueta): string {
  return `var(--etiqueta-${etiqueta})`
}

type Props = {
  etiqueta: Etiqueta
  className?: string
}

// La forma repite la Etiqueta sin depender del color.
export function FormaDeEtiqueta({ etiqueta, className }: Props) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      fill={colorDeEtiqueta(etiqueta)}
      data-etiqueta={etiqueta}
      className={className}
    >
      {FORMAS[etiqueta]}
    </svg>
  )
}
