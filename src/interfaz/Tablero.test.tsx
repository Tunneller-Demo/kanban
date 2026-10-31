import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { tableroDePartida, type Tablero as DatosTablero } from '@/modelo/tablero'
import { Tablero } from './Tablero'

const pintar = (tablero: DatosTablero) =>
  render(
    <Tablero
      tablero={tablero}
      foco={null}
      onCrear={() => true}
      onEditar={() => {}}
      onBorrar={() => {}}
      onSubir={() => {}}
      onBajar={() => {}}
      onMoverA={() => {}}
      onSoltar={() => {}}
      onDejar={() => {}}
      onAnunciar={() => {}}
    />,
  )

describe('Tablero', () => {
  it('muestra cada Etapa como sección con su encabezado', () => {
    pintar(tableroDePartida())

    for (const nombre of ['Por hacer', 'En curso', 'Hecho']) {
      const etapa = screen.getByRole('region', { name: nombre })
      expect(within(etapa).getByRole('heading', { level: 2, name: nombre })).toBeTruthy()
    }
  })

  it('cuenta los Pendientes de cada Etapa', () => {
    const tablero = tableroDePartida()
    tablero.etapas[1].pendientes.push(
      { id: 'a', titulo: 'Comprar pan' },
      { id: 'b', titulo: 'Llamar al banco' },
    )
    pintar(tablero)

    expect(screen.getByRole('region', { name: 'Por hacer' }).textContent).toContain('0 Pendientes')
    expect(screen.getByRole('region', { name: 'En curso' }).textContent).toContain('2 Pendientes')
  })

  it('dice la Etiqueta y si hay nota en el nombre del Pendiente', () => {
    const tablero = tableroDePartida()
    tablero.etapas[0].pendientes.push(
      { id: 'a', titulo: 'Comprar pan', nota: 'Integral', etiqueta: 'rojo' },
      { id: 'b', titulo: 'Llamar al banco' },
    )
    pintar(tablero)

    expect(
      screen.getByRole('button', { name: 'Comprar pan, Etiqueta roja, Tiene nota' }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Llamar al banco' })).toBeTruthy()
  })

  it('el botón «⋮» va junto al que abre el Pendiente, nunca dentro', () => {
    const tablero = tableroDePartida()
    tablero.etapas[0].pendientes.push({ id: 'a', titulo: 'Comprar pan' })
    pintar(tablero)

    const abrir = screen.getByRole('button', { name: 'Comprar pan' })
    const menu = screen.getByRole('button', { name: 'Mover "Comprar pan"' })

    expect(menu.parentElement).toBe(abrir.parentElement)
    expect(abrir.contains(menu)).toBe(false)
    expect(menu.getAttribute('aria-haspopup')).toBe('menu')
  })
})
