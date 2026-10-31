import { Ban } from 'lucide-react'
import { useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import {
  anuncioCambiosSinGuardar,
  anuncioTituloRecuperado,
  AVISO_SIN_GUARDAR,
  nombreDeEtiqueta,
} from '@/anuncios/anuncios'
import { cn } from '@/lib/utils'
import {
  ETIQUETAS,
  LIMITE_NOTA,
  LIMITE_TITULO,
  type CambiosDePendiente,
  type Pendiente,
} from '@/modelo/tablero'
import { ContadorDeCaracteres } from './ContadorDeCaracteres'
import { FormaDeEtiqueta } from './FormaDeEtiqueta'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'

const estiloDeCampo =
  'w-full rounded-md border border-input bg-card px-2.5 text-sm aria-invalid:border-destructive'
const estiloDeRotulo = 'mb-1 block text-[13px] font-medium text-muted-foreground'

type Props = {
  pendiente: Pendiente
  onEditar: (cambios: CambiosDePendiente) => void
  onAnunciar: (texto: string) => void
  children: ReactElement
}

// Guarda cada cambio al momento. Los campos conservan lo escrito aunque el Modelo lo rechace,
// para no cortar en silencio lo pegado de más.
export function DialogoDePendiente({ pendiente, onEditar, onAnunciar, children }: Props) {
  const idTitulo = useId()
  const idContadorDeTitulo = useId()
  const idNota = useId()
  const idContadorDeNota = useId()
  const nombreDeRadios = useId()
  const [abierto, setAbierto] = useState(false)
  const [titulo, setTitulo] = useState(pendiente.titulo)
  const [nota, setNota] = useState(pendiente.nota ?? '')
  // Se recuerda al entrar: al borrar letra a letra, cada letra ya se ha guardado.
  const tituloAnterior = useRef(pendiente.titulo)

  const excesoDeTitulo = titulo.trim().length - LIMITE_TITULO
  const excesoDeNota = nota.length - LIMITE_NOTA

  function recuperarTituloSiVacio() {
    if (titulo.trim()) return
    setTitulo(tituloAnterior.current)
    onEditar({ titulo: tituloAnterior.current })
    onAnunciar(anuncioTituloRecuperado(tituloAnterior.current))
  }

  function alCambiarApertura(abrir: boolean) {
    if (abrir) {
      setTitulo(pendiente.titulo)
      setNota(pendiente.nota ?? '')
    } else {
      recuperarTituloSiVacio()
      if (excesoDeTitulo > 0 || excesoDeNota > 0) {
        onAnunciar(anuncioCambiosSinGuardar(excesoDeTitulo, excesoDeNota))
      }
    }
    setAbierto(abrir)
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiarApertura}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        // En el título, el teclado del móvil taparía la nota y las Etiquetas al solo querer leer.
        onOpenAutoFocus={(evento) => {
          evento.preventDefault()
          ;(evento.currentTarget as HTMLElement).focus()
        }}
      >
        <DialogTitle className="flex min-h-7 items-center text-[15px] font-semibold">
          Editar Pendiente
        </DialogTitle>
        <div>
          <label htmlFor={idTitulo} className={estiloDeRotulo}>
            Título
          </label>
          <input
            id={idTitulo}
            type="text"
            value={titulo}
            onChange={(evento) => {
              setTitulo(evento.target.value)
              onEditar({ titulo: evento.target.value })
            }}
            onFocus={() => {
              tituloAnterior.current = pendiente.titulo
            }}
            onBlur={recuperarTituloSiVacio}
            aria-describedby={idContadorDeTitulo}
            aria-invalid={excesoDeTitulo > 0}
            autoComplete="off"
            className={cn(estiloDeCampo, 'min-h-11 carriles:min-h-8')}
          />
          <ContadorDeCaracteres
            id={idContadorDeTitulo}
            longitud={titulo.trim().length}
            limite={LIMITE_TITULO}
            aviso={AVISO_SIN_GUARDAR}
          />
        </div>
        <div className="flex min-h-40 flex-1 flex-col carriles:h-56 carriles:flex-none">
          <label htmlFor={idNota} className={estiloDeRotulo}>
            Nota
          </label>
          <textarea
            id={idNota}
            value={nota}
            onChange={(evento) => {
              setNota(evento.target.value)
              onEditar({ nota: evento.target.value })
            }}
            aria-describedby={idContadorDeNota}
            aria-invalid={excesoDeNota > 0}
            className={cn(estiloDeCampo, 'min-h-0 flex-1 resize-none py-2')}
          />
          <ContadorDeCaracteres
            id={idContadorDeNota}
            longitud={nota.length}
            limite={LIMITE_NOTA}
            aviso={AVISO_SIN_GUARDAR}
          />
        </div>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className={cn(estiloDeRotulo, 'p-0')}>Etiqueta</legend>
          <div className="flex flex-wrap gap-1">
            <OpcionDeEtiqueta
              nombre={nombreDeRadios}
              rotulo="Sin Etiqueta"
              marcada={!pendiente.etiqueta}
              onElegir={() => onEditar({ etiqueta: null })}
            >
              <Ban aria-hidden className="size-4 text-muted-foreground" />
            </OpcionDeEtiqueta>
            {ETIQUETAS.map((etiqueta) => (
              <OpcionDeEtiqueta
                key={etiqueta}
                nombre={nombreDeRadios}
                rotulo={nombreDeEtiqueta(etiqueta)}
                marcada={pendiente.etiqueta === etiqueta}
                onElegir={() => onEditar({ etiqueta })}
              >
                <FormaDeEtiqueta etiqueta={etiqueta} className="size-4" />
              </OpcionDeEtiqueta>
            ))}
          </div>
        </fieldset>
      </DialogContent>
    </Dialog>
  )
}

type PropsDeOpcion = {
  nombre: string
  rotulo: string
  marcada: boolean
  onElegir: () => void
  children: ReactNode
}

function OpcionDeEtiqueta({ nombre, rotulo, marcada, onElegir, children }: PropsDeOpcion) {
  return (
    <label className="relative grid size-11 cursor-pointer place-items-center rounded-md border border-transparent hover:bg-muted has-checked:border-primary has-checked:bg-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring carriles:size-8">
      <input
        type="radio"
        name={nombre}
        checked={marcada}
        onChange={onElegir}
        className="sr-only"
      />
      {children}
      <span className="sr-only">{rotulo}</span>
    </label>
  )
}
