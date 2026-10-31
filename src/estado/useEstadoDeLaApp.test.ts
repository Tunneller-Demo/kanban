import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  crearPendiente,
  tableroDeEjemplo,
  tableroDePartida,
  type Tablero,
} from '@/modelo/tablero'
import { claveDeAlmacenamiento } from '@/persistencia/clave'
import { guardarTablero } from '@/persistencia/persistencia'
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
const marcaGuardada = () => JSON.parse(localStorage.getItem(claveDeAlmacenamiento())!).ejemploIntacto

// Sin nada guardado sería la primera visita, que abre el Tablero de ejemplo.
beforeEach(() => {
  localStorage.clear()
  guardarTablero(tableroDePartida(), false)
})

afterEach(() => vi.restoreAllMocks())

const romperElGuardado = () =>
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Sin espacio', 'QuotaExceededError')
  })

describe('fallos de guardado', () => {
  it('sin fallos no avisa', () => {
    const { result, crear } = preparar()

    crear('Comprar pan')

    expect(result.current.guardadoFalla).toBe(false)
  })

  it('si un guardado falla lo avisa y el cambio sigue en memoria', () => {
    const { result, crear, titulos } = preparar()
    romperElGuardado()

    crear('Comprar pan')

    expect(result.current.guardadoFalla).toBe(true)
    expect(titulos()).toEqual(['Comprar pan'])
  })

  it('reintenta con cada cambio y el aviso cae en cuanto un guardado funciona', () => {
    const { result, crear } = preparar()
    const espia = romperElGuardado()
    crear('Comprar pan')
    crear('Regar')
    expect(espia).toHaveBeenCalledTimes(2)
    expect(result.current.guardadoFalla).toBe(true)

    espia.mockRestore()
    crear('Llamar al banco')

    expect(result.current.guardadoFalla).toBe(false)
    expect(guardado()).toEqual(result.current.tablero)
  })

  it('una importación que no cabe se muestra con el aviso, sin rechazarla', () => {
    const { result } = preparar()
    const importado: Tablero = { etapas: [{ id: 'a', nombre: 'Hoy', pendientes: [] }] }
    romperElGuardado()

    act(() => result.current.importar(importado))

    expect(result.current.tablero).toEqual(importado)
    expect(result.current.guardadoFalla).toBe(true)
  })
})

describe('otra pestaña guarda', () => {
  const deOtraPestana = crearPendiente(tableroDePartida(), 'hecho', 'Regar', 'de-la-otra')

  const llegaDeOtraPestana = (tablero: Tablero, ejemploIntacto = false) =>
    act(() => {
      localStorage.setItem(
        claveDeAlmacenamiento(),
        JSON.stringify({ version: 1, tablero, ejemploIntacto }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: claveDeAlmacenamiento(),
          newValue: localStorage.getItem(claveDeAlmacenamiento()),
        }),
      )
    })

  it('muestra ese Tablero con su marca y lo anuncia', () => {
    const { result } = preparar()

    llegaDeOtraPestana(deOtraPestana, true)

    expect(result.current.tablero).toEqual(deOtraPestana)
    expect(result.current.ejemploIntacto).toBe(true)
    expect(result.current.anuncio).toBe('Tablero actualizado desde otra pestaña')
  })

  it('no vuelve a guardar', () => {
    preparar()
    const espia = vi.spyOn(Storage.prototype, 'setItem')

    const evento = new StorageEvent('storage', {
      key: claveDeAlmacenamiento(),
      newValue: JSON.stringify({ version: 1, tablero: deOtraPestana, ejemploIntacto: false }),
    })
    act(() => void window.dispatchEvent(evento))

    expect(espia).not.toHaveBeenCalled()
  })

  it('cuenta como cambio: retira el aviso de «Deshacer»', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')

    llegaDeOtraPestana(deOtraPestana)

    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('el siguiente cambio parte de lo recibido', () => {
    const { result, crear, titulos } = preparar()

    llegaDeOtraPestana(deOtraPestana)
    crear('Comprar pan')

    expect(titulos()).toEqual(['Comprar pan'])
    expect(result.current.tablero.etapas[2].pendientes[0].titulo).toBe('Regar')
    expect(guardado()).toEqual(result.current.tablero)
  })

  it('retira la barra de guardado: lo que se ve ya está guardado', () => {
    const { result, crear } = preparar()
    const espia = romperElGuardado()
    crear('Comprar pan')
    espia.mockRestore()

    llegaDeOtraPestana(deOtraPestana)

    expect(result.current.guardadoFalla).toBe(false)
  })

  it('cierra el rescate: los datos dañados ya no existen', () => {
    localStorage.setItem(claveDeAlmacenamiento(), 'datos dañados')
    const { result, crear } = preparar()

    llegaDeOtraPestana(deOtraPestana)
    crear('Comprar pan')

    expect(result.current.datosDanados).toBeNull()
    expect(guardado()).toEqual(result.current.tablero)
  })

  it('con datos que no se pueden leer sigue como estaba', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')
    const antes = result.current.tablero

    const evento = new StorageEvent('storage', {
      key: claveDeAlmacenamiento(),
      newValue: 'datos dañados',
    })
    act(() => void window.dispatchEvent(evento))

    expect(result.current.tablero).toBe(antes)
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })
})

