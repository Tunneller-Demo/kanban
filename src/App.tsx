import { Tablero } from '@/interfaz/Tablero'
import { tableroDePartida } from '@/modelo/tablero'

const tablero = tableroDePartida()

export function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex-none px-4 pt-3 pb-2 carriles:px-6 carriles:py-4">
        <h1 className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[.01em]">
          <span aria-hidden className="size-2.5 rounded-xs bg-primary" />
          Tablero de pendientes
        </h1>
      </header>
      <main className="flex flex-1 flex-col">
        <Tablero tablero={tablero} />
      </main>
    </div>
  )
}
