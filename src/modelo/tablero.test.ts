// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  bajarPendiente,
  borrarEtapa,
  borrarPendiente,
  contarPendientes,
  crearEtapa,
  crearPendiente,
  editarPendiente,
  esTablero,
  localizarPendiente,
  moverEtapa,
  moverPendiente,
  moverPendienteAEtapa,
  renombrarEtapa,
  subirPendiente,
  tableroDeEjemplo,
  tableroDePartida,
  vaciarTablero,
  type CambiosDePendiente,
  type Etiqueta,
  type Pendiente,
  type Tablero,
} from './tablero'

describe('tableroDeEjemplo', () => {
  it('reparte los seis Pendientes de la Especificación en las tres Etapas de partida', () => {
    const resumen = tableroDeEjemplo().etapas.map((etapa) => [
      etapa.nombre,
      etapa.pendientes.map((pendiente) => pendiente.titulo),
    ])

    expect(resumen).toEqual([
      [
        'Por hacer',
        ['Arrástrame a «En curso»', 'Ábreme para ver mi nota', 'Añade tu primer Pendiente'],
      ],
      ['En curso', ['Adapta las Etapas a tu forma de trabajar', 'Guarda una Copia de seguridad']],
      ['Hecho', ['Abrir el Tablero por primera vez']],
    ])
  })

  it('cumple las reglas del Tablero, con al menos dos Etiquetas distintas', () => {
    const tablero = tableroDeEjemplo()
    const pendientes = tablero.etapas.flatMap((etapa) => etapa.pendientes)
    const etiquetas = new Set(pendientes.map((pendiente) => pendiente.etiqueta).filter(Boolean))

    expect(esTablero(tablero)).toBe(true)
    expect(etiquetas.size).toBeGreaterThanOrEqual(2)
  })

  it('solo el Pendiente terminado va sin nota', () => {
    const sinNota = tableroDeEjemplo()
      .etapas.flatMap((etapa) => etapa.pendientes)
      .filter((pendiente) => !pendiente.nota)

    expect(sinNota.map((pendiente) => pendiente.titulo)).toEqual([
      'Abrir el Tablero por primera vez',
    ])
  })

  it('las notas enseñan cada gesto', () => {
    const notaDe = (titulo: string) =>
      tableroDeEjemplo()
        .etapas.flatMap((etapa) => etapa.pendientes)
        .find((pendiente) => pendiente.titulo === titulo)!.nota

    expect(notaDe('Arrástrame a «En curso»')).toMatch(/mantén pulsado.*Mover a/is)
    expect(notaDe('Ábreme para ver mi nota')).toMatch(/nota.*Etiqueta/is)
    expect(notaDe('Añade tu primer Pendiente')).toMatch(/Añadir Pendiente.*Vaciar/is)
    expect(notaDe('Adapta las Etapas a tu forma de trabajar')).toMatch(
      /renombrarla.*Añadir Etapa.*menú.*asa/is,
    )
    expect(notaDe('Guarda una Copia de seguridad')).toMatch(/este navegador.*Exportar/is)
  })

  it('devuelve un Tablero nuevo cada vez', () => {
    expect(tableroDeEjemplo()).not.toBe(tableroDeEjemplo())
    expect(tableroDeEjemplo().etapas[0]).not.toBe(tableroDeEjemplo().etapas[0])
  })
})

describe('vaciarTablero', () => {
  it('quita los Pendientes y conserva las Etapas tal como estén', () => {
    const adaptado = moverEtapa(renombrarEtapa(tableroDeEjemplo(), 'hecho', 'Listo'), 'hecho', 0)

    const resumen = vaciarTablero(adaptado).etapas.map(({ id, nombre, pendientes }) => ({
      id,
      nombre,
      pendientes,
    }))

    expect(resumen).toEqual([
      { id: 'hecho', nombre: 'Listo', pendientes: [] },
      { id: 'por-hacer', nombre: 'Por hacer', pendientes: [] },
      { id: 'en-curso', nombre: 'En curso', pendientes: [] },
    ])
  })

  it('con el Tablero ya vacío devuelve el mismo Tablero', () => {
    const vacio = tableroDePartida()

    expect(vaciarTablero(vacio)).toBe(vacio)
  })
})

