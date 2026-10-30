import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { tableroDePartida } from '@/modelo/tablero'
import { Tablero } from './Tablero'

describe('Tablero', () => {
  it('muestra cada Etapa como sección con su encabezado', () => {
    render(<Tablero tablero={tableroDePartida()} />)

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
    render(<Tablero tablero={tablero} />)

    expect(screen.getByRole('region', { name: 'Por hacer' }).textContent).toContain('0 Pendientes')
    expect(screen.getByRole('region', { name: 'En curso' }).textContent).toContain('2 Pendientes')
  })
})
