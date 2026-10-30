// PROTOTIPO desechable. Pregunta: ¿cómo se ve y se siente el Tablero?
// Tres variantes en una sola ruta, con ?variant=A|B|C y barra flotante.
import { useEffect, useRef, useState } from 'react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { CollisionPriority } from '@dnd-kit/abstract'
import { Feedback } from '@dnd-kit/dom'
import { move } from '@dnd-kit/helpers'
import { ETIQUETAS, VARIANTES, tableroDeEjemplo } from './datos'
import type { ClaveVariante, Pendiente, Tablero } from './datos'

const CLAVES: ClaveVariante[] = ['A', 'B', 'C']

function varianteDeUrl(): ClaveVariante {
  const v = new URLSearchParams(location.search).get('variant')
  return CLAVES.includes(v as ClaveVariante) ? (v as ClaveVariante) : 'A'
}

export function App() {
  const [variante, setVariante] = useState(varianteDeUrl)
  const [tablero, setTablero] = useState<Tablero>(tableroDeEjemplo)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [traza, setTraza] = useState('Sin movimientos')
  const copia = useRef(tablero)
  const actual = useRef(tablero)
  actual.current = tablero
  const puntero = useRef('—')
  const carrusel = useRef<HTMLDivElement>(null)
  const [activa, setActiva] = useState(0)

  useEffect(() => {
    const guardar = (e: PointerEvent) => (puntero.current = e.pointerType)
    window.addEventListener('pointerdown', guardar, true)
    return () => window.removeEventListener('pointerdown', guardar, true)
  }, [])

  function cambiar(paso: number) {
    const v = CLAVES[(CLAVES.indexOf(variante) + paso + CLAVES.length) % CLAVES.length]
    history.replaceState(null, '', `?variant=${v}`)
    setVariante(v)
  }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowLeft') cambiar(-1)
      if (e.key === 'ArrowRight') cambiar(1)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  function irAEtapa(i: number) {
    const etapa = carrusel.current?.children[i] as HTMLElement | undefined
    etapa?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  function alDesplazar() {
    const c = carrusel.current
    if (!c) return
    const centro = c.scrollLeft + c.clientWidth / 2
    let mejor = 0
    let distancia = Infinity
    Array.from(c.children).forEach((hijo, i) => {
      const h = hijo as HTMLElement
      const d = Math.abs(h.offsetLeft - c.offsetLeft + h.offsetWidth / 2 - centro)
      if (d < distancia) [mejor, distancia] = [i, d]
    })
    setActiva(mejor)
  }

  function editar(id: string, cambios: Partial<Pendiente>) {
    setTablero((t) => ({
      ...t,
      pendientes: Object.fromEntries(
        Object.entries(t.pendientes).map(([etapa, lista]) => [
          etapa,
          lista.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
        ]),
      ),
    }))
  }

  function borrar(id: string) {
    setTablero((t) => ({
      ...t,
      pendientes: Object.fromEntries(
        Object.entries(t.pendientes).map(([e, lista]) => [e, lista.filter((p) => p.id !== id)]),
      ),
    }))
    setAbierto(null)
  }

  function crear(etapa: string, titulo: string) {
    const nuevo = { id: crypto.randomUUID(), titulo, nota: '', etiqueta: null }
    setTablero((t) => ({
      ...t,
      pendientes: { ...t.pendientes, [etapa]: [nuevo, ...t.pendientes[etapa]] },
    }))
  }

  function llenar() {
    const extra = Array.from({ length: 14 }, (_, i) => ({
      id: crypto.randomUUID(),
      titulo: `Pendiente de relleno ${i + 1}`,
      nota: i % 3 ? '' : 'Nota',
      etiqueta: i % 2 ? i % 6 : null,
    }))
    setTablero((t) => {
      const primera = t.orden[0]
      return { ...t, pendientes: { ...t.pendientes, [primera]: [...t.pendientes[primera], ...extra] } }
    })
  }

  const vaciar = () =>
    setTablero((t) => ({
      ...t,
      pendientes: Object.fromEntries(t.orden.map((e) => [e, []])),
    }))

  const pendienteAbierto = Object.values(tablero.pendientes)
    .flat()
    .find((p) => p.id === abierto)
  const vacio = Object.values(tablero.pendientes).every((l) => l.length === 0)
  const tonos = VARIANTES[variante].tonos

  return (
    <div className={`app variante-${variante}${arrastrando ? ' arrastrando' : ''}`}>
      <header className="cabecera">
        <h1>Tablero de pendientes</h1>
        <button className="vaciar" onClick={vaciar}>
          Vaciar
        </button>
      </header>

      <nav className="navegador" aria-label="Etapas">
        {tablero.orden.map((id, i) => (
          <button key={id} aria-current={i === activa} onClick={() => irAEtapa(i)}>
            <span className="navegador-punto" />
            <span className="navegador-nombre">{tablero.nombres[id]}</span>
            <span className="navegador-numero">{tablero.pendientes[id].length}</span>
          </button>
        ))}
      </nav>

      {vacio && (
        <div className="vacio">
          <p>Tu Tablero está vacío. Crea tu primer Pendiente en cualquier Etapa.</p>
          <button onClick={() => setTablero(tableroDeEjemplo())}>Ver el Tablero de ejemplo</button>
        </div>
      )}

      {/* El key rehace el proveedor al cambiar de variante: cada una tiene su animación de soltar. */}
      <DragDropProvider
        key={variante}
        plugins={(previos) => [
          ...previos.filter((p) => p !== Feedback),
          Feedback.configure({ dropAnimation: VARIANTES[variante].soltar }),
        ]}
        onDragStart={() => {
          copia.current = tablero
          setArrastrando(true)
        }}
        onDragOver={(evento) => {
          if (evento.operation.source?.type === 'etapa') return
          setTablero((t) => ({ ...t, pendientes: move(t.pendientes, evento) }))
        }}
        onDragEnd={(evento) => {
          setArrastrando(false)
          const fuente = evento.operation.source
          if (evento.canceled) {
            setTablero(copia.current)
            setTraza(`Cancelado (${puntero.current})`)
            return
          }
          const t = actual.current
          if (fuente?.type === 'etapa') {
            const orden = move(t.orden, evento)
            setTablero({ ...t, orden })
            setTraza(`Etapas: ${orden.map((e) => t.nombres[e]).join(' · ')} (${puntero.current})`)
            return
          }
          const destino = t.orden.find((e) => t.pendientes[e].some((p) => p.id === fuente?.id))
          const posicion = destino ? t.pendientes[destino].findIndex((p) => p.id === fuente?.id) + 1 : 0
          setTraza(`→ ${destino ? t.nombres[destino] : '?'}, posición ${posicion} (${puntero.current})`)
        }}
      >
        <main className="tablero" ref={carrusel} onScroll={alDesplazar}>
          {tablero.orden.map((id, i) => (
            <Etapa
              key={id}
              id={id}
              indice={i}
              nombre={tablero.nombres[id]}
              pendientes={tablero.pendientes[id]}
              tonos={tonos}
              alAbrir={setAbierto}
              alCrear={(titulo) => crear(id, titulo)}
            />
          ))}
        </main>
      </DragDropProvider>

      <footer className="pie">
        <span>
          Tus datos se guardan solo en este navegador · <a href="#copia">Exportar Copia de seguridad</a>
        </span>
        <span>Construida con Tunneller</span>
      </footer>

      {pendienteAbierto && (
        <Dialogo
          pendiente={pendienteAbierto}
          tonos={tonos}
          alCambiar={(c) => editar(pendienteAbierto.id, c)}
          alBorrar={() => borrar(pendienteAbierto.id)}
          alCerrar={() => setAbierto(null)}
        />
      )}

      {import.meta.env.DEV && (
        <div className="barra-prototipo">
          <div className="barra-fila">
            <button aria-label="Variante anterior" onClick={() => cambiar(-1)}>
              ←
            </button>
            <strong>
              {variante} — {VARIANTES[variante].nombre}
            </strong>
            <button aria-label="Variante siguiente" onClick={() => cambiar(1)}>
              →
            </button>
            <button onClick={llenar}>+14</button>
          </div>
          <div className="barra-traza">{traza}</div>
        </div>
      )}
    </div>
  )
}

function Etapa(props: {
  id: string
  indice: number
  nombre: string
  pendientes: Pendiente[]
  tonos: string[]
  alAbrir: (id: string) => void
  alCrear: (titulo: string) => void
}) {
  const { ref, handleRef, isDragSource, isDropTarget } = useSortable({
    id: props.id,
    index: props.indice,
    type: 'etapa',
    accept: ['pendiente', 'etapa'],
    collisionPriority: CollisionPriority.Low,
  })
  const [creando, setCreando] = useState(false)

  return (
    <section
      ref={ref}
      className={`etapa etapa-${props.indice % 3}${isDragSource ? ' etapa-levantada' : ''}${isDropTarget ? ' etapa-destino' : ''}`}
    >
      <header className="etapa-cabecera">
        <h2>{props.nombre}</h2>
        <span className="etapa-numero">{props.pendientes.length}</span>
        <button ref={handleRef} className="asa" aria-label={`Reordenar ${props.nombre}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <g fill="currentColor">
              {[2, 7, 12].flatMap((y) =>
                [4, 10].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" />),
              )}
            </g>
          </svg>
        </button>
      </header>

      {creando ? (
        <input
          className="campo-nuevo"
          autoFocus
          maxLength={120}
          placeholder="Título del Pendiente"
          aria-label={`Nuevo Pendiente en ${props.nombre}`}
          onBlur={() => setCreando(false)}
          onKeyDown={(e) => {
            const campo = e.currentTarget
            if (e.key === 'Escape') setCreando(false)
            if (e.key === 'Enter' && campo.value.trim()) {
              props.alCrear(campo.value.trim())
              campo.value = ''
            }
          }}
        />
      ) : (
        <button className="anadir" onClick={() => setCreando(true)}>
          + Añadir Pendiente
        </button>
      )}

      <div className="etapa-lista">
        {props.pendientes.map((p, i) => (
          <TarjetaPendiente
            key={p.id}
            pendiente={p}
            indice={i}
            etapa={props.id}
            tonos={props.tonos}
            alAbrir={props.alAbrir}
          />
        ))}
      </div>
    </section>
  )
}

function TarjetaPendiente(props: {
  pendiente: Pendiente
  indice: number
  etapa: string
  tonos: string[]
  alAbrir: (id: string) => void
}) {
  const { pendiente: p } = props
  const { ref, isDragging, isDropping } = useSortable({
    id: p.id,
    index: props.indice,
    group: props.etapa,
    type: 'pendiente',
    accept: 'pendiente',
  })
  const tono = p.etiqueta === null ? undefined : props.tonos[p.etiqueta]
  const clases = ['pendiente', tono && 'con-etiqueta', isDragging && !isDropping && 'levantado', isDropping && 'soltando']

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={clases.filter(Boolean).join(' ')}
      style={tono ? ({ '--tono': tono } as React.CSSProperties) : undefined}
      onClick={() => props.alAbrir(p.id)}
    >
      <span className="pendiente-marca" aria-hidden />
      <span className="pendiente-titulo">{p.titulo}</span>
      {p.nota && (
        <svg className="pendiente-nota" width="14" height="14" viewBox="0 0 14 14" role="img" aria-label="Tiene nota">
          <path d="M2 3h10M2 7h10M2 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

function Dialogo(props: {
  pendiente: Pendiente
  tonos: string[]
  alCambiar: (cambios: Partial<Pendiente>) => void
  alBorrar: () => void
  alCerrar: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const { pendiente: p } = props

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])

  return (
    <dialog ref={ref} className="dialogo" onClose={props.alCerrar}>
      <input
        className="dialogo-titulo"
        aria-label="Título"
        maxLength={120}
        value={p.titulo}
        onChange={(e) => props.alCambiar({ titulo: e.target.value })}
      />
      <textarea
        className="dialogo-nota"
        aria-label="Nota"
        rows={5}
        maxLength={2000}
        placeholder="Añade una nota"
        value={p.nota}
        onChange={(e) => props.alCambiar({ nota: e.target.value })}
      />
      <div className="dialogo-etiquetas" role="group" aria-label="Etiqueta">
        {ETIQUETAS.map((nombre, i) => (
          <button
            key={nombre}
            aria-label={nombre}
            aria-pressed={p.etiqueta === i}
            style={{ background: props.tonos[i] }}
            onClick={() => props.alCambiar({ etiqueta: p.etiqueta === i ? null : i })}
          />
        ))}
      </div>
      <div className="dialogo-acciones">
        <button className="dialogo-borrar" onClick={props.alBorrar}>
          Borrar
        </button>
        <button onClick={() => ref.current?.close()}>Cerrar</button>
      </div>
    </dialog>
  )
}