describe('contarPendientes', () => {
  it('cuenta los Pendientes de todas las Etapas', () => {
    expect(contarPendientes(tableroDePartida())).toBe(0)
    expect(contarPendientes(tableroDeEjemplo())).toBe(6)
  })
})

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

describe('editarPendiente', () => {
  const conPendiente = (extra: Partial<Pendiente> = {}) => ({
    etapas: [
      { id: 'e1', nombre: 'Por hacer', pendientes: [{ id: 'x', titulo: 'Otro' }] },
      { id: 'e2', nombre: 'Hecho', pendientes: [{ id: 'a', titulo: 'Comprar pan', ...extra }] },
    ],
  })
  const editado = (tablero: Tablero) => tablero.etapas[1].pendientes[0]

  it('cambia el título, recortando los espacios de los extremos', () => {
    const tablero = editarPendiente(conPendiente(), 'a', { titulo: '  Comprar  leche ' })

    expect(editado(tablero)).toEqual({ id: 'a', titulo: 'Comprar  leche' })
  })

  it('cambia la nota y conserva sus saltos de línea', () => {
    const tablero = editarPendiente(conPendiente(), 'a', { nota: 'Integral\n\n  y de centeno\n' })

    expect(editado(tablero).nota).toBe('Integral\n\n  y de centeno\n')
  })

  it('quita la nota si queda vacía o solo con espacios', () => {
    for (const nota of ['', ' \n\t']) {
      const tablero = editarPendiente(conPendiente({ nota: 'Integral' }), 'a', { nota })

      expect(editado(tablero)).toEqual({ id: 'a', titulo: 'Comprar pan' })
    }
  })

  it('pone una Etiqueta y sustituye la anterior', () => {
    const tablero = editarPendiente(conPendiente({ etiqueta: 'rojo' }), 'a', { etiqueta: 'azul' })

    expect(editado(tablero).etiqueta).toBe('azul')
  })

  it('quita la Etiqueta', () => {
    const tablero = editarPendiente(conPendiente({ etiqueta: 'rojo' }), 'a', { etiqueta: null })

    expect(editado(tablero)).toEqual({ id: 'a', titulo: 'Comprar pan' })
  })

  it('conserva lo que no cambia y deja el Pendiente en su sitio', () => {
    const tablero = editarPendiente(conPendiente({ nota: 'Integral', etiqueta: 'verde' }), 'a', {
      titulo: 'Comprar leche',
    })

    expect(tablero.etapas[0]).toEqual(conPendiente().etapas[0])
    expect(editado(tablero)).toEqual({
      id: 'a',
      titulo: 'Comprar leche',
      nota: 'Integral',
      etiqueta: 'verde',
    })
  })

  it('no modifica el Tablero que recibe', () => {
    const tablero = conPendiente()

    editarPendiente(tablero, 'a', { titulo: 'Comprar leche' })

    expect(tablero).toEqual(conPendiente())
  })

  it('admite los límites exactos de título y nota', () => {
    const titulo = 'a'.repeat(120)
    const nota = 'a'.repeat(2000)

    expect(editado(editarPendiente(conPendiente(), 'a', { titulo, nota }))).toMatchObject({
      titulo,
      nota,
    })
  })

  it.each<[string, CambiosDePendiente]>([
    ['un título vacío', { titulo: '' }],
    ['un título solo con espacios', { titulo: ' \t ' }],
    ['un título de 121 caracteres', { titulo: 'a'.repeat(121) }],
    ['una nota de 2001 caracteres', { nota: 'a'.repeat(2001) }],
    ['una nota de 2001 espacios', { nota: ' '.repeat(2001) }],
    ['una Etiqueta desconocida', { etiqueta: 'fucsia' as Etiqueta }],
    ['el mismo título', { titulo: 'Comprar pan' }],
    ['el mismo título con espacios', { titulo: ' Comprar pan ' }],
    ['la misma nota', { nota: 'Integral' }],
    ['la misma Etiqueta', { etiqueta: 'azul' }],
  ])('devuelve el mismo Tablero con %s', (_, cambios) => {
    const tablero = conPendiente({ nota: 'Integral', etiqueta: 'azul' })

    expect(editarPendiente(tablero, 'a', cambios)).toBe(tablero)
  })

  it('devuelve el mismo Tablero si el Pendiente no existe', () => {
    const tablero = conPendiente()

    expect(editarPendiente(tablero, 'no-existe', { titulo: 'Comprar leche' })).toBe(tablero)
  })

  it('el resultado sigue siendo un Tablero válido', () => {
    const tablero = editarPendiente(conPendiente(), 'a', {
      titulo: 'Comprar leche',
      nota: 'Entera',
      etiqueta: 'violeta',
    })

    expect(esTablero(tablero)).toBe(true)
  })
})

