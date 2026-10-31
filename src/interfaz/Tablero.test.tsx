import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { tableroDePartida, type Tablero as DatosTablero } from '@/modelo/tablero'
import { Tablero } from './Tablero'

const pintar = (tablero: DatosTablero, props: Partial<Parameters<typeof Tablero>[0]> = {}) =>
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
      onAnadirEtapa={() => true}
      onRenombrar={() => {}}
      onMoverEtapaIzquierda={() => {}}
      onMoverEtapaDerecha={() => {}}
      onQuitarEtapa={() => {}}
      onAnunciar={() => {}}
      {...props}
    />,
  )

const conEtapas = (total: number): DatosTablero => ({
  etapas: Array.from({ length: total }, (_, i) => ({
    id: `etapa-${i}`,
    nombre: `Etapa ${i + 1}`,
    pendientes: [],
  })),
})

const abrirMenu = (nombre: string) =>
  fireEvent.keyDown(screen.getByRole('button', { name: `Menú de la Etapa ${nombre}` }), {
    key: 'Enter',
  })

const opcion = (nombre: string) => screen.getByRole('menuitem', { name: nombre })

const descripcion = (elemento: HTMLElement) =>
  document.getElementById(elemento.getAttribute('aria-describedby')!)?.textContent

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

describe('renombrar una Etapa', () => {
  const abrirCampo = (nombre: string) => {
    fireEvent.click(screen.getByRole('button', { name: nombre }))
    return screen.getByRole('textbox', { name: `Nombre de la Etapa ${nombre}` })
  }

  it('el botón se llama como la Etapa y la acción va como descripción', () => {
    pintar(tableroDePartida())

    expect(descripcion(screen.getByRole('button', { name: 'Hecho' }))).toBe('Renombrar la Etapa')
  })

  it('al editar, la Etapa conserva su región y su encabezado', () => {
    pintar(tableroDePartida())

    abrirCampo('Hecho')

    const etapa = screen.getByRole('region', { name: 'Hecho' })
    expect(within(etapa).getByRole('heading', { level: 2, name: 'Hecho' })).toBeTruthy()
  })

  it('Enter guarda y cierra el campo', () => {
    const onRenombrar = vi.fn()
    pintar(tableroDePartida(), { onRenombrar })
    const campo = abrirCampo('Hecho')

    fireEvent.change(campo, { target: { value: 'Terminado' } })
    fireEvent.submit(campo)

    expect(onRenombrar).toHaveBeenCalledExactlyOnceWith('hecho', 'Terminado')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('salir guarda y cierra el campo', () => {
    const onRenombrar = vi.fn()
    pintar(tableroDePartida(), { onRenombrar })
    const campo = abrirCampo('Hecho')

    fireEvent.change(campo, { target: { value: 'Terminado' } })
    act(() => campo.blur())

    expect(onRenombrar).toHaveBeenCalledExactlyOnceWith('hecho', 'Terminado')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('Escape cierra sin guardar y devuelve el foco, aunque el campo dispare blur', () => {
    const onRenombrar = vi.fn()
    pintar(tableroDePartida(), { onRenombrar })
    const campo = abrirCampo('Hecho')

    fireEvent.change(campo, { target: { value: 'Terminado' } })
    act(() => {
      fireEvent.keyDown(campo, { key: 'Escape' })
      campo.blur()
    })

    expect(onRenombrar).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Hecho' }))
  })

  it('con más de 30 caracteres, Enter lo intenta pero deja el campo abierto', () => {
    const onRenombrar = vi.fn()
    pintar(tableroDePartida(), { onRenombrar })
    const campo = abrirCampo('Hecho')

    fireEvent.change(campo, { target: { value: 'a'.repeat(32) } })
    fireEvent.submit(campo)

    expect(screen.getByRole('textbox')).toBe(campo)
    expect(campo.getAttribute('aria-invalid')).toBe('true')
    expect(descripcion(campo)).toContain('Sobran 2 caracteres. Sin guardar')
  })
})

describe('«Añadir Etapa»', () => {
  const abrirCampo = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Etapa' }))
    return screen.getByRole('textbox', { name: 'Nombre de la nueva Etapa' })
  }

  it('aparece después de la última Etapa', () => {
    pintar(tableroDePartida())

    const boton = screen.getByRole('button', { name: 'Añadir Etapa' })
    const ultima = screen.getByRole('region', { name: 'Hecho' })

    expect(ultima.compareDocumentPosition(boton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('Enter crea y cierra el campo', () => {
    const onAnadirEtapa = vi.fn(() => true)
    pintar(tableroDePartida(), { onAnadirEtapa })
    const campo = abrirCampo()

    fireEvent.change(campo, { target: { value: 'Revisión' } })
    fireEvent.submit(campo)

    expect(onAnadirEtapa).toHaveBeenCalledExactlyOnceWith('Revisión')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('si no se crea, el campo sigue abierto', () => {
    pintar(tableroDePartida(), { onAnadirEtapa: () => false })
    const campo = abrirCampo()

    fireEvent.submit(campo)

    expect(screen.getByRole('textbox')).toBe(campo)
  })

  it('Escape cierra sin crear y devuelve el foco al botón', () => {
    const onAnadirEtapa = vi.fn(() => true)
    pintar(tableroDePartida(), { onAnadirEtapa })
    const campo = abrirCampo()

    fireEvent.change(campo, { target: { value: 'Revisión' } })
    fireEvent.keyDown(campo, { key: 'Escape' })

    expect(onAnadirEtapa).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Añadir Etapa' }))
  })

  it('salir cierra sin crear', () => {
    const onAnadirEtapa = vi.fn(() => true)
    pintar(tableroDePartida(), { onAnadirEtapa })
    const campo = abrirCampo()

    fireEvent.change(campo, { target: { value: 'Revisión' } })
    act(() => campo.blur())

    expect(onAnadirEtapa).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('con 8 Etapas se desactiva, sigue enfocable y explica el motivo', () => {
    pintar(conEtapas(8))

    const boton = screen.getByRole('button', { name: 'Añadir Etapa' })
    fireEvent.click(boton)

    expect(boton.getAttribute('aria-disabled')).toBe('true')
    expect(boton.hasAttribute('disabled')).toBe(false)
    expect(descripcion(boton)).toBe('El Tablero admite hasta 8 Etapas')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('con 7 Etapas no da motivo', () => {
    pintar(conEtapas(7))

    const boton = screen.getByRole('button', { name: 'Añadir Etapa' })

    expect(boton.hasAttribute('aria-disabled')).toBe(false)
    expect(boton.hasAttribute('aria-describedby')).toBe(false)
  })
})

describe('menú de la Etapa', () => {
  it('ofrece mover y borrar', () => {
    const onMoverEtapaIzquierda = vi.fn()
    pintar(tableroDePartida(), { onMoverEtapaIzquierda })

    abrirMenu('En curso')

    expect(opcion('Mover a la derecha')).toBeTruthy()
    expect(opcion('Borrar')).toBeTruthy()
    fireEvent.click(opcion('Mover a la izquierda'))
    expect(onMoverEtapaIzquierda).toHaveBeenCalledExactlyOnceWith('en-curso')
  })

  it('en los extremos desactiva la dirección que no aplica', () => {
    pintar(tableroDePartida())

    abrirMenu('Por hacer')
    expect(opcion('Mover a la izquierda').hasAttribute('data-disabled')).toBe(true)
    expect(opcion('Mover a la derecha').hasAttribute('data-disabled')).toBe(false)
  })

  it('con 1 Etapa, «Borrar» se desactiva, sigue enfocable y explica el motivo', () => {
    const onQuitarEtapa = vi.fn()
    pintar(conEtapas(1), { onQuitarEtapa })

    abrirMenu('Etapa 1')
    const borrar = opcion('Borrar')
    fireEvent.click(borrar)

    expect(borrar.getAttribute('aria-disabled')).toBe('true')
    expect(borrar.hasAttribute('data-disabled')).toBe(false)
    expect(descripcion(borrar)).toBe('El Tablero necesita al menos 1 Etapa')
    expect(onQuitarEtapa).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('con 2 Etapas, «Borrar» no da motivo', () => {
    pintar(conEtapas(2))

    abrirMenu('Etapa 1')

    expect(opcion('Borrar').hasAttribute('aria-disabled')).toBe(false)
    expect(opcion('Borrar').hasAttribute('aria-describedby')).toBe(false)
  })

  it('una Etapa vacía se borra al momento', () => {
    const onQuitarEtapa = vi.fn()
    pintar(tableroDePartida(), { onQuitarEtapa })

    abrirMenu('Hecho')
    fireEvent.click(opcion('Borrar'))

    expect(onQuitarEtapa).toHaveBeenCalledExactlyOnceWith('hecho')
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  describe('con Pendientes', () => {
    const conPendientes = () => {
      const tablero = tableroDePartida()
      tablero.etapas[2].pendientes.push(
        { id: 'a', titulo: 'Comprar pan' },
        { id: 'b', titulo: 'Regar' },
      )
      return tablero
    }

    it('la confirmación dice cuántos se borrarán, sin ofrecer moverlos', () => {
      const onQuitarEtapa = vi.fn()
      pintar(conPendientes(), { onQuitarEtapa })

      abrirMenu('Hecho')
      fireEvent.click(opcion('Borrar'))

      const dialogo = screen.getByRole('alertdialog', { name: 'Borrar la Etapa Hecho' })
      expect(descripcion(dialogo)).toBe('Se borrarán 2 Pendientes.')
      expect(dialogo.textContent).not.toContain('Mover')
      expect(onQuitarEtapa).not.toHaveBeenCalled()
    })

    it('confirmar borra', () => {
      const onQuitarEtapa = vi.fn()
      pintar(conPendientes(), { onQuitarEtapa })

      abrirMenu('Hecho')
      fireEvent.click(opcion('Borrar'))
      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Borrar' }))

      expect(onQuitarEtapa).toHaveBeenCalledExactlyOnceWith('hecho')
    })

    it('«Cancelar» no borra', () => {
      const onQuitarEtapa = vi.fn()
      pintar(conPendientes(), { onQuitarEtapa })

      abrirMenu('Hecho')
      fireEvent.click(opcion('Borrar'))
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

      expect(onQuitarEtapa).not.toHaveBeenCalled()
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })
})
