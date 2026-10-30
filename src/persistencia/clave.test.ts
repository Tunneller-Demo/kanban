// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { claveDeAlmacenamiento } from './clave'

describe('claveDeAlmacenamiento', () => {
  it('incluye el nombre de la app y la ruta base', () => {
    expect(claveDeAlmacenamiento('/kanban/')).toBe('tablero-de-pendientes:/kanban/')
  })

  it('separa una preview del Tablero publicado', () => {
    expect(claveDeAlmacenamiento('/kanban/pr-preview/pr-1/')).not.toBe(
      claveDeAlmacenamiento('/kanban/'),
    )
  })

  it('separa dos previews entre sí', () => {
    expect(claveDeAlmacenamiento('/kanban/pr-preview/pr-1/')).not.toBe(
      claveDeAlmacenamiento('/kanban/pr-preview/pr-2/'),
    )
  })

  it('usa por defecto la ruta base de la compilación', () => {
    expect(claveDeAlmacenamiento()).toBe(`tablero-de-pendientes:${import.meta.env.BASE_URL}`)
  })
})
