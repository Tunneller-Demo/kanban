// Anuncios: el único punto que genera los textos para el lector de pantalla.
import type { Etiqueta, Pendiente } from '@/modelo/tablero'

export const AVISO_SIN_GUARDAR = 'Sin guardar'

const NOMBRES_DE_ETIQUETA: Record<Etiqueta, { nombre: string; adjetivo: string }> = {
  rojo: { nombre: 'Rojo', adjetivo: 'roja' },
  naranja: { nombre: 'Naranja', adjetivo: 'naranja' },
  amarillo: { nombre: 'Amarillo', adjetivo: 'amarilla' },
  verde: { nombre: 'Verde', adjetivo: 'verde' },
  azul: { nombre: 'Azul', adjetivo: 'azul' },
  violeta: { nombre: 'Violeta', adjetivo: 'violeta' },
}

export function anuncioPendienteCreado(
  titulo: string,
  nombreDeEtapa: string,
  total: number,
): string {
  return `"${titulo}" creado en ${nombreDeEtapa}, posición 1 de ${total}`
}

export function anuncioTituloDemasiadoLargo(exceso: number): string {
  return `Pendiente sin crear. ${textoDeExceso(exceso)}`
}

// Un exceso de 0 o menos significa que ese campo sí se guardó.
export function anuncioCambiosSinGuardar(excesoDeTitulo: number, excesoDeNota: number): string {
  const partes = [
    excesoDeTitulo > 0 && `Título sin guardar. ${textoDeExceso(excesoDeTitulo)}`,
    excesoDeNota > 0 && `Nota sin guardar. ${textoDeExceso(excesoDeNota)}`,
  ]
  return partes.filter(Boolean).join('. ')
}

export function anuncioTituloRecuperado(titulo: string): string {
  return `Título vacío. Se recupera "${titulo}"`
}

export function nombreDeEtiqueta(etiqueta: Etiqueta): string {
  return NOMBRES_DE_ETIQUETA[etiqueta].nombre
}

export function nombreDePendiente({ titulo, nota, etiqueta }: Pendiente): string {
  return [
    titulo,
    etiqueta && `Etiqueta ${NOMBRES_DE_ETIQUETA[etiqueta].adjetivo}`,
    nota && 'Tiene nota',
  ]
    .filter(Boolean)
    .join(', ')
}

export function textoDeExceso(exceso: number): string {
  return exceso === 1 ? 'Sobra 1 carácter' : `Sobran ${exceso} caracteres`
}