describe('datos guardados dañados', () => {
  const abrirDanado = () => {
    localStorage.setItem(claveDeAlmacenamiento(), 'datos dañados')
    return preparar()
  }

  it('expone el contenido para rescatarlo', () => {
    expect(abrirDanado().result.current.datosDanados).toBe('datos dañados')
  })

  it('sin datos dañados no hay nada que rescatar', () => {
    expect(preparar().result.current.datosDanados).toBeNull()
  })

  it('«Empezar de cero» cierra el rescate y guarda el Tablero de partida', () => {
    const { result } = abrirDanado()

    act(() => result.current.empezarDeCero())

    expect(result.current.datosDanados).toBeNull()
    expect(result.current.tablero).toEqual(tableroDePartida())
    expect(guardado()).toEqual(tableroDePartida())
    expect(result.current.anuncio).toBe('Tablero vacío abierto')
    expect(result.current.foco).toEqual({ tipo: 'crear', id: 'por-hacer' })
  })

  it('tras «Empezar de cero» se vuelve a guardar con normalidad', () => {
    const { result, crear } = abrirDanado()

    act(() => result.current.empezarDeCero())
    crear('Comprar pan')

    expect(guardado()).toEqual(result.current.tablero)
  })

  it('«Empezar de cero» con el guardado fallando abre el Tablero y avisa', () => {
    const { result } = abrirDanado()
    romperElGuardado()

    act(() => result.current.empezarDeCero())

    expect(result.current.tablero).toEqual(tableroDePartida())
    expect(result.current.guardadoFalla).toBe(true)
  })
})

describe('Tablero de ejemplo', () => {
  const primeraVisita = () => {
    localStorage.clear()
    return preparar()
  }

  it('la primera visita lo abre intacto', () => {
    const { result } = primeraVisita()

    expect(result.current.tablero).toEqual(tableroDeEjemplo())
    expect(result.current.ejemploIntacto).toBe(true)
  })

  it('con algo guardado no se abre solo, aunque ese Tablero esté vacío', () => {
    const { result } = preparar()

    expect(result.current.tablero).toEqual(tableroDePartida())
    expect(result.current.ejemploIntacto).toBe(false)
  })

  it('con datos dañados no se abre y no cuenta como intacto', () => {
    localStorage.setItem(claveDeAlmacenamiento(), 'datos dañados')
    const { result } = preparar()

    expect(result.current.tablero).toEqual(tableroDePartida())
    expect(result.current.ejemploIntacto).toBe(false)
  })

  it.each<[string, (estado: ReturnType<typeof useEstadoDeLaApp>) => void]>([
    ['crear un Pendiente', (estado) => void estado.crear('hecho', 'Comprar pan')],
    ['editar un Pendiente', (estado) => estado.editar('ejemplo-abrir', { titulo: 'Otro' })],
    ['borrar un Pendiente', (estado) => estado.borrar('ejemplo-abrir')],
    ['mover un Pendiente', (estado) => estado.moverA('ejemplo-abrir', 'en-curso')],
    ['soltar un Pendiente', (estado) => estado.soltar('ejemplo-abrir', 'en-curso', 1)],
    ['renombrar una Etapa', (estado) => estado.renombrar('hecho', 'Terminado')],
    ['añadir una Etapa', (estado) => void estado.anadirEtapa('Revisión')],
    ['mover una Etapa', (estado) => estado.moverEtapaIzquierda('hecho')],
    ['borrar una Etapa', (estado) => estado.quitarEtapa('hecho')],
  ])('deja de estar intacto al %s, y lo recuerda al recargar', (_, cambiar) => {
    const { result } = primeraVisita()

    act(() => cambiar(result.current))

    expect(result.current.ejemploIntacto).toBe(false)
    expect(marcaGuardada()).toBe(false)
    expect(preparar().result.current.ejemploIntacto).toBe(false)
  })

  it('un intento que no cambia nada lo deja intacto', () => {
    const { result } = primeraVisita()

    act(() => result.current.moverA('ejemplo-abrir', 'hecho'))
    act(() => result.current.dejar('ejemplo-abrir'))

    expect(result.current.ejemploIntacto).toBe(true)
  })

  it('deshacer un cambio no lo devuelve a intacto', () => {
    const { result } = primeraVisita()

    act(() => result.current.borrar('ejemplo-abrir'))
    act(() => result.current.deshacer())

    expect(result.current.tablero).toEqual(tableroDeEjemplo())
    expect(result.current.ejemploIntacto).toBe(false)
  })
})

