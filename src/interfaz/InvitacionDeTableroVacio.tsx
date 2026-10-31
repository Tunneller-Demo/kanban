type Props = {
  onVerEjemplo: () => void
}

// Va encima de las Etapas y no en su lugar: el primer Pendiente se crea en sus campos.
export function InvitacionDeTableroVacio({ onVerEjemplo }: Props) {
  return (
    <div className="mx-[7.5vw] mb-2 flex flex-none flex-wrap items-center gap-x-3 rounded-md bg-card px-3 py-1 text-sm text-card-foreground carriles:mx-6">
      <p className="py-1">Tu Tablero está vacío. Crea tu primer Pendiente en cualquier Etapa.</p>
      <button
        type="button"
        onClick={onVerEjemplo}
        className="min-h-11 flex-none rounded-md px-2.5 font-medium text-primary hover:bg-muted carriles:min-h-8"
      >
        Ver el Tablero de ejemplo
      </button>
    </div>
  )
}
