import { describe, expect, it } from 'vitest'
import { tableroDeEjemplo, tableroDePartida, type Tablero } from '@/modelo/tablero'
import { analizarCopia, exportarCopia, nombreDeCopia } from './copia'

const AHORA = new Date('2026-10-30T10:15:00.000Z')

const contador = () => {
  let siguiente = 0
  return () => `id-${++siguiente}`
}

const analizar = (texto: string) => analizarCopia(texto, contador())

const copia = (tablero: unknown, version: unknown = 1) =>
  JSON.stringify({ app: 'tablero-de-pendientes', version, tablero })

const conPendiente = (pendiente: unknown) =>
  copia({ etapas: [{ nombre: 'Por hacer', pendientes: [pendiente] }] })

// Los identificadores cambian al importar: la ida y vuelta conserva todo lo demás.
const sinIdentificadores = ({ etapas }: Tablero) =>
  etapas.map(({ nombre, pendientes }) => ({
    nombre,
    pendientes: pendientes.map(({ id: _id, ...resto }) => resto),
  }))

describe('exportarCopia', () => {
  const tablero: Tablero = {
    etapas: [
      {
        id: 'por-hacer',
        nombre: 'Por hacer',
        pendientes: [
          { id: 'a', titulo: 'Comprar pan', nota: 'Integral', etiqueta: 'azul' },
          { id: 'b', titulo: 'Regar' },
        ],
      },
    ],
  }

  it('sigue el formato de la Especificación, sin identificadores internos', () => {
    expect(JSON.parse(exportarCopia(tablero, AHORA))).toEqual({
      app: 'tablero-de-pendientes',
      version: 1,
      exportadoEn: '2026-10-30T10:15:00.000Z',
      tablero: {
        etapas: [
          {
            nombre: 'Por hacer',
            pendientes: [
              { titulo: 'Comprar pan', nota: 'Integral', etiqueta: 'azul' },
              { titulo: 'Regar' },
            ],
          },
        ],
      },
    })
  })

  it('no escribe `nota` ni `etiqueta` si no existen, ni ningún `id`', () => {
    const texto = exportarCopia(tablero, AHORA)

    expect(texto.match(/"nota"/g)).toHaveLength(1)
    expect(texto.match(/"etiqueta"/g)).toHaveLength(1)
    expect(texto).not.toContain('"id"')
  })

  it('es legible: va sangrado, una propiedad por línea', () => {
    expect(exportarCopia(tablero, AHORA)).toContain('\n  "app": "tablero-de-pendientes",\n')
  })
})

describe('nombreDeCopia', () => {
  it('usa la fecha local, con mes y día a dos cifras', () => {
    expect(nombreDeCopia(new Date(2026, 0, 5, 23, 59))).toBe('tablero-de-pendientes-2026-01-05.json')
  })
})

