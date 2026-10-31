import type { Tablero as DatosTablero } from '@/modelo/tablero'
import { Etapa } from './Etapa'

type Props = {
  tablero: DatosTablero
  onCrear: (etapaId: string, titulo: string) => boolean
}

export function Tablero({ tablero, onCrear }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 carriles:flex-row carriles:px-6">
      {tablero.etapas.map((etapa) => (
        <Etapa key={etapa.id} etapa={etapa} onCrear={(titulo) => onCrear(etapa.id, titulo)} />
      ))}
    </div>
  )
}
