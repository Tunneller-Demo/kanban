const NOMBRE_DE_LA_APP = 'tablero-de-pendientes'

// La app comparte origen con las previews y con otras apps de `tunneller-demo.github.io`:
// la ruta base evita que una preview lea o pise el Tablero publicado.
export function claveDeAlmacenamiento(rutaBase: string = import.meta.env.BASE_URL): string {
  return `${NOMBRE_DE_LA_APP}:${rutaBase}`
}
