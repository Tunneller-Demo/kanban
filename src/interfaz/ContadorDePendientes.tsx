export function ContadorDePendientes({ total }: { total: number }) {
  return (
    <span className="rounded-sm bg-card px-1.5 py-px font-mono text-xs text-card-foreground">
      {total}
      <span className="sr-only"> {total === 1 ? 'Pendiente' : 'Pendientes'}</span>
    </span>
  )
}
