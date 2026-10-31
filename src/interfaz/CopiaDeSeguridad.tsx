import { Download, Upload } from 'lucide-react'
import { useState } from 'react'
import { estiloDeBoton, estiloDeTitulo } from './estilos'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

type Props = {
  onExportar: () => void
  onElegirArchivo: () => void
}

export function CopiaDeSeguridad({ onExportar, onElegirArchivo }: Props) {
  const [abierto, setAbierto] = useState(false)

  // Se cierra ya: el selector de archivos solo se abre en el mismo gesto, y al importar
  // este diálogo se llevaría el foco del Estado.
  function importar() {
    onElegirArchivo()
    setAbierto(false)
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger className="min-h-11 underline underline-offset-2 hover:text-foreground carriles:min-h-6">
        Copia de seguridad
      </DialogTrigger>
      <DialogContent className="carriles:max-w-sm">
        <DialogTitle className={estiloDeTitulo}>Copia de seguridad</DialogTitle>
        <DialogDescription className="text-sm">
          Tus datos se guardan solo en este navegador: si borras sus datos, se pierden.
        </DialogDescription>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onExportar} className={estiloDeBoton}>
            <Download aria-hidden className="size-4" />
            Exportar
          </button>
          <button type="button" onClick={importar} className={estiloDeBoton}>
            <Upload aria-hidden className="size-4" />
            Importar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
