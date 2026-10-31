import { useEffect, useRef, useState, type RefObject } from 'react'
import { cn } from '@/lib/utils'
import type { Etapa } from '@/modelo/tablero'
import { ContadorDePendientes } from './ContadorDePendientes'

type Props = {
  etapas: Etapa[]
  carrusel: RefObject<HTMLElement | null>
}

// «Añadir Etapa» también encaja: el recorrido completo da justo un paso por Etapa.
function pasoDe(carrusel: HTMLElement, total: number) {
  return (carrusel.scrollWidth - carrusel.clientWidth) / total
}

// Navegación y no `tablist`: todas las Etapas siguen en la página.
export function PestanasDeEtapa({ etapas, carrusel }: Props) {
  const total = etapas.length
  const [indice, setIndice] = useState(0)
  const activa = Math.min(indice, total - 1)
  const pestanaActiva = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const nodo = carrusel.current
    if (!nodo) return

    // Sin desborde no hay paso: pasa al ensanchar la ventana.
    const alDesplazar = () => {
      const paso = pasoDe(nodo, total)
      setIndice(paso ? Math.round(nodo.scrollLeft / paso) : 0)
    }
    nodo.addEventListener('scroll', alDesplazar, { passive: true })
    return () => nodo.removeEventListener('scroll', alDesplazar)
  }, [carrusel, total])

  // Con 8 Etapas no caben todas.
  useEffect(() => {
    pestanaActiva.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activa])

  function irA(posicion: number, behavior?: ScrollBehavior) {
    const nodo = carrusel.current
    if (nodo) nodo.scrollTo({ left: pasoDe(nodo, total) * posicion, behavior })
  }

  // Al borrar la última, «Añadir Etapa» ocupa su sitio. Solo al cambiar `total`: quien
  // desliza hasta «Añadir Etapa» debe poder quedarse ahí.
  useEffect(() => {
    if (indice >= total) irA(total - 1, 'instant')
  }, [total])

  return (
    // `relative` hace que recorte también los textos `sr-only`, que van en absoluto.
    <nav
      aria-label="Etapas"
      className="relative flex-none scroll-px-4 overflow-x-auto motion-safe:scroll-smooth carriles:hidden"
    >
      <ul className="flex w-max gap-2 px-4 py-1">
        {etapas.map((etapa, posicion) => (
          <li key={etapa.id}>
            <button
              ref={posicion === activa ? pestanaActiva : undefined}
              type="button"
              aria-current={posicion === activa ? 'true' : undefined}
              onClick={() => irA(posicion)}
              className={cn(
                'flex min-h-11 max-w-[60vw] items-center gap-1.5 rounded-md px-2.5 text-[13px]',
                posicion === activa
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <span className="truncate">{etapa.nombre}</span>
              <ContadorDePendientes total={etapa.pendientes.length} />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
