export const PopoverSymbol = Symbol.for('Popover')

export interface PopoverContext {
  open: import('vue').ComputedRef<boolean>
  setOpen: (value: boolean) => void
}