describe('analizarCopia', () => {
  it.each([
    ['el Tablero de ejemplo', tableroDeEjemplo()],
    ['un Tablero sin Pendientes', tableroDePartida()],
  ])('la ida y vuelta conserva %s', (_nombre, tablero) => {
    const resultado = analizar(exportarCopia(tablero, AHORA))

    expect(resultado.tipo).toBe('valida')
    if (resultado.tipo !== 'valida') return
    expect(sinIdentificadores(resultado.tablero)).toEqual(sinIdentificadores(tablero))
  })

  it('regenera todos los identificadores', () => {
    const resultado = analizar(exportarCopia(tableroDeEjemplo(), AHORA))

    if (resultado.tipo !== 'valida') throw new Error('debería ser válida')
    const ids = resultado.tablero.etapas.flatMap((etapa) => [
      etapa.id,
      ...etapa.pendientes.map((pendiente) => pendiente.id),
    ])
    expect(ids).toEqual(Array.from({ length: 9 }, (_, indice) => `id-${indice + 1}`))
  })

  it('ignora los campos desconocidos, también un `id` escrito a mano', () => {
    const texto = JSON.stringify({
      app: 'tablero-de-pendientes',
      version: 1,
      extra: true,
      tablero: {
        fondo: 'negro',
        etapas: [
          {
            id: 'mio',
            color: 'rojo',
            nombre: 'Por hacer',
            pendientes: [{ id: 'mio', titulo: 'Comprar pan', prioridad: 'alta' }],
          },
        ],
      },
    })

    expect(analizar(texto)).toEqual({
      tipo: 'valida',
      tablero: {
        etapas: [
          {
            id: 'id-1',
            nombre: 'Por hacer',
            pendientes: [{ id: 'id-2', titulo: 'Comprar pan' }],
          },
        ],
      },
    })
  })

  it.each([
    ['un texto que no es JSON', 'hola'],
    ['un JSON cortado', '{"app":"tablero-de-pendientes","version":1,'],
    ['un valor suelto', 'null'],
    ['una lista', '[]'],
    ['un JSON de otra app', '{"app":"otra","version":1,"tablero":{"etapas":[]}}'],
    ['un JSON sin `app`', '{"version":1}'],
  ])('no reconoce %s', (_nombre, texto) => {
    expect(analizar(texto)).toEqual({ tipo: 'rechazada', motivo: 'no-se-reconoce' })
  })

  it('avisa de una versión más nueva, aunque el resto no se entienda', () => {
    expect(analizar(copia('lo que sea', 2))).toEqual({
      tipo: 'rechazada',
      motivo: 'version-nueva',
    })
  })

  it('rechaza como dañada una copia sin versión', () => {
    expect(analizar('{"app":"tablero-de-pendientes"}')).toEqual({
      tipo: 'rechazada',
      motivo: 'danado',
    })
  })

  it.each([
    ['con la versión en texto', '1'],
    ['con la versión 0', 0],
    ['con una versión decimal', 1.5],
  ])('rechaza como dañada una copia %s', (_nombre, version) => {
    expect(analizar(copia(tableroDePartida(), version))).toEqual({
      tipo: 'rechazada',
      motivo: 'danado',
    })
  })

  const etapasVacias = (total: number) =>
    Array.from({ length: total }, (_, indice) => ({ nombre: `Etapa ${indice}`, pendientes: [] }))

  it.each<[string, string]>([
    ['sin Tablero', copia(undefined)],
    ['sin Etapas', copia({ etapas: [] })],
    ['con 9 Etapas', copia({ etapas: etapasVacias(9) })],
    ['con una Etapa que no es un objeto', copia({ etapas: [1] })],
    ['con una Etapa sin Pendientes', copia({ etapas: [{ nombre: 'Por hacer' }] })],
    ['con un nombre vacío', copia({ etapas: [{ nombre: '  ', pendientes: [] }] })],
    ['con un nombre largo', copia({ etapas: [{ nombre: 'a'.repeat(31), pendientes: [] }] })],
    ['con un Pendiente que no es un objeto', conPendiente('Comprar pan')],
    ['con un título vacío', conPendiente({ titulo: '' })],
    ['sin título', conPendiente({})],
    ['con un título largo', conPendiente({ titulo: 'a'.repeat(121) })],
    ['con una nota larga', conPendiente({ titulo: 'Pan', nota: 'a'.repeat(2001) })],
    ['con una nota que no es texto', conPendiente({ titulo: 'Pan', nota: 7 })],
    ['con una Etiqueta desconocida', conPendiente({ titulo: 'Pan', etiqueta: 'fucsia' })],
  ])('rechaza como dañada una copia %s', (_nombre, texto) => {
    expect(analizar(texto)).toEqual({ tipo: 'rechazada', motivo: 'danado' })
  })

  it('admite el límite exacto: 8 Etapas', () => {
    expect(analizar(copia({ etapas: etapasVacias(8) })).tipo).toBe('valida')
  })

  describe('migración de versiones', () => {
    // Un formato ficticio: la versión 1 es la primera real y no hay nada que migrar aún.
    const formato = {
      version: 3,
      migraciones: {
        1: (datos: unknown) => ({
          etapas: (datos as { columnas: unknown[] }).columnas,
        }),
        2: (datos: unknown) => ({
          etapas: (datos as { etapas: { titulo: string }[] }).etapas.map(({ titulo }) => ({
            nombre: titulo,
            pendientes: [],
          })),
        }),
      },
    }

    const analizarConFormato = (texto: string) => analizarCopia(texto, contador(), formato)

    it('encadena las migraciones desde una versión anterior', () => {
      const texto = copia({ columnas: [{ titulo: 'Por hacer' }] }, 1)

      expect(analizarConFormato(texto)).toEqual({
        tipo: 'valida',
        tablero: { etapas: [{ id: 'id-1', nombre: 'Por hacer', pendientes: [] }] },
      })
    })

    it('empieza en la versión del archivo', () => {
      const texto = copia({ etapas: [{ titulo: 'Por hacer' }] }, 2)

      expect(analizarConFormato(texto).tipo).toBe('valida')
    })

    it('la versión actual no pasa por ninguna migración', () => {
      const texto = copia({ etapas: [{ nombre: 'Por hacer', pendientes: [] }] }, 3)

      expect(analizarConFormato(texto).tipo).toBe('valida')
    })

    it('si una migración no puede con el contenido, la copia está dañada', () => {
      expect(analizarConFormato(copia({ otra: 'cosa' }, 1))).toEqual({
        tipo: 'rechazada',
        motivo: 'danado',
      })
    })

    it('una versión anterior sin migración está dañada', () => {
      const incompleto = { version: 2, migraciones: {} }

      expect(analizarCopia(copia(tableroDePartida(), 1), contador(), incompleto)).toEqual({
        tipo: 'rechazada',
        motivo: 'danado',
      })
    })
  })
})
