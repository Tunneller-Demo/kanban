import { Download } from 'lucide-react'
import { useEffect } from 'react'
import { estiloDeBoton } from './estilos'

type Props = {
  activa: boolean
  onExportar: () => void
}

// La región `alert` existe siempre: el lector de pantalla oye lo que aparece dentro de ella.
// Vive en el flujo, sin flotar, para no tapar el foco. No se cierra: dura lo que dure el fallo.
export function BarraDeGuardado({ activa, onExportar }: Props) {
  useEffect(() => {
    if (!activa) return

    const avisarAlSalir = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisarAlSalir)
    return () => window.removeEventListener('beforeunload', avisarAlSalir)
  }, [activa])

  return (
    <div role="alert" className="flex-none">
      {activa && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-y border-destructive bg-card px-4 py-1.5 text-sm text-card-foreground carriles:px-6">
          <p>No se están guardando tus cambios. Exporta una Copia de seguridad para no perderlos</p>
          <button type="button" onClick={onExportar} className={estiloDeBoton}>
            <Download aria-hidden className="size-4" />
            Exportar
          </button>
        </div>
      )}
    </div>
  )
}
