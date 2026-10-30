// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { tableroDePartida } from './tablero'

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