describe('borrarPendiente', () => {
  const conVarios = (): Tablero => ({
    etapas: [
      { id: 'e1', nombre: 'Por hacer', pendientes: [{ id: 'x', titulo: 'Otro' }] },
      {
        id: 'e2',
        nombre: 'Hecho',
        pendientes: [
          { id: 'a', titulo: 'Comprar pan' },
          { id: 'b', titulo: 'Llamar al banco', nota: 'Urgente', etiqueta: 'rojo' },
          { id: 'c', titulo: 'Regar' },
        ],
      },
    ],
  })

  it('quita el Pendiente y conserva el orden de los demás', () => {
    const tablero = borrarPendiente(conVarios(), 'b')

    expect(tablero.etapas[1].pendientes.map((pendiente) => pendiente.id)).toEqual(['a', 'c'])
  })

  it('deja intactas las demás Etapas', () => {
    expect(borrarPendiente(conVarios(), 'b').etapas[0]).toEqual(conVarios().etapas[0])
  })

  it('no modifica el Tablero que recibe, que sirve para restaurarlo tal cual', () => {
    const tablero = conVarios()

    borrarPendiente(tablero, 'b')

    expect(tablero).toEqual(conVarios())
  })

  it('deja la Etapa vacía al borrar su único Pendiente', () => {
    expect(borrarPendiente(conVarios(), 'x').etapas[0].pendientes).toEqual([])
  })

  it('devuelve el mismo Tablero si el Pendiente no existe', () => {
    const tablero = conVarios()

    expect(borrarPendiente(tablero, 'no-existe')).toBe(tablero)
  })

  it('el resultado sigue siendo un Tablero válido', () => {
    expect(esTablero(borrarPendiente(conVarios(), 'x'))).toBe(true)
  })
})

