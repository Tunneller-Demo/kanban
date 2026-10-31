import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

// A pantalla casi completa en móvil; centrado y a su medida desde que las Etapas van en fila.
export function DialogContent({
  className,
  children,
  sinCerrar = false,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { sinCerrar?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-2 z-50 flex flex-col gap-4 overflow-y-auto rounded-[10px] border bg-popover p-4 text-popover-foreground shadow-lg',
          'carriles:inset-auto carriles:top-1/2 carriles:left-1/2 carriles:max-h-[calc(100dvh-2rem)] carriles:w-full carriles:max-w-lg carriles:-translate-x-1/2 carriles:-translate-y-1/2',
          className,
        )}
        {...props}
      >
        {children}
        {!sinCerrar && (
          <DialogPrimitive.Close className="absolute top-2 right-2 grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground carriles:size-8">
            <X aria-hidden className="size-4" />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
