import type { Foco } from '@/estado/useEstadoDeLaApp'

// Valor de `data-foco`: une cada destino con la petición de foco que le llega al Tablero.
export const claveDeFoco = ({ tipo, id }: Foco) => `${tipo}:${id}`