describe('Vaciar', () => {
  const primeraVisita = () => {
    localStorage.clear()
    return preparar()
  }

  it('quita los Pendientes, conserva las Etapas, lo guarda y no ofrece «Deshacer»', () => {
    const { result } = primeraVisita()
    act(() => result.current.renombrar('hecho', 'Terminado'))

    act(() => result.current.vaciar())

    const { etapas } = result.current.tablero
    expect(etapas.map((etapa) => etapa.nombre)).toEqual(['Por hacer', 'En curso', 'Terminado'])
    expect(etapas.flatMap((etapa) => etapa.pendientes)).toEqual([])
    expect(guardado()).toEqual(result.current.tablero)
    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('anuncia cuántos quitó y lleva el foco al botón de crear de la primera Etapa', () => {
    const { result } = primeraVisita()

    act(() => result.current.vaciar())

    expect(result.current.anuncio).toBe('Tablero vaciado. 6 Pendientes quitados')
    expect(result.current.foco).toEqual({ tipo: 'crear', id: 'por-hacer' })
  })

  it('retira el «Deshacer» que hubiera', () => {
    const { result } = primeraVisita()
    act(() => result.current.borrar('ejemplo-abrir'))

    act(() => result.current.vaciar())

    expect(result.current.avisoDeDeshacer).toBeNull()
  })

  it('deja de estar intacto y sigue vacío al recargar', () => {
    const { result } = primeraVisita()

    act(() => result.current.vaciar())

    expect(result.current.ejemploIntacto).toBe(false)
    const recargado = preparar().result.current
    expect(recargado.tablero).toEqual(result.current.tablero)
    expect(recargado.ejemploIntacto).toBe(false)
  })

  it('con el Tablero ya vacío no anuncia, no pide foco y conserva el aviso', () => {
    const { result, crear, borrar } = preparar()
    crear('Comprar pan')
    borrar('Comprar pan')
    const { anuncio, foco } = result.current

    act(() => result.current.vaciar())

    expect(result.current.anuncio).toBe(anuncio)
    expect(result.current.foco).toBe(foco)
    expect(result.current.avisoDeDeshacer).toBe('"Comprar pan" borrado')
  })

  it('con datos dañados no los sobrescribe', () => {
    localStorage.setItem(claveDeAlmacenamiento(), 'datos dañados')
    const { result, crear } = preparar()
    crear('Comprar pan')

    act(() => result.current.vaciar())

    expect(localStorage.getItem(claveDeAlmacenamiento())).toBe('datos dañados')
  })
})

describe('Ver el Tablero de ejemplo', () => {
  const adaptado = () => {
    const estado = preparar()
    act(() => estado.result.current.renombrar('hecho', 'Terminado'))
    act(() => void estado.result.current.anadirEtapa('Revisión'))
    return estado
  }

  it('sustituye al Tablero por completo, incluidas las tres Etapas de partida', () => {
    const { result } = adaptado()

    act(() => result.current.verEjemplo())

    expect(result.current.tablero).toEqual(tableroDeEjemplo())
    expect(guardado()).toEqual(tableroDeEjemplo())
  })

  it('anuncia el resultado, ofrece «Deshacer» y deja el foco en su primer Pendiente', () => {
    const { result } = adaptado()

    act(() => result.current.verEjemplo())

    expect(result.current.avisoDeDeshacer).toBe('Tablero de ejemplo abierto')
    expect(result.current.anuncio).toBe('Tablero de ejemplo abierto. Deshacer disponible')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id: 'ejemplo-arrastrame' })
  })

  it('«Deshacer» recupera el Tablero vacío con sus Etapas y lo anuncia', () => {
    const { result } = adaptado()
    const antes = result.current.tablero

    act(() => result.current.verEjemplo())
    act(() => result.current.deshacer())

    expect(result.current.tablero).toEqual(antes)
    expect(guardado()).toEqual(antes)
    expect(result.current.anuncio).toBe('Tablero vacío recuperado')
    expect(result.current.foco).toEqual({ tipo: 'crear', id: 'por-hacer' })
  })

  it('al cerrar el aviso se queda el ejemplo y vuelve el foco a su primer Pendiente', () => {
    const { result } = adaptado()

    act(() => result.current.verEjemplo())
    const trasAbrir = result.current.foco
    act(() => result.current.cerrarAviso())

    expect(result.current.tablero).toEqual(tableroDeEjemplo())
    expect(result.current.foco).toEqual(trasAbrir)
  })

  it('el ejemplo así abierto cuenta como intacto, también al recargar', () => {
    const { result } = adaptado()

    act(() => result.current.verEjemplo())

    expect(result.current.ejemploIntacto).toBe(true)
    expect(preparar().result.current.ejemploIntacto).toBe(true)
  })

  it('con Pendientes en el Tablero no hace nada', () => {
    const { result, crear } = preparar()
    crear('Comprar pan')
    const antes = result.current.tablero

    act(() => result.current.verEjemplo())

    expect(result.current.tablero).toBe(antes)
    expect(result.current.avisoDeDeshacer).toBeNull()
  })
})

