import { textoDeExceso } from '@/anuncios/anuncios'
import { cn } from '@/lib/utils'

const INICIO_DEL_AVISO = 0.9

type Props = {
  id: string
  longitud: number
  limite: number
  aviso?: string // Se añade al texto de exceso, para decir qué pasa con lo que sobra.
}

// Siempre en el DOM y vacío lejos del límite, para que `aria-describedby` apunte a algo.
export function ContadorDeCaracteres({ id, longitud, limite, aviso }: Props) {
  const exceso = longitud - limite

  return (
    <p
      id={id}
      className={cn(
        'mt-1 text-right font-mono text-xs text-muted-foreground empty:hidden',
        exceso > 0 && 'text-destructive',
      )}
    >
      {longitud >= limite * INICIO_DEL_AVISO && (
        <>
          {exceso > 0 && (
            <span className="font-sans">
              {textoDeExceso(exceso)}
              {aviso && `. ${aviso}`}{' '}
            </span>
          )}
          {longitud}/{limite}
        </>
      )}
    </p>
  )
}
