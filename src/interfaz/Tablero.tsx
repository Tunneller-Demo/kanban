import type { Tablero as DatosTablero } from '@/modelo/tablero'
import { Etapa } from './Etapa'

export function Tablero({ tablero }: { tablero: DatosTablero }) {
  return (
    <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 min-[720px]:flex-row min-[720px]:px-6">
      {tablero.etapas.map((etapa) => (
        <Etapa key={etapa.id} etapa={etapa} />
      ))}
    </div>
  )
}
