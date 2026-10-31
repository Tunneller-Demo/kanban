import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { claveDeAlmacenamiento } from '@/persistencia/clave'
import { useEstadoDeLaApp } from './useEstadoDeLaApp'

const preparar = () => {
  const { result } = renderHook(() => useEstadoDeLaApp())
  const crear = (titulo: string) => act(() => void result.current.crear('por-hacer', titulo))
  const pendientes = () => result.current.tablero.etapas[0].pendientes
  const titulos = () => pendientes().map((pendiente) => pendiente.titulo)
  const idDe = (titulo: string) =>
    pendientes().find((pendiente) => pendiente.titulo === titulo)!.id
  const borrar = (titulo: string) => act(() => result.current.borrar(idDe(titulo)))
  return { result, crear, pendientes, titulos, idDe, borrar }
}

const guardado = () => JSON.parse(localStorage.getItem(claveDeAlmacenamiento())!).tablero

beforeEach(() => localStorage.clear())

describe('borrar y Deshacer', () => {
  it('«Deshacer» devuelve el Pendiente a su posición, con su nota y su Etiqueta', () => {
    const { result, crear, idDe, borrar, titulos } = preparar()
    crear('Regar')
    crear('Comprar pan')
    crear('Llamar al banco')
    act(() => result.current.editar(idDe('Comprar pan'), { nota: 'Integral', etiqueta: 'azul' }))
    const antes = result.current.tablero

    borrar('Comprar pan')
    expect(titulos()).toEqual(['Llamar al banco', 'Regar'])

    act(() => result.current.deshacer())

    expect(result.current.tablero).toEqual(antes)
    expect(guardado()).toEqual(antes)
  })

  it('ofrece el aviso y anuncia el borrado y la restauración', () => {
    const { result, crear, borrar } = preparar()
    crear('Regar')
    crear('Comprar pan')

    borrar('Comprar pan')
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
    expect(result.current.anuncio).toBe('"Comprar pan" borrado. Deshacer disponible')

    act(() => result.current.deshacer())
    expect(result.current.avisoDeDeshacer).toBeNull()
    expect(result.current.anuncio).toBe('"Comprar pan" restaurado en Por hacer, posición 1 de 2')
  })

  it('el siguiente cambio en el Tablero retira el aviso', () => {
    const { result, crear, borrar } = preparar()
    crear('Regar')
    crear('Comprar pan')

    borrar('Comprar pan')
    crear('Llamar al banco')

    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('un intento que no cambia nada conserva el aviso', () => {
    const { result, crear, idDe, borrar } = preparar()
    crear('Regar')
    crear('Comprar pan')

    borrar('Comprar pan')
    crear('')
    act(() => result.current.editar(idDe('Regar'), { titulo: 'Regar' }))

    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })

  it('cerrar el aviso conserva el borrado', () => {
    const { result, crear, borrar, titulos } = preparar()
    crear('Regar')
    crear('Comprar pan')

    borrar('Comprar pan')
    act(() => result.current.cerrarAviso())

    expect(result.current.avisoDeDeshacer).toBeNull()
    expect(titulos()).toEqual(['Regar'])
  })

  it('solo hay un «Deshacer»: recupera el último borrado', () => {
    const { result, crear, borrar, titulos } = preparar()
    crear('Regar')
    crear('Comprar pan')

    borrar('Comprar pan')
    borrar('Regar')
    expect(result.current.avisoDeDeshacer).toBe('"Regar" borrado')

    act(() => result.current.deshacer())

    expect(titulos()).toEqual(['Regar'])
    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('con datos dañados, borrar y «Deshacer» no los sobrescriben', () => {
    localStorage.setItem(claveDeAlmacenamiento(), 'datos dañados')
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')

    borrar('Comprar pan')
    act(() => result.current.deshacer())

    expect(localStorage.getItem(claveDeAlmacenamiento())).toBe('datos dañados')
  })

  it('borrar un Pendiente que no existe no ofrece «Deshacer»', () => {
    const { result } = preparar()

    act(() => result.current.borrar('no-existe'))

    expect(result.current.avisoDeDeshacer).toBeNull()
  })
})

describe('foco', () => {
  it('tras borrar va al siguiente; si no hay, al anterior; si no, al botón de crear', () => {
    const { result, crear, idDe, borrar } = preparar()
    crear('Tercero')
    crear('Segundo')
    crear('Primero')
    const segundo = idDe('Segundo')

    borrar('Primero')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id: segundo })

    borrar('Tercero')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id: segundo })

    borrar('Segundo')
    expect(result.current.foco).toEqual({ tipo: 'crear', id: 'por-hacer' })
  })

  it('tras «Deshacer» va al Pendiente restaurado', () => {
    const { result, crear, idDe, borrar } = preparar()
    crear('Comprar pan')
    const id = idDe('Comprar pan')

    borrar('Comprar pan')
    act(() => result.current.deshacer())

    expect(result.current.foco).toEqual({ tipo: 'pendiente', id })
  })

  it('al cerrar el aviso vuelve a pedirse donde quedó tras borrar', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')

    borrar('Comprar pan')
    const trasBorrar = result.current.foco
    act(() => result.current.cerrarAviso())

    expect(result.current.foco).toEqual(trasBorrar)
  })
})
