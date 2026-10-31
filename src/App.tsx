import { useEstadoDeLaApp } from '@/estado/useEstadoDeLaApp'
import { AvisoDeDeshacer } from '@/interfaz/AvisoDeDeshacer'
import { Tablero } from '@/interfaz/Tablero'

export function App() {
  const {
    tablero,
    anuncio,
    ordenDeAnuncio,
    foco,
    avisoDeDeshacer,
    crear,
    editar,
    borrar,
    subir,
    bajar,
    moverA,
    soltar,
    dejar,
    anadirEtapa,
    renombrar,
    moverEtapaIzquierda,
    moverEtapaDerecha,
    soltarEtapa,
    dejarEtapa,
    quitarEtapa,
    deshacer,
    cerrarAviso,
    anunciar,
  } = useEstadoDeLaApp()

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex-none px-4 pt-3 pb-2 carriles:px-6 carriles:py-4">
        <h1 className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[.01em]">
          <span aria-hidden className="size-2.5 rounded-xs bg-primary" />
          Tablero de pendientes
        </h1>
      </header>
      <Tablero
        tablero={tablero}
        foco={foco}
        onCrear={crear}
        onEditar={editar}
        onBorrar={borrar}
        onSubir={subir}
        onBajar={bajar}
        onMoverA={moverA}
        onSoltar={soltar}
        onDejar={dejar}
        onAnadirEtapa={anadirEtapa}
        onRenombrar={renombrar}
        onMoverEtapaIzquierda={moverEtapaIzquierda}
        onMoverEtapaDerecha={moverEtapaDerecha}
        onSoltarEtapa={soltarEtapa}
        onDejarEtapa={dejarEtapa}
        onQuitarEtapa={quitarEtapa}
        onAnunciar={anunciar}
      />
      <footer className="flex flex-none flex-wrap justify-between gap-x-4 gap-y-1.5 border-t px-4 py-1.5 text-xs text-muted-foreground carriles:px-6">
        {avisoDeDeshacer && (
          <AvisoDeDeshacer texto={avisoDeDeshacer} onDeshacer={deshacer} onCerrar={cerrarAviso} />
        )}
        <p>Tus datos se guardan solo en este navegador</p>
        <p>Construida con Tunneller</p>
      </footer>
      <div role="status" aria-live="polite" className="sr-only">
        <span key={ordenDeAnuncio}>{anuncio}</span>
      </div>
    </div>
  )
}
