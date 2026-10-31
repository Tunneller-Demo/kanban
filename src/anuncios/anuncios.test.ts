// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  anuncioCambiosSinGuardar,
  anuncioEtapaBorrada,
  anuncioEtapaCogida,
  anuncioEtapaCreada,
  anuncioEtapaMovida,
  anuncioEtapaRenombrada,
  anuncioEtapaRestaurada,
  anuncioEtapaSinCrear,
  anuncioEtapaSinMover,
  anuncioEtapaSobre,
  anuncioNombreRecuperado,
  anuncioNombreSinGuardar,
  anuncioPendienteBorrado,
  anuncioPendienteCogido,
  anuncioPendienteCreado,
  anuncioPendienteMovido,
  anuncioPendienteRestaurado,
  anuncioTableroVaciado,
  textoDeConfirmacionDeVaciar,
  anuncioPendienteSinMover,
  anuncioPendienteSobre,
  anuncioTituloDemasiadoLargo,
  anuncioTituloRecuperado,
  avisoEtapaBorrada,
  avisoPendienteBorrado,
  MOTIVO_SIN_ANADIR_ETAPA,
  MOTIVO_SIN_BORRAR_ETAPA,
  nombreDeEtiqueta,
  nombreDePendiente,
  textoDeConfirmacionDeEtapa,
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

describe('anuncios del arrastre', () => {
  it('dicen el título, la Etapa y la posición en cada momento', () => {
    expect(anuncioPendienteCogido('Comprar pan', 'Por hacer', 1, 2)).toBe(
      '"Comprar pan" cogido en Por hacer, posición 1 de 2',
    )
    expect(anuncioPendienteSobre('Comprar pan', 'En curso', 2, 3)).toBe(
      '"Comprar pan" sobre En curso, posición 2 de 3',
    )
    expect(anuncioPendienteSinMover('Comprar pan', 'Por hacer', 1, 2)).toBe(
      '"Comprar pan" sigue en Por hacer, posición 1 de 2',
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

describe('anuncios de Etapa', () => {
  it('al moverla dice la posición con la frase de la Especificación', () => {
    expect(anuncioEtapaMovida('Hecho', 2, 3)).toBe('Etapa Hecho movida a la posición 2 de 3')
  })

  it('al arrastrarla dice la posición en cada momento', () => {
    expect(anuncioEtapaCogida('Hecho', 3, 3)).toBe('Etapa Hecho cogida, posición 3 de 3')
    expect(anuncioEtapaSobre('Hecho', 2, 3)).toBe('Etapa Hecho sobre la posición 2 de 3')
    expect(anuncioEtapaSinMover('Hecho', 3, 3)).toBe('Etapa Hecho sigue en la posición 3 de 3')
  })

  it('al añadirla dice la posición', () => {
    expect(anuncioEtapaCreada('Revisión', 4)).toBe('Etapa Revisión añadida, posición 4 de 4')
  })

  it('al renombrarla dice el nombre nuevo', () => {
    expect(anuncioEtapaRenombrada('Revisión')).toBe('Etapa renombrada a Revisión')
  })

  it('al borrarla dice qué se borró y que se puede deshacer', () => {
    expect(avisoEtapaBorrada('Hecho')).toBe('Etapa Hecho borrada')
    expect(anuncioEtapaBorrada('Hecho', 0)).toBe('Etapa Hecho borrada. Deshacer disponible')
  })

  it('al borrarla dice cuántos Pendientes se fueron con ella', () => {
    expect(anuncioEtapaBorrada('Hecho', 1)).toBe(
      'Etapa Hecho borrada con 1 Pendiente. Deshacer disponible',
    )
    expect(anuncioEtapaBorrada('Hecho', 3)).toBe(
      'Etapa Hecho borrada con 3 Pendientes. Deshacer disponible',
    )
  })

  it('al restaurarla dice la posición', () => {
    expect(anuncioEtapaRestaurada('Hecho', 2, 3)).toBe('Etapa Hecho restaurada, posición 2 de 3')
  })

  it('dice qué nombre vuelve y por qué no se guardó', () => {
    expect(anuncioNombreRecuperado('Hecho')).toBe('Nombre vacío. Se recupera "Hecho"')
    expect(anuncioNombreSinGuardar(5)).toBe('Nombre sin guardar. Sobran 5 caracteres')
    expect(anuncioEtapaSinCrear(1)).toBe('Etapa sin crear. Sobra 1 carácter')
  })
})

describe('textos de los límites de Etapas', () => {
  it('la confirmación dice cuántos Pendientes se borrarán', () => {
    expect(textoDeConfirmacionDeEtapa(1)).toBe('Se borrará 1 Pendiente.')
    expect(textoDeConfirmacionDeEtapa(3)).toBe('Se borrarán 3 Pendientes.')
  })

  it('los motivos citan los límites del Modelo', () => {
    expect(MOTIVO_SIN_BORRAR_ETAPA).toBe('El Tablero necesita al menos 1 Etapa')
    expect(MOTIVO_SIN_ANADIR_ETAPA).toBe('El Tablero admite hasta 8 Etapas')
  })
})

describe('textos de Vaciar', () => {
  it('anuncia cuántos Pendientes quitó', () => {
    expect(anuncioTableroVaciado(1)).toBe('Tablero vaciado. 1 Pendiente quitado')
    expect(anuncioTableroVaciado(6)).toBe('Tablero vaciado. 6 Pendientes quitados')
  })

  it('la confirmación dice qué se pierde y qué se conserva', () => {
    expect(textoDeConfirmacionDeVaciar(1)).toBe(
      'Se borrará 1 Pendiente y no se podrá deshacer. Las Etapas se conservan.',
    )
    expect(textoDeConfirmacionDeVaciar(3)).toBe(
      'Se borrarán 3 Pendientes y no se podrá deshacer. Las Etapas se conservan.',
    )
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
