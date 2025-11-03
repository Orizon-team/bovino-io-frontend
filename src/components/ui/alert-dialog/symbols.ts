import type { InjectionKey, Ref } from 'vue'

export interface AlertDialogContext {
  open: Ref<boolean>
  setOpen: (open: boolean) => void
}

export const AlertDialogSymbol: InjectionKey<AlertDialogContext> = Symbol('AlertDialog')