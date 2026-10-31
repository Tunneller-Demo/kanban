// El enlace va en el documento porque Firefox no siempre descarga con uno suelto.
// La URL sobrevive un turno: revocarla al momento puede cortar la descarga.
export function descargarArchivo(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url))
}
