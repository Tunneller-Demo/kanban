import { useId } from 'react'
import type { Etapa as DatosEtapa } from '@/modelo/tablero'

export function Etapa({ etapa }: { etapa: DatosEtapa }) {
  const encabezado = useId()
  const total = etapa.pendientes.length

  return (
    <section
      aria-labelledby={encabezado}
      className="flex min-w-0 flex-col rounded-[10px] bg-muted p-2.5 min-[720px]:w-70 min-[720px]:flex-none"
    >
      <header className="flex items-center gap-2">
        <h2
          id={encabezado}
          className="min-w-0 flex-1 text-[13px] font-semibold tracking-[.06em] wrap-anywhere text-muted-foreground uppercase"
        >
          {etapa.nombre}
        </h2>
        <span className="rounded-sm bg-card px-1.5 py-px font-mono text-xs">
          {total}
          <span className="sr-only"> {total === 1 ? 'Pendiente' : 'Pendientes'}</span>
        </span>
      </header>
    </section>
  )
}
