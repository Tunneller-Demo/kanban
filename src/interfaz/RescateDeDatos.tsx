import { Download, Eraser } from 'lucide-react'
import { useRef, useState } from 'react'
import { ANUNCIO_DATOS_DESCARGADOS } from '@/anuncios/anuncios'
import { descargarArchivo } from './descargar'
import { estiloDeBoton, estiloDeTitulo } from './estilos'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'

const NOMBRE_DEL_ARCHIVO = 'tablero-de-pendientes-datos-guardados.json'

type Props = {
  contenido: string
  onEmpezarDeCero: () => void
  onAnunciar: (texto: string) => void
}

// Sin `onOpenChange`, Escape y el clic fuera no lo cierran: nada se escribe sin una decisión.
export function RescateDeDatos({ contenido, onEmpezarDeCero, onAnunciar }: Props) {
  const [abierto, setAbierto] = useState(true)
  const empezado = useRef(false)

  function descargar() {
    descargarArchivo(NOMBRE_DEL_ARCHIVO, contenido)
    onAnunciar(ANUNCIO_DATOS_DESCARGADOS)
  }

  function alEmpezar() {
    empezado.current = true
    setAbierto(false)
  }

  return (
    <Dialog open={abierto}>
      <DialogContent
        role="alertdialog"
        sinCerrar
        className="carriles:max-w-sm"
        // Se empieza aquí, ya cerrado: si no, el diálogo se llevaría el foco del Estado.
        onCloseAutoFocus={(evento) => {
          evento.preventDefault()
          if (empezado.current) onEmpezarDeCero()
        }}
      >
        <DialogTitle className={estiloDeTitulo}>No hemos podido leer tu Tablero</DialogTitle>
        <DialogDescription className="text-sm">
          Los datos guardados en este navegador están dañados. Descárgalos antes de empezar de
          cero: al empezar, se borran.
        </DialogDescription>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={descargar} className={estiloDeBoton}>
            <Download aria-hidden className="size-4" />
            Descargar los datos guardados
          </button>
          <button
            type="button"
            onClick={alEmpezar}
            className={`${estiloDeBoton} text-destructive`}
          >
            <Eraser aria-hidden className="size-4" />
            Empezar de cero
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
