// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { anuncioPendienteCreado, anuncioTituloDemasiadoLargo, textoDeExceso } from './anuncios'

describe('anuncioPendienteCreado', () => {
  it('dice el título, la Etapa y la posición', () => {
    expect(anuncioPendienteCreado('Comprar pan', 'Por hacer', 3)).toBe(
      '"Comprar pan" creado en Por hacer, posición 1 de 3',
    )
  })
})

describe('anuncioTituloDemasiadoLargo', () => {
  it('dice que no se creó y cuántos caracteres sobran', () => {
    expect(anuncioTituloDemasiadoLargo(5)).toBe('Pendiente sin crear. Sobran 5 caracteres')
  })
})

describe('textoDeExceso', () => {
  it('usa el plural con varios caracteres', () => {
    expect(textoDeExceso(2)).toBe('Sobran 2 caracteres')
  })

  it('usa el singular con un carácter', () => {
    expect(textoDeExceso(1)).toBe('Sobra 1 carácter')
  })
})
