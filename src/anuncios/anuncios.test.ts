// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  anuncioCambiosSinGuardar,
  anuncioPendienteBorrado,
  anuncioPendienteCreado,
  anuncioPendienteMovido,
  anuncioPendienteRestaurado,
  anuncioTituloDemasiadoLargo,
  anuncioTituloRecuperado,
  avisoPendienteBorrado,
  nombreDeEtiqueta,
  nombreDePendiente,
  textoDeExceso,
} from './anuncios'

describe('anuncioPendienteCreado', () => {
  it('dice el título, la Etapa y la posición', () => {
    expect(anuncioPendienteCreado('Comprar pan', 'Por hacer', 3)).toBe(
      '"Comprar pan" creado en Por hacer, posición 1 de 3',
    )
  })
})

describe('avisoPendienteBorrado', () => {
  it('dice qué se borró', () => {
    expect(avisoPendienteBorrado('Comprar pan')).toBe('"Comprar pan" borrado')
  })
})

describe('anuncioPendienteBorrado', () => {
  it('dice qué se borró y que se puede deshacer', () => {
    expect(anuncioPendienteBorrado('Comprar pan')).toBe(
      '"Comprar pan" borrado. Deshacer disponible',
    )
  })
})

describe('anuncioPendienteRestaurado', () => {
  it('dice el título, la Etapa y la posición', () => {
    expect(anuncioPendienteRestaurado('Comprar pan', 'Por hacer', 2, 3)).toBe(
      '"Comprar pan" restaurado en Por hacer, posición 2 de 3',
    )
  })
})

describe('anuncioPendienteMovido', () => {
  it('dice el título, la Etapa y la posición', () => {
    expect(anuncioPendienteMovido('Comprar pan', 'En curso', 1, 4)).toBe(
      '"Comprar pan" movido a En curso, posición 1 de 4',
    )
  })
})

describe('anuncioTituloDemasiadoLargo', () => {
  it('dice que no se creó y cuántos caracteres sobran', () => {
    expect(anuncioTituloDemasiadoLargo(5)).toBe('Pendiente sin crear. Sobran 5 caracteres')
  })
})

describe('anuncioCambiosSinGuardar', () => {
  it('dice solo qué campo no se guardó', () => {
    expect(anuncioCambiosSinGuardar(-3, 5)).toBe('Nota sin guardar. Sobran 5 caracteres')
    expect(anuncioCambiosSinGuardar(1, 0)).toBe('Título sin guardar. Sobra 1 carácter')
  })

  it('une los dos campos si ninguno se guardó', () => {
    expect(anuncioCambiosSinGuardar(2, 5)).toBe(
      'Título sin guardar. Sobran 2 caracteres. Nota sin guardar. Sobran 5 caracteres',
    )
  })
})

describe('anuncioTituloRecuperado', () => {
  it('dice qué título vuelve', () => {
    expect(anuncioTituloRecuperado('Comprar pan')).toBe('Título vacío. Se recupera "Comprar pan"')
  })
})

describe('nombreDePendiente', () => {
  const pendiente = { id: 'a', titulo: 'Comprar pan' }

  it('es solo el título si no hay más', () => {
    expect(nombreDePendiente(pendiente)).toBe('Comprar pan')
  })

  it('añade la Etiqueta y la nota', () => {
    expect(nombreDePendiente({ ...pendiente, nota: 'Integral', etiqueta: 'rojo' })).toBe(
      'Comprar pan, Etiqueta roja, Tiene nota',
    )
  })

  it.each([
    ['rojo', 'Etiqueta roja'],
    ['naranja', 'Etiqueta naranja'],
    ['amarillo', 'Etiqueta amarilla'],
    ['verde', 'Etiqueta verde'],
    ['azul', 'Etiqueta azul'],
    ['violeta', 'Etiqueta violeta'],
  ] as const)('concuerda con %s', (etiqueta, texto) => {
    expect(nombreDePendiente({ ...pendiente, etiqueta })).toBe(`Comprar pan, ${texto}`)
  })
})

describe('nombreDeEtiqueta', () => {
  it('da el nombre accesible de la Etiqueta', () => {
    expect(nombreDeEtiqueta('amarillo')).toBe('Amarillo')
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
