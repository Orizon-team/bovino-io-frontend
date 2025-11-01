export const DropdownMenuSymbol = Symbol.for('DropdownMenu')

export interface DropdownMenuContext {
  open: import('vue').ComputedRef<boolean>
  setOpen: (value: boolean) => void
}