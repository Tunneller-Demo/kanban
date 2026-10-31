import { useEffect, useId, useRef, type FocusEvent } from 'react'
import { AYUDA_DE_ARRASTRE, AYUDA_DE_ASA, AYUDA_DE_NOMBRE } from '@/anuncios/anuncios'
import { ZonaDeArrastre } from '@/arrastre/arrastre'
import type { Foco } from '@/estado/useEstadoDeLaApp'
import {
  MAXIMO_DE_ETAPAS,
  type CambiosDePendiente,
  type Tablero as DatosTablero,
} from '@/modelo/tablero'
import { Etapa } from './Etapa'
import { claveDeFoco } from './foco'
import { NuevaEtapa } from './NuevaEtapa'
import { PestanasDeEtapa } from './PestanasDeEtapa'

type Props = {
  tablero: DatosTablero
  foco: Foco | null
  onCrear: (etapaId: string, titulo: string) => boolean
  onEditar: (pendienteId: string, cambios: CambiosDePendiente) => void
  onBorrar: (pendienteId: string) => void
  onSubir: (pendienteId: string) => void
  onBajar: (pendienteId: string) => void
  onMoverA: (pendienteId: string, etapaId: string) => void
  onSoltar: (pendienteId: string, etapaId: string, indice: number) => void
  onDejar: (pendienteId: string) => void
  onAnadirEtapa: (nombre: string) => boolean
  onRenombrar: (etapaId: string, texto: string) => void
  onMoverEtapaIzquierda: (etapaId: string) => void
  onMoverEtapaDerecha: (etapaId: string) => void
  onSoltarEtapa: (etapaId: string, indice: number) => void
  onDejarEtapa: (etapaId: string) => void
  onQuitarEtapa: (etapaId: string) => void
  onAnunciar: (texto: string) => void
}

export function Tablero({
  tablero,
  foco,
  onCrear,
  onEditar,
  onBorrar,
  onSubir,
  onBajar,
  onMoverA,
  onSoltar,
  onDejar,
  onAnadirEtapa,
  onRenombrar,
  onMoverEtapaIzquierda,
  onMoverEtapaDerecha,
  onSoltarEtapa,
  onDejarEtapa,
  onQuitarEtapa,
  onAnunciar,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const carrusel = useRef<HTMLElement>(null)
  const idAyuda = useId()
  const idAyudaDeNombre = useId()
  const idAyudaDeAsa = useId()

  // El destino puede montarse en el mismo cambio que pide el foco: por eso va tras pintar.
  useEffect(() => {
    if (!foco) return
    // El hueco del arrastre es una copia inerte que repite la marca.
    const selector = `[data-foco="${CSS.escape(claveDeFoco(foco))}"]:not([inert] *)`
    contenedor.current?.querySelector<HTMLElement>(selector)?.focus()
  }, [foco])

  // `Firefox` no respeta `scroll-py-1` al enfocar: aquí sí, y el contorno no se recorta.
  // Además, el navegador da por visible lo que asoma por el borde: sin el carril, el foco se
  // quedaría en la Etapa vecina. El carril va antes: si es más alto que `main`, desharía lo otro.
  function alEnfocar({ target }: FocusEvent<HTMLElement>) {
    const cerca = { block: 'nearest', inline: 'nearest' } as const
    const carriles = contenedor.current?.children ?? []
    Array.from(carriles)
      .find((hijo) => hijo.contains(target))
      ?.scrollIntoView(cerca)
    target.scrollIntoView(cerca)
  }

  return (
    <ZonaDeArrastre
      tablero={tablero}
      onSoltar={onSoltar}
      onDejar={onDejar}
      onSoltarEtapa={onSoltarEtapa}
      onDejarEtapa={onDejarEtapa}
      onAnunciar={onAnunciar}
    >
      {(visible) => (
        <>
          <PestanasDeEtapa etapas={visible.etapas} carrusel={carrusel} />
          {/* Solo se desplaza `main`: así el pie queda fijo sin tapar nunca el foco. */}
          {/* `relative` hace que recorte también los textos `sr-only`, que van en absoluto. */}
          {/* Sin deslizar durante un arrastre: dnd-kit mide justo tras desplazar. */}
          {/* Sin encajar: al coger una Etapa, WebKit saltaba a la siguiente. */}
          <main
            ref={carrusel}
            onFocus={alEnfocar}
            className="relative flex min-h-0 flex-1 snap-x snap-mandatory flex-col overflow-auto carriles:scroll-px-1 not-has-data-dnd-dragging:max-carriles:motion-safe:scroll-smooth has-data-dnd-dragging:snap-none max-carriles:overscroll-x-contain carriles:snap-none"
          >
            {/* `w-max`: sin él, el margen final no cuenta y la última no se centraría. */}
            {/* `min-h-48`: en ventanas bajas, deja sitio en la lista para un Pendiente entero. */}
            <div
              ref={contenedor}
              className="flex min-h-48 flex-1 gap-2.5 px-[7.5vw] pb-4 max-carriles:w-max carriles:px-6"
            >
              <p id={idAyuda} hidden>
                {AYUDA_DE_ARRASTRE}
              </p>
              <p id={idAyudaDeNombre} hidden>
                {AYUDA_DE_NOMBRE}
              </p>
              <p id={idAyudaDeAsa} hidden>
                {AYUDA_DE_ASA}
              </p>
              {visible.etapas.map((etapa) => (
                <Etapa
                  key={etapa.id}
                  etapa={etapa}
                  etapas={visible.etapas}
                  idAyuda={idAyuda}
                  idAyudaDeNombre={idAyudaDeNombre}
                  idAyudaDeAsa={idAyudaDeAsa}
                  onCrear={(titulo) => onCrear(etapa.id, titulo)}
                  onEditar={onEditar}
                  onBorrar={onBorrar}
                  onSubir={onSubir}
                  onBajar={onBajar}
                  onMoverA={onMoverA}
                  onRenombrar={(texto) => onRenombrar(etapa.id, texto)}
                  onMoverIzquierda={() => onMoverEtapaIzquierda(etapa.id)}
                  onMoverDerecha={() => onMoverEtapaDerecha(etapa.id)}
                  onQuitar={() => onQuitarEtapa(etapa.id)}
                  onAnunciar={onAnunciar}
                />
              ))}
              <NuevaEtapa llena={visible.etapas.length >= MAXIMO_DE_ETAPAS} onCrear={onAnadirEtapa} />
            </div>
          </main>
        </>
      )}
    </ZonaDeArrastre>
  )
}
