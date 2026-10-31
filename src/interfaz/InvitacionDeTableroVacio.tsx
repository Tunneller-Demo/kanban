type Props = {
  onVerEjemplo: () => void
  onElegirArchivo: () => void
}

const estiloDeAccion =
  'min-h-11 flex-none rounded-md px-2.5 font-medium text-primary hover:bg-muted carriles:min-h-8'

// Va encima de las Etapas y no en su lugar: el primer Pendiente se crea en sus campos.
export function InvitacionDeTableroVacio({ onVerEjemplo, onElegirArchivo }: Props) {
  return (
    <div className="mx-[7.5vw] mb-2 flex flex-none flex-wrap items-center gap-x-3 rounded-md bg-card px-3 py-1 text-sm text-card-foreground carriles:mx-6">
      <p className="py-1">Tu Tablero está vacío. Crea tu primer Pendiente en cualquier Etapa.</p>
      <button type="button" onClick={onVerEjemplo} className={estiloDeAccion}>
        Ver el Tablero de ejemplo
      </button>
      <button
        type="button"
        onClick={(evento) => {
          // Safari no enfoca el botón al pulsarlo, y el foco debe volver aquí si hay un error.
          evento.currentTarget.focus()
          onElegirArchivo()
        }}
        className={estiloDeAccion}
      >
        Importar una Copia de seguridad
      </button>
    </div>
  )
}
