<script setup lang="ts">
interface Props {
  open: boolean
  payload?: any
  mensaje?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  mensaje: 'Se ha detectado un tag',
})

const emit = defineEmits<{ (e: 'accept', payload?: any): void; (e: 'cancel'): void; (e: 'update:open', val: boolean): void }>()

function onAccept() {
  emit('accept', props.payload)
  emit('update:open', false)
}

function onCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="onCancel"></div>

      <div class="relative z-10 w-full max-w-lg">
        <div class="modal-card animate-modal-pop bg-surface rounded-xl border border-border shadow-2xl overflow-hidden">
          <div class="p-6 flex gap-4 items-start">
            <!-- Icon circle -->
            <div class="icon-circle" aria-hidden="true">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"/>
              </svg>
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between gap-4">
                <h3 class="text-xl font-semibold text-foreground">{{ mensaje }}</h3>
                <div class="badge-sm text-muted-foreground">Registro</div>
              </div>
              <p class="mt-2 text-sm text-muted-foreground">Se ha detectado el siguiente tag. ¿Deseas continuar con el registro?</p>

              <div class="mt-5 grid grid-cols-2 gap-y-2 gap-x-6 text-sm text-foreground">
                <div class="label label-anim flex items-center gap-2">
                  <span class="info-icon" aria-hidden="true">
                    <!-- tag icon -->
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.59 13.41L10 3.83 3.83 10l10.59 10.59a2 2 0 002.83 0l3.34-3.34a2 2 0 000-2.83z"/>
                      <circle cx="7.5" cy="7.5" r="1.5" />
                    </svg>
                  </span>
                  Tag Id:
                </div>
                <div class="value value-anim">{{ props.payload?.tag?.name ?? props.payload?.name ?? props.payload?.tag_name ?? props.payload?.tag_id ?? props.payload?.id ?? '-' }}</div>

                <div class="label label-anim flex items-center gap-2">
                  <span class="info-icon user-icon" aria-hidden="true">
                    <!-- user icon -->
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11zM4 20a6 6 0 0112 0"/>
                    </svg>
                  </span>
                  Usuario:
                </div>
                <div class="value value-anim">{{ props.payload?.user?.full_name ?? props.payload?.user?.name ?? props.payload?.user?.display_name ?? props.payload?.user?.username ?? props.payload?.user?.id_user ?? props.payload?.user?.id ?? props.payload?.user?.email ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-muted/4 flex justify-end gap-3">
            <button class="btn-outline" @click="onCancel">Cancelar</button>
            <button class="btn-accept" @click="onAccept">Aceptar</button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

/* Pop animation */
@keyframes modalPop {
  from { opacity: 0; transform: translateY(8px) scale(.995); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-modal-pop { animation: modalPop 240ms cubic-bezier(.2,.9,.2,1) both; }

/* icon pulse */
@keyframes iconPulse { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }
.icon-circle { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; background-color: rgba(34,197,94,0.08); color: #059669; box-shadow: 0 0 0 rgba(5,150,105,0.06); animation: iconPulse 1500ms ease-in-out infinite; }

/* Buttons */
.btn-outline { border: 1px solid var(--border-color, #e6e9ee); padding: 8px 14px; border-radius: 8px; background: var(--surface, #fff); color: var(--fg, #0f172a); font-size: 0.95rem; }
.btn-outline:hover { background: rgba(15,23,42,0.03); }
.btn-accept { background: #047857; color: white; padding: 8px 14px; border-radius: 8px; border: none; box-shadow: 0 6px 18px rgba(4,120,87,0.12); }
.btn-accept:hover { transform: translateY(-1px); }

/* Layout helpers / fallbacks */
.modal-card { border-radius: 12px; overflow: hidden; }
.bg-surface { background: white; }
.border-border { border-color: #e6e9ee; }
.shadow-2xl { box-shadow: 0 25px 50px rgba(2,6,23,0.18); }
.text-foreground { color: #0f172a; }
.text-muted-foreground { color: #6b7280; }
.badge-sm { background: rgba(15,23,42,0.03); padding: 4px 8px; border-radius: 9999px; font-size: 0.8rem; }
.bg-muted\/4 { background: rgba(15,23,42,0.04); }
.border { border-width: 1px; }
.p-6 { padding: 1.5rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
.gap-y-2 { row-gap: 0.5rem; }
.gap-x-6 { column-gap: 1.5rem; }
.label { color: #374151; font-weight: 600; }
.value { color: #111827; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

/* Small animations for the info rows (only this section) */
@keyframes infoRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes iconPop { 0% { transform: scale(.88); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }

.label-anim { animation: infoRise 300ms cubic-bezier(.2,.9,.2,1) both; }
.value-anim { animation: infoRise 340ms cubic-bezier(.2,.9,.2,1) both; font-weight: 600; }
.info-icon { display: inline-flex; align-items: center; justify-content: center; color: #10b981; }
.info-icon svg { animation: iconPop 620ms ease both; stroke: currentColor; }
.user-icon { color: #2563eb; }

/* micro interaction: highlight value on hover of row */
.mt-5 .label-anim:hover ~ .value-anim, .mt-5 .label-anim:focus ~ .value-anim { transform: translateX(2px); }

</style>
