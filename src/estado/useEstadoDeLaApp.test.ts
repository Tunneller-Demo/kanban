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

describe('mover', () => {
  it('«Mover a» lleva el Pendiente arriba, lo guarda, lo anuncia y le deja el foco', () => {
    const { result, crear, idDe } = preparar()
    crear('Comprar pan')
    act(() => void result.current.crear('en-curso', 'Regar'))
    const id = idDe('Comprar pan')

    act(() => result.current.moverA(id, 'en-curso'))

    const enCurso = result.current.tablero.etapas[1].pendientes
    expect(enCurso.map((pendiente) => pendiente.titulo)).toEqual(['Comprar pan', 'Regar'])
    expect(guardado()).toEqual(result.current.tablero)
    expect(result.current.anuncio).toBe('"Comprar pan" movido a En curso, posición 1 de 2')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id })
  })

  it('«Subir» y «Bajar» anuncian la posición nueva en su Etapa', () => {
    const { result, crear, idDe, titulos } = preparar()
    crear('Regar')
    crear('Comprar pan')
    const id = idDe('Regar')

    act(() => result.current.subir(id))
    expect(titulos()).toEqual(['Regar', 'Comprar pan'])
    expect(result.current.anuncio).toBe('"Regar" movido a Por hacer, posición 1 de 2')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id })

    act(() => result.current.bajar(id))
    expect(titulos()).toEqual(['Comprar pan', 'Regar'])
    expect(result.current.anuncio).toBe('"Regar" movido a Por hacer, posición 2 de 2')
  })

  it('mover retira el aviso de «Deshacer» y no ofrece otro', () => {
    const { result, crear, idDe, borrar } = preparar()
    crear('Regar')
    crear('Comprar pan')
    crear('Llamar al banco')
    borrar('Comprar pan')

    act(() => result.current.subir(idDe('Regar')))

    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('un movimiento sin efecto no anuncia, no pide foco y conserva el aviso', () => {
    const { result, crear, idDe, borrar } = preparar()
    crear('Regar')
    crear('Comprar pan')
    borrar('Comprar pan')
    const { anuncio, foco } = result.current
    const id = idDe('Regar')

    act(() => result.current.subir(id))
    act(() => result.current.bajar(id))
    act(() => result.current.moverA(id, 'por-hacer'))

    expect(result.current.anuncio).toBe(anuncio)
    expect(result.current.foco).toBe(foco)
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })

  it('soltar deja el Pendiente en la Etapa y el índice pedidos, lo guarda y lo anuncia', () => {
    const { result, crear, idDe } = preparar()
    crear('Comprar pan')
    act(() => void result.current.crear('en-curso', 'Pagar'))
    act(() => void result.current.crear('en-curso', 'Regar'))
    const id = idDe('Comprar pan')

    act(() => result.current.soltar(id, 'en-curso', 1))

    const enCurso = result.current.tablero.etapas[1].pendientes
    expect(enCurso.map((pendiente) => pendiente.titulo)).toEqual(['Regar', 'Comprar pan', 'Pagar'])
    expect(guardado()).toEqual(result.current.tablero)
    expect(result.current.anuncio).toBe('"Comprar pan" movido a En curso, posición 2 de 3')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id })
  })

  it('soltar en el mismo sitio no cambia nada, pero devuelve el foco y lo dice', () => {
    const { result, crear, idDe, borrar } = preparar()
    crear('Regar')
    crear('Comprar pan')
    borrar('Comprar pan')
    const antes = result.current.tablero
    const id = idDe('Regar')

    act(() => result.current.soltar(id, 'por-hacer', 0))

    expect(result.current.tablero).toBe(antes)
    expect(result.current.anuncio).toBe('"Regar" sigue en Por hacer, posición 1 de 1')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id })
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })

  it('dejar un Pendiente sin mover devuelve el foco y lo dice', () => {
    const { result, crear, idDe } = preparar()
    crear('Regar')
    crear('Comprar pan')
    const antes = result.current.tablero
    const id = idDe('Regar')

    act(() => result.current.dejar(id))

    expect(result.current.tablero).toBe(antes)
    expect(result.current.anuncio).toBe('"Regar" sigue en Por hacer, posición 2 de 2')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id })
  })

  it('con datos dañados, mover no los sobrescribe', () => {
    localStorage.setItem(claveDeAlmacenamiento(), 'datos dañados')
    const { result, crear, idDe } = preparar()
    crear('Comprar pan')

    act(() => result.current.moverA(idDe('Comprar pan'), 'hecho'))

    expect(localStorage.getItem(claveDeAlmacenamiento())).toBe('datos dañados')
  })
})

