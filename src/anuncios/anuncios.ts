// Anuncios: el único punto que genera los textos para el lector de pantalla.

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

export function textoDeExceso(exceso: number): string {
  return exceso === 1 ? 'Sobra 1 carácter' : `Sobran ${exceso} caracteres`
}
