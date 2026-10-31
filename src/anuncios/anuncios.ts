// Anuncios: el único punto que genera los textos para el lector de pantalla.
import {
  MAXIMO_DE_ETAPAS,
  MINIMO_DE_ETAPAS,
  type Etiqueta,
  type Pendiente,
} from '@/modelo/tablero'

export const AVISO_SIN_GUARDAR = 'Sin guardar'

export const AYUDA_DE_ARRASTRE =
  'Intro abre el Pendiente. Espacio lo coge; luego, las flechas lo mueven, Intro o Espacio lo sueltan y Escape cancela'

export const AYUDA_DE_ASA =
  'Espacio coge la Etapa; luego, las flechas la mueven, Intro o Espacio la sueltan y Escape cancela'

export const AYUDA_DE_NOMBRE = 'Renombrar la Etapa'

export const MOTIVO_SIN_BORRAR_ETAPA = `El Tablero necesita al menos ${MINIMO_DE_ETAPAS} Etapa`

export const MOTIVO_SIN_ANADIR_ETAPA = `El Tablero admite hasta ${MAXIMO_DE_ETAPAS} Etapas`

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

export function avisoPendienteBorrado(titulo: string): string {
  return `"${titulo}" borrado`
}

export function anuncioPendienteBorrado(titulo: string): string {
  return `${avisoPendienteBorrado(titulo)}. Deshacer disponible`
}

export function anuncioPendienteRestaurado(
  titulo: string,
  nombreDeEtapa: string,
  posicion: number,
  total: number,
): string {
  return `"${titulo}" restaurado en ${nombreDeEtapa}, posición ${posicion} de ${total}`
}

export function anuncioPendienteMovido(
  titulo: string,
  nombreDeEtapa: string,
  posicion: number,
  total: number,
): string {
  return `"${titulo}" movido a ${nombreDeEtapa}, posición ${posicion} de ${total}`
}

export function anuncioPendienteCogido(
  titulo: string,
  nombreDeEtapa: string,
  posicion: number,
  total: number,
): string {
  return `"${titulo}" cogido en ${nombreDeEtapa}, posición ${posicion} de ${total}`
}

export function anuncioPendienteSobre(
  titulo: string,
  nombreDeEtapa: string,
  posicion: number,
  total: number,
): string {
  return `"${titulo}" sobre ${nombreDeEtapa}, posición ${posicion} de ${total}`
}

export function anuncioPendienteSinMover(
  titulo: string,
  nombreDeEtapa: string,
  posicion: number,
  total: number,
): string {
  return `"${titulo}" sigue en ${nombreDeEtapa}, posición ${posicion} de ${total}`
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

export function anuncioEtapaCreada(nombre: string, total: number): string {
  return `Etapa ${nombre} añadida, posición ${total} de ${total}`
}

export function anuncioEtapaSinCrear(exceso: number): string {
  return `Etapa sin crear. ${textoDeExceso(exceso)}`
}

export function anuncioEtapaRenombrada(nombre: string): string {
  return `Etapa renombrada a ${nombre}`
}

export function anuncioNombreRecuperado(nombre: string): string {
  return `Nombre vacío. Se recupera "${nombre}"`
}

export function anuncioNombreSinGuardar(exceso: number): string {
  return `Nombre sin guardar. ${textoDeExceso(exceso)}`
}

export function anuncioEtapaMovida(nombre: string, posicion: number, total: number): string {
  return `Etapa ${nombre} movida a la posición ${posicion} de ${total}`
}

export function anuncioEtapaCogida(nombre: string, posicion: number, total: number): string {
  return `Etapa ${nombre} cogida, posición ${posicion} de ${total}`
}

export function anuncioEtapaSobre(nombre: string, posicion: number, total: number): string {
  return `Etapa ${nombre} sobre la posición ${posicion} de ${total}`
}

export function anuncioEtapaSinMover(nombre: string, posicion: number, total: number): string {
  return `Etapa ${nombre} sigue en la posición ${posicion} de ${total}`
}

export function avisoEtapaBorrada(nombre: string): string {
  return `Etapa ${nombre} borrada`
}

export function anuncioEtapaBorrada(nombre: string, pendientes: number): string {
  const conPendientes = pendientes > 0 ? ` con ${textoDePendientes(pendientes)}` : ''
  return `${avisoEtapaBorrada(nombre)}${conPendientes}. Deshacer disponible`
}

export function anuncioEtapaRestaurada(nombre: string, posicion: number, total: number): string {
  return `Etapa ${nombre} restaurada, posición ${posicion} de ${total}`
}

export function textoDeConfirmacionDeEtapa(pendientes: number): string {
  return `${pendientes === 1 ? 'Se borrará' : 'Se borrarán'} ${textoDePendientes(pendientes)}.`
}

function textoDePendientes(total: number): string {
  return `${total} ${total === 1 ? 'Pendiente' : 'Pendientes'}`
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