describe('mover Pendientes', () => {
  // Por hacer: a, b, c. En curso: d. Hecho: vacía.
  const tableroConPendientes = (): Tablero => {
    const tablero = tableroDePartida()
    tablero.etapas[0].pendientes.push(
      { id: 'a', titulo: 'Primero', nota: 'Integral', etiqueta: 'azul' },
      { id: 'b', titulo: 'Segundo' },
      { id: 'c', titulo: 'Tercero' },
    )
    tablero.etapas[1].pendientes.push({ id: 'd', titulo: 'Cuarto' })
    return tablero
  }

  const ids = (tablero: Tablero) =>
    tablero.etapas.map((etapa) => etapa.pendientes.map((pendiente) => pendiente.id))

  describe('moverPendiente', () => {
    it('reordena dentro de la Etapa: el índice es la posición final', () => {
      const tablero = tableroConPendientes()

      expect(ids(moverPendiente(tablero, 'a', 'por-hacer', 2))).toEqual([
        ['b', 'c', 'a'],
        ['d'],
        [],
      ])
      expect(ids(moverPendiente(tablero, 'c', 'por-hacer', 0))).toEqual([
        ['c', 'a', 'b'],
        ['d'],
        [],
      ])
    })

    it('lleva a otra Etapa en cualquier posición, incluida la última', () => {
      const tablero = tableroConPendientes()

      expect(ids(moverPendiente(tablero, 'b', 'en-curso', 1))).toEqual([['a', 'c'], ['d', 'b'], []])
      expect(ids(moverPendiente(tablero, 'b', 'hecho', 0))).toEqual([['a', 'c'], ['d'], ['b']])
    })

    it('conserva el Pendiente con su nota y su Etiqueta', () => {
      const tablero = tableroConPendientes()
      const original = tablero.etapas[0].pendientes[0]

      const nuevo = moverPendiente(tablero, 'a', 'en-curso', 0)

      expect(nuevo.etapas[1].pendientes[0]).toEqual(original)
    })

    it('el resultado sigue siendo un Tablero válido', () => {
      expect(esTablero(moverPendiente(tableroConPendientes(), 'a', 'hecho', 0))).toBe(true)
    })

    it('no modifica el Tablero recibido', () => {
      const tablero = tableroConPendientes()
      const antes = structuredClone(tablero)

      moverPendiente(tablero, 'a', 'en-curso', 0)

      expect(tablero).toEqual(antes)
    })

    it.each([
      ['el Pendiente no existe', 'x', 'en-curso', 0],
      ['la Etapa no existe', 'a', 'x', 0],
      ['el índice es negativo', 'a', 'en-curso', -1],
      ['el índice se pasa en otra Etapa', 'a', 'en-curso', 2],
      ['el índice se pasa en su Etapa', 'a', 'por-hacer', 3],
      ['el índice no es entero', 'a', 'en-curso', 0.5],
      ['ya está en ese sitio', 'b', 'por-hacer', 1],
    ])('devuelve el mismo Tablero si %s', (_, pendienteId, etapaId, indice) => {
      const tablero = tableroConPendientes()

      expect(moverPendiente(tablero, pendienteId, etapaId, indice)).toBe(tablero)
    })
  })

  describe('subirPendiente', () => {
    it('sube una posición dentro de su Etapa', () => {
      expect(ids(subirPendiente(tableroConPendientes(), 'c'))).toEqual([['a', 'c', 'b'], ['d'], []])
    })

    it('el primero de la Etapa no cambia de Etapa', () => {
      const tablero = tableroConPendientes()

      expect(subirPendiente(tablero, 'a')).toBe(tablero)
      expect(subirPendiente(tablero, 'd')).toBe(tablero)
    })

    it('devuelve el mismo Tablero si el Pendiente no existe', () => {
      const tablero = tableroConPendientes()

      expect(subirPendiente(tablero, 'x')).toBe(tablero)
    })
  })

  describe('bajarPendiente', () => {
    it('baja una posición dentro de su Etapa', () => {
      expect(ids(bajarPendiente(tableroConPendientes(), 'a'))).toEqual([['b', 'a', 'c'], ['d'], []])
    })

    it('el último de la Etapa no cambia de Etapa', () => {
      const tablero = tableroConPendientes()

      expect(bajarPendiente(tablero, 'c')).toBe(tablero)
      expect(bajarPendiente(tablero, 'd')).toBe(tablero)
    })

    it('devuelve el mismo Tablero si el Pendiente no existe', () => {
      const tablero = tableroConPendientes()

      expect(bajarPendiente(tablero, 'x')).toBe(tablero)
    })
  })

  describe('moverPendienteAEtapa', () => {
    it('entra arriba de la Etapa de destino', () => {
      expect(ids(moverPendienteAEtapa(tableroConPendientes(), 'c', 'en-curso'))).toEqual([
        ['a', 'b'],
        ['c', 'd'],
        [],
      ])
    })

    it('entra en una Etapa vacía', () => {
      expect(ids(moverPendienteAEtapa(tableroConPendientes(), 'd', 'hecho'))).toEqual([
        ['a', 'b', 'c'],
        [],
        ['d'],
      ])
    })

    it('hacia su propia Etapa no hace nada: no hay «Al principio»', () => {
      const tablero = tableroConPendientes()

      expect(moverPendienteAEtapa(tablero, 'c', 'por-hacer')).toBe(tablero)
    })

    it('devuelve el mismo Tablero si el Pendiente o la Etapa no existen', () => {
      const tablero = tableroConPendientes()

      expect(moverPendienteAEtapa(tablero, 'x', 'en-curso')).toBe(tablero)
      expect(moverPendienteAEtapa(tablero, 'a', 'x')).toBe(tablero)
    })
  })
})

