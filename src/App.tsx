import { useRef } from 'react'
import { useEstadoDeLaApp } from '@/estado/useEstadoDeLaApp'
import { AvisoDeDeshacer } from '@/interfaz/AvisoDeDeshacer'
import { CopiaDeSeguridad } from '@/interfaz/CopiaDeSeguridad'
import { Importacion } from '@/interfaz/Importacion'
import { InvitacionDeTableroVacio } from '@/interfaz/InvitacionDeTableroVacio'
import { Tablero } from '@/interfaz/Tablero'
import { Vaciar } from '@/interfaz/Vaciar'
import { contarPendientes } from '@/modelo/tablero'

export function App() {
  const {
    tablero,
    ejemploIntacto,
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
    vaciar,
    verEjemplo,
    importar,
    deshacer,
    cerrarAviso,
    anunciar,
  } = useEstadoDeLaApp()
  const entradaDeArchivo = useRef<HTMLInputElement>(null)
  const totalDePendientes = contarPendientes(tablero)
  const elegirArchivo = () => entradaDeArchivo.current?.click()

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-none items-center justify-between gap-3 px-4 pt-3 pb-2 carriles:px-6 carriles:py-4">
        <h1 className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[.01em]">
          <span aria-hidden className="size-2.5 rounded-xs bg-primary" />
          Tablero de pendientes
        </h1>
        <Vaciar
          totalDePendientes={totalDePendientes}
          ejemploIntacto={ejemploIntacto}
          onVaciar={vaciar}
        />
      </header>
      {totalDePendientes === 0 && (
        <InvitacionDeTableroVacio onVerEjemplo={verEjemplo} onElegirArchivo={elegirArchivo} />
      )}
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
      <footer className="flex flex-none flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t px-4 py-1.5 text-xs text-muted-foreground carriles:px-6">
        {avisoDeDeshacer && (
          <AvisoDeDeshacer texto={avisoDeDeshacer} onDeshacer={deshacer} onCerrar={cerrarAviso} />
        )}
        <div className="flex flex-wrap items-center gap-x-3">
          <p>Tus datos se guardan solo en este navegador</p>
          <CopiaDeSeguridad
            tablero={tablero}
            onElegirArchivo={elegirArchivo}
            onAnunciar={anunciar}
          />
        </div>
        <p>Construida con Tunneller</p>
      </footer>
      <Importacion
        entrada={entradaDeArchivo}
        tablero={tablero}
        ejemploIntacto={ejemploIntacto}
        onImportar={importar}
      />
      <div role="status" aria-live="polite" className="sr-only">
        <span key={ordenDeAnuncio}>{anuncio}</span>
      </div>
    </div>
  )
}
