// Modelo del Tablero: tipos y operaciones puras. No conoce React, el navegador ni dnd-kit.

export type Etiqueta = 'rojo' | 'naranja' | 'amarillo' | 'verde' | 'azul' | 'violeta'

export type Pendiente = {
  id: string
  titulo: string
  nota?: string
  etiqueta?: Etiqueta
}

export type Etapa = {
  id: string
  nombre: string
  pendientes: Pendiente[]
}

export type Tablero = {
  etapas: Etapa[]
}

export function tableroDePartida(): Tablero {
  return {
    etapas: [
      { id: 'por-hacer', nombre: 'Por hacer', pendientes: [] },
      { id: 'en-curso', nombre: 'En curso', pendientes: [] },
      { id: 'hecho', nombre: 'Hecho', pendientes: [] },
    ],
  }
}