describe('operaciones de Etapa', () => {
  const conEtapas = (total: number): Tablero => ({
    etapas: Array.from({ length: total }, (_, i) => ({
      id: `e${i}`,
      nombre: `Etapa ${i}`,
      pendientes: [],
    })),
  })
  const nombres = (tablero: Tablero) => tablero.etapas.map((etapa) => etapa.nombre)

  describe('crearEtapa', () => {
    it('la pone la última y vacía', () => {
      const nuevo = crearEtapa(tableroDePartida(), 'Revisar', 'r')

      expect(nuevo.etapas[3]).toEqual({ id: 'r', nombre: 'Revisar', pendientes: [] })
      expect(nombres(nuevo)).toEqual(['Por hacer', 'En curso', 'Hecho', 'Revisar'])
    })

    it('recorta los espacios de los extremos', () => {
      expect(crearEtapa(tableroDePartida(), '  Revisar ', 'r').etapas[3].nombre).toBe('Revisar')
    })

    it('admite nombres repetidos', () => {
      expect(nombres(crearEtapa(tableroDePartida(), 'Hecho', 'r'))).toEqual([
        'Por hacer',
        'En curso',
        'Hecho',
        'Hecho',
      ])
    })

    it('admite 30 caracteres y rechaza 31', () => {
      const tablero = tableroDePartida()

      expect(crearEtapa(tablero, 'a'.repeat(30), 'r').etapas).toHaveLength(4)
      expect(crearEtapa(tablero, 'a'.repeat(31), 'r')).toBe(tablero)
    })

    it('rechaza un nombre vacío o solo con espacios', () => {
      const tablero = tableroDePartida()

      expect(crearEtapa(tablero, '', 'r')).toBe(tablero)
      expect(crearEtapa(tablero, '   ', 'r')).toBe(tablero)
    })

    it('llega hasta 8 Etapas y no pasa de ahí', () => {
      const conSiete = conEtapas(7)
      const conOcho = conEtapas(8)

      expect(crearEtapa(conSiete, 'Otra', 'r').etapas).toHaveLength(8)
      expect(crearEtapa(conOcho, 'Otra', 'r')).toBe(conOcho)
    })
  })

  describe('renombrarEtapa', () => {
    it('cambia solo el nombre y conserva sus Pendientes', () => {
      const tablero = crearPendiente(tableroDePartida(), 'hecho', 'Comprar pan', 'a')

      const nuevo = renombrarEtapa(tablero, 'hecho', 'Terminado')

      expect(nuevo.etapas[2]).toEqual({ ...tablero.etapas[2], nombre: 'Terminado' })
      expect(nombres(nuevo)).toEqual(['Por hacer', 'En curso', 'Terminado'])
    })

    it('recorta los espacios de los extremos', () => {
      expect(renombrarEtapa(tableroDePartida(), 'hecho', ' Fin  ').etapas[2].nombre).toBe('Fin')
    })

    it('admite un nombre repetido', () => {
      expect(nombres(renombrarEtapa(tableroDePartida(), 'hecho', 'En curso'))).toEqual([
        'Por hacer',
        'En curso',
        'En curso',
      ])
    })

    it('admite 30 caracteres y rechaza 31', () => {
      const tablero = tableroDePartida()

      expect(renombrarEtapa(tablero, 'hecho', 'a'.repeat(30)).etapas[2].nombre).toHaveLength(30)
      expect(renombrarEtapa(tablero, 'hecho', 'a'.repeat(31))).toBe(tablero)
    })

    it('devuelve el mismo Tablero si queda vacío, no cambia o la Etapa no existe', () => {
      const tablero = tableroDePartida()

      expect(renombrarEtapa(tablero, 'hecho', '  ')).toBe(tablero)
      expect(renombrarEtapa(tablero, 'hecho', ' Hecho ')).toBe(tablero)
      expect(renombrarEtapa(tablero, 'no-existe', 'Fin')).toBe(tablero)
    })
  })

  describe('moverEtapa', () => {
    it('la deja en la posición pedida, con sus Pendientes', () => {
      const tablero = crearPendiente(tableroDePartida(), 'hecho', 'Comprar pan', 'a')

      const nuevo = moverEtapa(tablero, 'hecho', 0)

      expect(nombres(nuevo)).toEqual(['Hecho', 'Por hacer', 'En curso'])
      expect(nuevo.etapas[0]).toEqual(tablero.etapas[2])
    })

    it('la mueve hacia la derecha', () => {
      expect(nombres(moverEtapa(tableroDePartida(), 'por-hacer', 1))).toEqual([
        'En curso',
        'Por hacer',
        'Hecho',
      ])
    })

    it('devuelve el mismo Tablero si ya está ahí, se sale o la Etapa no existe', () => {
      const tablero = tableroDePartida()

      expect(moverEtapa(tablero, 'hecho', 2)).toBe(tablero)
      expect(moverEtapa(tablero, 'por-hacer', -1)).toBe(tablero)
      expect(moverEtapa(tablero, 'hecho', 3)).toBe(tablero)
      expect(moverEtapa(tablero, 'hecho', 0.5)).toBe(tablero)
      expect(moverEtapa(tablero, 'no-existe', 0)).toBe(tablero)
    })
  })

  describe('borrarEtapa', () => {
    it('quita la Etapa con sus Pendientes y deja las demás en orden', () => {
      const tablero = crearPendiente(tableroDePartida(), 'en-curso', 'Comprar pan', 'a')

      const nuevo = borrarEtapa(tablero, 'en-curso')

      expect(nombres(nuevo)).toEqual(['Por hacer', 'Hecho'])
      expect(localizarPendiente(nuevo, 'a')).toBeUndefined()
    })

    it('llega hasta 1 Etapa y no pasa de ahí', () => {
      const conDos = conEtapas(2)
      const conUna = conEtapas(1)

      expect(nombres(borrarEtapa(conDos, 'e0'))).toEqual(['Etapa 1'])
      expect(borrarEtapa(conUna, 'e0')).toBe(conUna)
    })

    it('devuelve el mismo Tablero si la Etapa no existe', () => {
      const tablero = tableroDePartida()

      expect(borrarEtapa(tablero, 'no-existe')).toBe(tablero)
    })
  })

  it('el resultado de cada operación sigue siendo un Tablero válido', () => {
    const tablero = crearEtapa(tableroDePartida(), 'Revisar', 'r')

    expect(esTablero(renombrarEtapa(tablero, 'r', 'Fin'))).toBe(true)
    expect(esTablero(moverEtapa(tablero, 'r', 0))).toBe(true)
    expect(esTablero(borrarEtapa(tablero, 'r'))).toBe(true)
    expect(esTablero(tablero)).toBe(true)
  })
})

describe('localizarPendiente', () => {
  const tablero: Tablero = {
    etapas: [
      {
        id: 'e1',
        nombre: 'Por hacer',
        pendientes: [
          { id: 'a', titulo: 'Comprar pan' },
          { id: 'b', titulo: 'Regar' },
        ],
      },
    ],
  }

  it('da el Pendiente, su Etapa y su índice', () => {
    expect(localizarPendiente(tablero, 'b')).toEqual({
      etapa: tablero.etapas[0],
      indice: 1,
      pendiente: { id: 'b', titulo: 'Regar' },
    })
  })

  it('no da nada si el Pendiente no existe', () => {
    expect(localizarPendiente(tablero, 'no-existe')).toBeUndefined()
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
