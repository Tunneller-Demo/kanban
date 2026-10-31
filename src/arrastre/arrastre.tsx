// Arrastre: el único módulo que conoce dnd-kit. Enseña dónde caerá el Pendiente y,
// al soltar, deja que el Modelo haga el cambio.
import { CollisionPriority, type Plugins } from '@dnd-kit/abstract'
import {
  Accessibility,
  Feedback,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom'
import { move } from '@dnd-kit/helpers'
import {
  DragDropProvider,
  useDroppable,
  type DragDropManager,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { anuncioPendienteCogido, anuncioPendienteSobre } from '@/anuncios/anuncios'
import {
  localizarPendiente,
  moverPendiente,
  type Pendiente,
  type Tablero,
} from '@/modelo/tablero'

// Sin arrastre, nadie es destino.
const EtapaDeDestino = createContext<string | null>(null)

// Intro queda fuera de `start`: sobre un Pendiente en reposo solo abre el diálogo.
const SENSORES = [
  PointerSensor.configure({
    // A cero píxeles, un clic no llegaría al botón y no abriría el diálogo.
    activationConstraints: ({ pointerType }) =>
      pointerType === 'touch'
        ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
        : [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
  KeyboardSensor.configure({
    keyboardCodes: {
      start: ['Space'],
      cancel: ['Escape'],
      end: ['Space', 'Enter', 'Tab'],
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
    },
    // Lo mismo que hace dnd-kit por defecto, salvo que una tecla mantenida no coge.
    preventActivation: (evento, origen) =>
      evento.repeat || evento.target !== (origen.handle ?? origen.element),
  }),
]

// Sin `Accessibility`: abriría una segunda región `status` y hablaría en inglés.
const conPluginsPropios = (previos: Plugins) => [
  ...previos.filter((plugin) => plugin !== Accessibility && plugin !== Feedback),
  Feedback.configure({ dropAnimation: { duration: 130, easing: 'ease-out' } }),
]

type Props = {
  tablero: Tablero
  onSoltar: (pendienteId: string, etapaId: string, indice: number) => void
  onDejar: (pendienteId: string) => void
  onAnunciar: (texto: string) => void
  children: (visible: Tablero) => ReactNode
}

export function ZonaDeArrastre({ tablero, onSoltar, onDejar, onAnunciar, children }: Props) {
  const [vistaPrevia, setVistaPrevia] = useState<{ tablero: Tablero; pendienteId: string } | null>(
    null,
  )
  // `onDragEnd` puede llegar antes de que React pinte la última vista previa.
  const ultima = useRef(tablero)
  const visible = vistaPrevia?.tablero ?? tablero
  const etapaDeDestino = vistaPrevia
    ? (localizarPendiente(vistaPrevia.tablero, vistaPrevia.pendienteId)?.etapa.id ?? null)
    : null

  // La vista previa se basa en un Tablero que ya no existe. Se cancela como lo haría
  // Escape, porque parar la operación desde fuera dejaría al sensor de teclado escuchando.
  useEffect(() => {
    if (!vistaPrevia) return
    const escape = { key: 'Escape', code: 'Escape', bubbles: true }
    document.body.dispatchEvent(new KeyboardEvent('keydown', escape))
  }, [tablero])

  function alCoger({ operation }: DragStartEvent) {
    const pendienteId = String(operation.source?.id)
    const sitio = localizarPendiente(tablero, pendienteId)
    if (!sitio) return

    ultima.current = tablero
    setVistaPrevia({ tablero, pendienteId })
    onAnunciar(textoDe(anuncioPendienteCogido, sitio))
  }

  function alPasar(evento: DragOverEvent, manager: DragDropManager) {
    const pendienteId = String(evento.operation.source?.id)
    const antes = ultima.current
    const nuevo = tableroAlPasar(antes, pendienteId, evento, manager)
    if (nuevo === antes) return

    ultima.current = nuevo
    setVistaPrevia({ tablero: nuevo, pendienteId })
    const sitio = localizarPendiente(nuevo, pendienteId)
    if (sitio) onAnunciar(textoDe(anuncioPendienteSobre, sitio))
  }

  function alTerminar({ operation, canceled }: DragEndEvent, manager: DragDropManager) {
    const pendienteId = String(operation.source?.id)
    const sitio = localizarPendiente(ultima.current, pendienteId)
    setVistaPrevia(null)

    if (canceled || !sitio) onDejar(pendienteId)
    else onSoltar(pendienteId, sitio.etapa.id, sitio.indice)
    devolverFocoAlAcabar(manager, pendienteId)
  }

  return (
    <DragDropProvider
      sensors={SENSORES}
      plugins={conPluginsPropios}
      onDragStart={alCoger}
      onDragOver={alPasar}
      onDragEnd={alTerminar}
    >
      <EtapaDeDestino.Provider value={etapaDeDestino}>{children(visible)}</EtapaDeDestino.Provider>
    </DragDropProvider>
  )
}

export function useEtapaReceptora(etapaId: string) {
  const { ref } = useDroppable({
    id: etapaId,
    type: 'etapa',
    accept: 'pendiente',
    // Cede ante los Pendientes: si no, el hueco no entraría entre ellos.
    collisionPriority: CollisionPriority.Low,
  })
  return { ref, esDestino: useContext(EtapaDeDestino) === etapaId }
}

export function usePendienteArrastrable(id: string, indice: number, etapaId: string) {
  const { ref, handleRef, sortable } = useSortable({
    id,
    index: indice,
    group: etapaId,
    type: 'pendiente',
    accept: 'pendiente',
  })

  // Durante la animación, o con la tecla mantenida, dnd-kit no coge y el diálogo se abriría.
  function alPulsar(evento: KeyboardEvent) {
    const ignorada = evento.repeat || !sortable.manager?.dragOperation.status.idle
    if (ignorada && (evento.code === 'Space' || evento.code === 'Enter')) evento.preventDefault()
  }

  return { ref, handleRef, alPulsar }
}

// dnd-kit recoloca el elemento al acabar y el foco se pierde, salvo que ya esté en otro sitio.
function devolverFocoAlAcabar(manager: DragDropManager, pendienteId: string) {
  requestAnimationFrame(function esperar() {
    if (!manager.dragOperation.status.idle) {
      requestAnimationFrame(esperar)
      return
    }
    if (document.activeElement !== document.body) return
    const boton = manager.registry.draggables.get(pendienteId)?.handle
    if (boton instanceof HTMLElement) boton.focus()
  })
}

function tableroAlPasar(
  tablero: Tablero,
  pendienteId: string,
  evento: DragOverEvent,
  manager: DragDropManager,
): Tablero {
  const { target, position } = evento.operation
  if (target?.type === 'etapa') {
    const etapa = tablero.etapas.find(({ id }) => id === target.id)
    const resto = etapa?.pendientes.filter(({ id }) => id !== pendienteId) ?? []
    // `move` parte la Etapa por su centro: el vacío bajo una lista corta caería arriba.
    const primero = resto[0] && manager.registry.droppables.get(resto[0].id)?.shape
    const encima = primero && position.current.y < primero.boundingRectangle.top
    return moverPendiente(tablero, pendienteId, String(target.id), encima ? 0 : resto.length)
  }

  const previo = registroDe(tablero)
  const siguiente = move(previo, evento)
  if (siguiente === previo) return tablero
  return { etapas: tablero.etapas.map((e) => ({ ...e, pendientes: siguiente[e.id] })) }
}

function registroDe({ etapas }: Tablero): Record<string, Pendiente[]> {
  return Object.fromEntries(etapas.map(({ id, pendientes }) => [id, pendientes]))
}

function textoDe(
  anuncio: (titulo: string, nombreDeEtapa: string, posicion: number, total: number) => string,
  { etapa, indice, pendiente }: NonNullable<ReturnType<typeof localizarPendiente>>,
) {
  return anuncio(pendiente.titulo, etapa.nombre, indice + 1, etapa.pendientes.length)
}
