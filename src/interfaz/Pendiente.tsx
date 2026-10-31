import type { Pendiente as DatosPendiente } from '@/modelo/tablero'

export function Pendiente({ pendiente }: { pendiente: DatosPendiente }) {
  return (
    <li className="rounded-md bg-card px-2.5 py-2 text-sm wrap-anywhere text-card-foreground">
      {pendiente.titulo}
    </li>
  )
}
