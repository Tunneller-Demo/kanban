import { Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type RefObject } from 'react'
import { TEXTOS_DE_RECHAZO, textoDeConfirmacionDeImportar } from '@/anuncios/anuncios'
import { analizarCopia, type MotivoDeRechazo } from '@/copia/copia'
import { contarPendientes, type Tablero } from '@/modelo/tablero'
import { estiloDeBoton, estiloDeTitulo } from './estilos'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'

type Props = {
  entrada: RefObject<HTMLInputElement | null>
  tablero: Tablero
  ejemploIntacto: boolean
  onImportar: (tablero: Tablero) => void
}

// El campo de archivo vive aquí: lo abren el diálogo y la invitación del Tablero vacío.
export function Importacion({ entrada, tablero, ejemploIntacto, onImportar }: Props) {
  const [porConfirmar, setPorConfirmar] = useState<Tablero | null>(null)
  const [rechazo, setRechazo] = useState<MotivoDeRechazo | null>(null)
  const confirmado = useRef<Tablero | null>(null)
  // Estos diálogos no tienen disparador: Radix no sabría a dónde devolver el foco.
  const origenDelFoco = useRef<Element | null>(null)

  async function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    // Sin esto, volver a elegir el mismo archivo no avisaría.
    evento.target.value = ''
    if (!archivo) return

    origenDelFoco.current = document.activeElement
    const texto = await archivo.text().catch(() => '')
    const resultado = analizarCopia(texto, () => crypto.randomUUID())
    if (resultado.tipo === 'rechazada') setRechazo(resultado.motivo)
    else if (contarPendientes(tablero) === 0 || ejemploIntacto) onImportar(resultado.tablero)
    else setPorConfirmar(resultado.tablero)
  }

  function alConfirmar() {
    confirmado.current = porConfirmar
    setPorConfirmar(null)
  }

  function alCerrar(abierto: boolean) {
    if (!abierto) setPorConfirmar(null)
  }

  function devolverElFoco() {
    if (origenDelFoco.current instanceof HTMLElement) origenDelFoco.current.focus()
  }

  return (
    <>
      <input
        ref={entrada}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={alElegir}
      />
      <Dialog open={porConfirmar !== null} onOpenChange={alCerrar}>
        <DialogContent
          role="alertdialog"
          className="carriles:max-w-sm"
          // Se importa aquí, ya cerrado: si no, el diálogo se llevaría el foco del Estado.
          onCloseAutoFocus={(evento) => {
            if (!confirmado.current) return devolverElFoco()

            evento.preventDefault()
            onImportar(confirmado.current)
            confirmado.current = null
          }}
        >
          <DialogTitle className={estiloDeTitulo}>Importar la Copia de seguridad</DialogTitle>
          <DialogDescription className="text-sm">
            {porConfirmar && textoDeConfirmacionDeImportar(tablero, porConfirmar)}
          </DialogDescription>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPorConfirmar(null)} className={estiloDeBoton}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={alConfirmar}
              className={`${estiloDeBoton} text-destructive`}
            >
              <Upload aria-hidden className="size-4" />
              Importar
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={rechazo !== null} onOpenChange={() => setRechazo(null)}>
        <DialogContent className="carriles:max-w-sm" onCloseAutoFocus={devolverElFoco}>
          <DialogTitle className={estiloDeTitulo}>No se ha podido importar</DialogTitle>
          <DialogDescription role="alert" className="text-sm">
            {rechazo && TEXTOS_DE_RECHAZO[rechazo]}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  )
}
