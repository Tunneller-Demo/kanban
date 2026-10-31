// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { crearPendiente, esTablero, tableroDePartida } from './tablero'

describe('tableroDePartida', () => {
  it('trae las tres Etapas de partida en orden', () => {
    const nombres = tableroDePartida().etapas.map((etapa) => etapa.nombre)

    expect(nombres).toEqual(['Por hacer', 'En curso', 'Hecho'])
  })

  it('empieza sin Pendientes', () => {
    for (const etapa of tableroDePartida().etapas) {
      expect(etapa.pendientes).toEqual([])
    }
  })

  it('da a cada Etapa un id propio', () => {
    const ids = tableroDePartida().etapas.map((etapa) => etapa.id)

    expect(new Set(ids).size).toBe(3)
  })

  it('no comparte estado entre dos Tableros', () => {
    const primero = tableroDePartida()
    const segundo = tableroDePartida()

    expect(segundo).toEqual(primero)
    expect(segundo.etapas).not.toBe(primero.etapas)
    expect(segundo.etapas[0].pendientes).not.toBe(primero.etapas[0].pendientes)
  })
})

describe('crearPendiente', () => {
  it('pone el Pendiente arriba de su Etapa', () => {
    const conUno = crearPendiente(tableroDePartida(), 'en-curso', 'Comprar pan', 'a')
    const conDos = crearPendiente(conUno, 'en-curso', 'Llamar al banco', 'b')

    expect(conDos.etapas[1].pendientes).toEqual([
      { id: 'b', titulo: 'Llamar al banco' },
      { id: 'a', titulo: 'Comprar pan' },
    ])
  })

  it('deja intactas las demás Etapas', () => {
    const tablero = crearPendiente(tableroDePartida(), 'en-curso', 'Comprar pan', 'a')

    expect(tablero.etapas[0].pendientes).toEqual([])
    expect(tablero.etapas[2].pendientes).toEqual([])
  })

  it('no modifica el Tablero que recibe', () => {
    const tablero = tableroDePartida()

    crearPendiente(tablero, 'por-hacer', 'Comprar pan', 'a')

    expect(tablero).toEqual(tableroDePartida())
  })

  it('recorta los espacios de los extremos del título', () => {
    const tablero = crearPendiente(tableroDePartida(), 'por-hacer', '  Comprar  pan\t', 'a')

    expect(tablero.etapas[0].pendientes[0].titulo).toBe('Comprar  pan')
  })

  it.each([
    ['vacío', ''],
    ['solo con espacios', '  \t '],
    ['de 121 caracteres', 'a'.repeat(121)],
  ])('devuelve el mismo Tablero con un título %s', (_, titulo) => {
    const tablero = tableroDePartida()

    expect(crearPendiente(tablero, 'por-hacer', titulo, 'a')).toBe(tablero)
  })

  it('admite 120 caracteres, sin contar los espacios de los extremos', () => {
    const titulo = 'a'.repeat(120)
    const tablero = crearPendiente(tableroDePartida(), 'por-hacer', ` ${titulo} `, 'a')

    expect(tablero.etapas[0].pendientes[0].titulo).toBe(titulo)
  })

  it('devuelve el mismo Tablero si la Etapa no existe', () => {
    const tablero = tableroDePartida()

    expect(crearPendiente(tablero, 'no-existe', 'Comprar pan', 'a')).toBe(tablero)
  })
})

describe('esTablero', () => {
  const pendiente = { id: 'a', titulo: 'Comprar pan' }
  const conPendiente = (extra: object) => ({
    etapas: [{ id: 'e', nombre: 'Por hacer', pendientes: [{ ...pendiente, ...extra }] }],
  })
  const etapas = (total: number) =>
    Array.from({ length: total }, (_, i) => ({ id: `e${i}`, nombre: 'Etapa', pendientes: [] }))

  it('acepta el Tablero de partida', () => {
    expect(esTablero(tableroDePartida())).toBe(true)
  })

  it('acepta un Pendiente con nota y Etiqueta', () => {
    expect(esTablero(conPendiente({ nota: 'Integral', etiqueta: 'azul' }))).toBe(true)
  })

  it('acepta ocho Etapas', () => {
    expect(esTablero({ etapas: etapas(8) })).toBe(true)
  })

  it.each([
    ['nulo', null],
    ['un texto', 'tablero'],
    ['sin Etapas', { etapas: [] }],
    ['con nueve Etapas', { etapas: etapas(9) }],
    ['con Etapas que no son lista', { etapas: {} }],
    ['con Pendientes que no son lista', { etapas: [{ id: 'e', nombre: 'Etapa', pendientes: 1 }] }],
    ['con un nombre de Etapa vacío', { etapas: [{ id: 'e', nombre: ' ', pendientes: [] }] }],
    [
      'con un nombre de Etapa de 31 caracteres',
      { etapas: [{ id: 'e', nombre: 'a'.repeat(31), pendientes: [] }] },
    ],
    ['con un título vacío', conPendiente({ titulo: ' ' })],
    ['con un título sin recortar', conPendiente({ titulo: ' Comprar pan' })],
    ['con un título de 121 caracteres', conPendiente({ titulo: 'a'.repeat(121) })],
    ['con un Pendiente sin id', conPendiente({ id: 1 })],
    ['con una nota de 2001 caracteres', conPendiente({ nota: 'a'.repeat(2001) })],
    ['con una Etiqueta desconocida', conPendiente({ etiqueta: 'fucsia' })],
    [
      'con ids de Etapa repetidos',
      { etapas: [etapas(1)[0], etapas(1)[0]] },
    ],
    [
      'con ids de Pendiente repetidos',
      { etapas: [{ id: 'e', nombre: 'Etapa', pendientes: [pendiente, pendiente] }] },
    ],
  ])('rechaza un valor %s', (_, valor) => {
    expect(esTablero(valor)).toBe(false)
  })
})
