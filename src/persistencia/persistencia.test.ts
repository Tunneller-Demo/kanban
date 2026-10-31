import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearPendiente, tableroDePartida } from '@/modelo/tablero'
import { claveDeAlmacenamiento } from './clave'
import { cargarTablero, escucharOtrasPestanas, guardarTablero } from './persistencia'

const clave = claveDeAlmacenamiento()

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('cargarTablero', () => {
  it('reconoce la primera visita', () => {
    expect(cargarTablero()).toEqual({ tipo: 'primera-visita' })
  })

  it('devuelve el Tablero guardado', () => {
    const tablero = crearPendiente(tableroDePartida(), 'hecho', 'Comprar pan', 'a')
    guardarTablero(tablero, false)

    expect(cargarTablero()).toEqual({ tipo: 'guardado', tablero, ejemploIntacto: false })
  })

  it('conserva que el Tablero de ejemplo sigue intacto', () => {
    guardarTablero(tableroDePartida(), true)

    expect(cargarTablero()).toMatchObject({ tipo: 'guardado', ejemploIntacto: true })
  })

  it('un guardado sin esa marca cuenta como no intacto', () => {
    localStorage.setItem(clave, JSON.stringify({ version: 1, tablero: tableroDePartida() }))

    expect(cargarTablero()).toMatchObject({ tipo: 'guardado', ejemploIntacto: false })
  })

  it.each([
    ['un JSON inválido', '{no es json'],
    ['otra forma', '{"hola":1}'],
    ['otra versión', JSON.stringify({ version: 2, tablero: tableroDePartida() })],
    ['un Tablero que rompe las reglas', JSON.stringify({ version: 1, tablero: { etapas: [] } })],
    ['un valor nulo', 'null'],
  ])('trata %s como datos dañados y conserva el contenido', (_, contenido) => {
    localStorage.setItem(clave, contenido)

    expect(cargarTablero()).toEqual({ tipo: 'danado', contenido })
  })

  it('trata como primera visita un almacenamiento que no se puede leer', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })

    expect(cargarTablero()).toEqual({ tipo: 'primera-visita' })
  })
})

describe('guardarTablero', () => {
  it('informa del éxito', () => {
    expect(guardarTablero(tableroDePartida(), false)).toBe('guardado')
  })

  it('informa del fallo', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Sin espacio', 'QuotaExceededError')
    })

    expect(guardarTablero(tableroDePartida(), false)).toBe('fallo')
  })

  it('funciona de nuevo cuando el almacenamiento se recupera', () => {
    const espia = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Sin espacio', 'QuotaExceededError')
    })
    guardarTablero(tableroDePartida(), false)
    espia.mockRestore()

    expect(guardarTablero(tableroDePartida(), false)).toBe('guardado')
    expect(cargarTablero()).toEqual({
      tipo: 'guardado',
      tablero: tableroDePartida(),
      ejemploIntacto: false,
    })
  })
})

describe('escucharOtrasPestanas', () => {
  const otraPestanaEscribe = (key: string | null, newValue: string | null) =>
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
  const guardadoDe = (ejemploIntacto: boolean) =>
    JSON.stringify({ version: 1, tablero: tableroDePartida(), ejemploIntacto })

  it('entrega el Tablero que guarda otra pestaña, con su marca', () => {
    const avisar = vi.fn()
    const dejarDeEscuchar = escucharOtrasPestanas(avisar)

    otraPestanaEscribe(clave, guardadoDe(true))
    dejarDeEscuchar()

    expect(avisar).toHaveBeenCalledExactlyOnceWith({
      tipo: 'guardado',
      tablero: tableroDePartida(),
      ejemploIntacto: true,
    })
  })

  it.each<[string, string | null, string | null]>([
    ['otra clave', 'otra-clave', guardadoDe(false)],
    ['un borrado', clave, null],
    ['localStorage.clear()', null, null],
    ['un contenido dañado', clave, 'datos dañados'],
    ['otra versión', clave, JSON.stringify({ version: 2, tablero: tableroDePartida() })],
  ])('ignora %s', (_, key, newValue) => {
    const avisar = vi.fn()
    const dejarDeEscuchar = escucharOtrasPestanas(avisar)

    otraPestanaEscribe(key, newValue)
    dejarDeEscuchar()

    expect(avisar).not.toHaveBeenCalled()
  })

  it('tras darse de baja no avisa', () => {
    const avisar = vi.fn()
    escucharOtrasPestanas(avisar)()

    otraPestanaEscribe(clave, guardadoDe(false))

    expect(avisar).not.toHaveBeenCalled()
  })
})
