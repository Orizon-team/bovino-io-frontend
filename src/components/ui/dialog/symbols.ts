import type { InjectionKey, Ref } from 'vue'

export interface DialogContext {
  open: Ref<boolean>
  setOpen: (open: boolean) => void
}

export const DialogSymbol: InjectionKey<DialogContext> = Symbol('Dialog')