describe('importar una Copia de seguridad', () => {
  const importado = (): Tablero => ({
    etapas: [
      { id: 'a', nombre: 'Sin empezar', pendientes: [] },
      { id: 'b', nombre: 'Terminado', pendientes: [{ id: 'c', titulo: 'Regar' }] },
    ],
  })

  it('reemplaza el Tablero entero y lo guarda', () => {
    const { result, crear } = preparar()
    crear('Comprar pan')

    act(() => result.current.importar(importado()))

    expect(result.current.tablero).toEqual(importado())
    expect(guardado()).toEqual(importado())
  })

  it('anuncia el resultado, ofrece «Deshacer» y deja el foco en el primer Pendiente', () => {
    const { result } = preparar()

    act(() => result.current.importar(importado()))

    expect(result.current.avisoDeDeshacer).toBe('Copia de seguridad importada')
    expect(result.current.anuncio).toBe('Copia de seguridad importada. Deshacer disponible')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id: 'c' })
  })

  it('sin Pendientes deja el foco en crear de la primera Etapa', () => {
    const { result, crear } = preparar()
    crear('Comprar pan')

    act(() => result.current.importar({ etapas: [{ id: 'a', nombre: 'Hoy', pendientes: [] }] }))

    expect(result.current.foco).toEqual({ tipo: 'crear', id: 'a' })
  })

  it('«Deshacer» recupera el Tablero anterior y lo anuncia', () => {
    const { result, crear, idDe } = preparar()
    crear('Comprar pan')
    const antes = result.current.tablero

    act(() => result.current.importar(importado()))
    act(() => result.current.deshacer())

    expect(result.current.tablero).toEqual(antes)
    expect(guardado()).toEqual(antes)
    expect(result.current.anuncio).toBe('Tablero anterior recuperado')
    expect(result.current.foco).toEqual({ tipo: 'pendiente', id: idDe('Comprar pan') })
  })

  it('cuenta como un cambio: el Tablero de ejemplo deja de estar intacto', () => {
    localStorage.clear()
    const { result } = preparar()

    act(() => result.current.importar(importado()))

    expect(result.current.ejemploIntacto).toBe(false)
    expect(marcaGuardada()).toBe(false)
  })
})

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