describe('Etapas', () => {
  const nombres = (result: ReturnType<typeof preparar>['result']) =>
    result.current.tablero.etapas.map((etapa) => etapa.nombre)

  it('renombrar guarda el nombre recortado, lo anuncia y retira el aviso', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')

    act(() => result.current.renombrar('hecho', '  Terminado  '))

    expect(nombres(result)).toEqual(['Por hacer', 'En curso', 'Terminado'])
    expect(guardado()).toEqual(result.current.tablero)
    expect(result.current.anuncio).toBe('Etapa renombrada a Terminado')
    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('renombrar a vacío recupera el nombre y lo anuncia sin retirar el aviso', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')
    const antes = result.current.tablero

    act(() => result.current.renombrar('hecho', '   '))

    expect(result.current.tablero).toBe(antes)
    expect(result.current.anuncio).toBe('Nombre vacío. Se recupera "Hecho"')
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })

  it('renombrar con más de 30 caracteres conserva el anterior y dice cuántos sobran', () => {
    const { result } = preparar()
    const antes = result.current.tablero

    act(() => result.current.renombrar('hecho', 'a'.repeat(32)))

    expect(result.current.tablero).toBe(antes)
    expect(result.current.anuncio).toBe('Nombre sin guardar. Sobran 2 caracteres')
  })

  it('renombrar al mismo nombre no anuncia y conserva el aviso', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')
    const { anuncio } = result.current

    act(() => result.current.renombrar('hecho', 'Hecho'))

    expect(result.current.anuncio).toBe(anuncio)
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })

  it('añadir crea la Etapa al final, la anuncia y lleva el foco a su botón de crear', () => {
    const { result } = preparar()
    let creada = false

    act(() => {
      creada = result.current.anadirEtapa(' Revisión ')
    })

    const nueva = result.current.tablero.etapas[3]
    expect(creada).toBe(true)
    expect(nueva.nombre).toBe('Revisión')
    expect(guardado()).toEqual(result.current.tablero)
    expect(result.current.anuncio).toBe('Etapa Revisión añadida, posición 4 de 4')
    expect(result.current.foco).toEqual({ tipo: 'crear', id: nueva.id })
  })

  it('añadir un nombre que no vale no crea nada y dice qué sobra', () => {
    const { result } = preparar()
    const antes = result.current.tablero
    let creada = true

    act(() => {
      creada = result.current.anadirEtapa('')
    })
    expect(creada).toBe(false)
    expect(result.current.anuncio).toBe('')

    act(() => {
      creada = result.current.anadirEtapa('a'.repeat(31))
    })
    expect(creada).toBe(false)
    expect(result.current.tablero).toBe(antes)
    expect(result.current.anuncio).toBe('Etapa sin crear. Sobra 1 carácter')
  })

  it('con 8 Etapas no añade otra', () => {
    const { result } = preparar()
    for (let i = 4; i <= 8; i++) act(() => void result.current.anadirEtapa(`Etapa ${i}`))
    const antes = result.current.tablero

    act(() => void result.current.anadirEtapa('Novena'))

    expect(result.current.tablero).toBe(antes)
  })

  it('mover anuncia la posición con la frase de la Especificación y deja el foco', () => {
    const { result } = preparar()

    act(() => result.current.moverEtapaIzquierda('hecho'))

    expect(nombres(result)).toEqual(['Por hacer', 'Hecho', 'En curso'])
    expect(guardado()).toEqual(result.current.tablero)
    expect(result.current.anuncio).toBe('Etapa Hecho movida a la posición 2 de 3')
    expect(result.current.foco).toEqual({ tipo: 'etapa', id: 'hecho' })

    act(() => result.current.moverEtapaDerecha('por-hacer'))

    expect(nombres(result)).toEqual(['Hecho', 'Por hacer', 'En curso'])
    expect(result.current.anuncio).toBe('Etapa Por hacer movida a la posición 2 de 3')
  })

  it('mover en un extremo no anuncia, no pide foco y conserva el aviso', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')
    const { anuncio, foco } = result.current

    act(() => result.current.moverEtapaIzquierda('por-hacer'))
    act(() => result.current.moverEtapaDerecha('hecho'))

    expect(result.current.anuncio).toBe(anuncio)
    expect(result.current.foco).toBe(foco)
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })

  it('soltar la Etapa la mueve como el menú, retira el aviso y deja el foco en su asa', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')

    act(() => result.current.soltarEtapa('hecho', 1))

    expect(nombres(result)).toEqual(['Por hacer', 'Hecho', 'En curso'])
    expect(guardado()).toEqual(result.current.tablero)
    expect(result.current.anuncio).toBe('Etapa Hecho movida a la posición 2 de 3')
    expect(result.current.foco).toEqual({ tipo: 'asa', id: 'hecho' })
    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('soltar la Etapa en su sitio no cambia nada, pero devuelve el foco y lo dice', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')
    const antes = result.current.tablero

    act(() => result.current.soltarEtapa('hecho', 2))

    expect(result.current.tablero).toBe(antes)
    expect(result.current.anuncio).toBe('Etapa Hecho sigue en la posición 3 de 3')
    expect(result.current.foco).toEqual({ tipo: 'asa', id: 'hecho' })
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })

  it('dejar una Etapa sin mover devuelve el foco y lo dice', () => {
    const { result } = preparar()

    act(() => result.current.dejarEtapa('en-curso'))

    expect(result.current.anuncio).toBe('Etapa En curso sigue en la posición 2 de 3')
    expect(result.current.foco).toEqual({ tipo: 'asa', id: 'en-curso' })
  })

  it('dejar una Etapa que ya no existe no anuncia ni pide foco', () => {
    const { result } = preparar()
    const { anuncio, foco } = result.current

    act(() => result.current.dejarEtapa('no-existe'))

    expect(result.current.anuncio).toBe(anuncio)
    expect(result.current.foco).toBe(foco)
  })

  it('borrar ofrece «Deshacer», que la restaura exacta en su posición', () => {
    const { result, crear, idDe } = preparar()
    crear('Regar')
    crear('Comprar pan')
    act(() => result.current.editar(idDe('Regar'), { nota: 'Integral', etiqueta: 'azul' }))
    const antes = result.current.tablero

    act(() => result.current.quitarEtapa('por-hacer'))

    expect(nombres(result)).toEqual(['En curso', 'Hecho'])
    expect(guardado()).toEqual(result.current.tablero)
    expect(result.current.avisoDeDeshacer).toBe('Etapa Por hacer borrada')
    expect(result.current.anuncio).toBe(
      'Etapa Por hacer borrada con 2 Pendientes. Deshacer disponible',
    )

    act(() => result.current.deshacer())

    expect(result.current.tablero).toEqual(antes)
    expect(guardado()).toEqual(antes)
    expect(result.current.avisoDeDeshacer).toBeNull()
    expect(result.current.anuncio).toBe('Etapa Por hacer restaurada, posición 1 de 3')
  })

  it('tras borrar el foco va a la Etapa siguiente; si no hay, a la anterior', () => {
    const { result } = preparar()

    act(() => result.current.quitarEtapa('en-curso'))
    expect(result.current.foco).toEqual({ tipo: 'etapa', id: 'hecho' })

    act(() => result.current.quitarEtapa('hecho'))
    expect(result.current.foco).toEqual({ tipo: 'etapa', id: 'por-hacer' })
  })

  it('tras «Deshacer» el foco va a la Etapa restaurada', () => {
    const { result } = preparar()

    act(() => result.current.quitarEtapa('en-curso'))
    act(() => result.current.deshacer())

    expect(result.current.foco).toEqual({ tipo: 'etapa', id: 'en-curso' })
  })

  it('borrar la única Etapa no hace nada y conserva el aviso', () => {
    const { result } = preparar()
    act(() => result.current.quitarEtapa('hecho'))
    act(() => result.current.quitarEtapa('en-curso'))
    const antes = result.current.tablero

    act(() => result.current.quitarEtapa('por-hacer'))

    expect(result.current.tablero).toBe(antes)
    expect(result.current.avisoDeDeshacer).toBe('Etapa En curso borrada')
  })

  it('el siguiente cambio retira el aviso; solo hay un «Deshacer»', () => {
    const { result } = preparar()

    act(() => result.current.quitarEtapa('hecho'))
    act(() => result.current.quitarEtapa('en-curso'))
    act(() => result.current.deshacer())

    expect(nombres(result)).toEqual(['Por hacer', 'En curso'])

    act(() => result.current.quitarEtapa('en-curso'))
    act(() => result.current.renombrar('por-hacer', 'Lista'))

    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('con datos dañados, las operaciones de Etapa no los sobrescriben', () => {
    localStorage.setItem(claveDeAlmacenamiento(), 'datos dañados')
    const { result } = preparar()

    act(() => result.current.renombrar('hecho', 'Terminado'))
    act(() => void result.current.anadirEtapa('Revisión'))
    act(() => result.current.moverEtapaIzquierda('hecho'))
    act(() => result.current.quitarEtapa('hecho'))
    act(() => result.current.deshacer())

    expect(localStorage.getItem(claveDeAlmacenamiento())).toBe('datos dañados')
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
