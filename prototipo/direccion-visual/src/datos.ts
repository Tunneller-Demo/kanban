// PROTOTIPO desechable: el Tablero de ejemplo decidido y las tres direcciones visuales.

export type Pendiente = { id: string; titulo: string; nota: string; etiqueta: number | null }
export type Tablero = {
  orden: string[]
  nombres: Record<string, string>
  pendientes: Record<string, Pendiente[]>
}
export type ClaveVariante = 'A' | 'B' | 'C'

export const ETIQUETAS = ['Rojo', 'Naranja', 'Amarillo', 'Verde', 'Azul', 'Violeta']

export const VARIANTES: Record<
  ClaveVariante,
  { nombre: string; tonos: string[]; soltar: { duration: number; easing: string } }
> = {
  A: {
    nombre: 'Cuaderno',
    tonos: ['#B8392B', '#C4701A', '#A98A12', '#4F7A3A', '#2F6690', '#70508F'],
    soltar: { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' },
  },
  B: {
    nombre: 'Panel nocturno',
    tonos: ['#FF6B6B', '#FFA94D', '#FFE066', '#7BE495', '#6CB6FF', '#C79BFF'],
    soltar: { duration: 130, easing: 'ease-out' },
  },
  C: {
    nombre: 'Recortes',
    tonos: ['#FF5A4E', '#FF9F1C', '#FFD60A', '#2EC46D', '#3A86FF', '#A45CFF'],
    soltar: { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' },
  },
}

export function tableroDeEjemplo(): Tablero {
  return {
    orden: ['por-hacer', 'en-curso', 'hecho'],
    nombres: { 'por-hacer': 'Por hacer', 'en-curso': 'En curso', hecho: 'Hecho' },
    pendientes: {
      'por-hacer': [
        {
          id: 'p1',
          titulo: 'Arrástrame a «En curso»',
          nota: 'En móvil, mantén pulsado y arrastra.',
          etiqueta: 4,
        },
        { id: 'p2', titulo: 'Ábreme para ver mi nota', nota: 'Aquí puedes escribir una nota y poner una Etiqueta.', etiqueta: 5 },
        { id: 'p3', titulo: 'Añade tu primer Pendiente', nota: 'Cada Etapa tiene su propio campo.', etiqueta: null },
      ],
      'en-curso': [
        { id: 'p4', titulo: 'Adapta las Etapas a tu forma de trabajar', nota: 'Puedes renombrarlas, añadirlas, quitarlas y reordenarlas.', etiqueta: 1 },
        { id: 'p5', titulo: 'Guarda una Copia de seguridad', nota: 'Tus datos viven solo en este navegador.', etiqueta: null },
      ],
      hecho: [{ id: 'p6', titulo: 'Abrir el Tablero por primera vez', nota: '', etiqueta: 3 }],
    },
  }
}
