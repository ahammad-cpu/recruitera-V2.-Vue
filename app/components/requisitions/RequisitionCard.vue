<!--
  Requisition card — a gray header strip (title + status + code + follow/kebab)
  over a white body (Hires block + meta line + hint), matching the reference.
-->
<script setup lang="ts">
import { Bookmark, MapPin } from 'lucide-vue-next'
import RequisitionStatusBadge from './RequisitionStatusBadge.vue'
import RequisitionRowActions from './RequisitionRowActions.vue'
import type { Requisition } from '~/types'

const props = defineProps<{ requisition: Requisition, currentUserId: string, compact?: boolean }>()
const emit = defineEmits<{ open: []; follow: []; duplicate: []; archive: []; delete: [] }>()

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const r = computed(() => props.requisition)
const showHint = computed(() => ['draft', 'pending', 'rejected'].includes(r.value.status))
</script>

<template>
  <div
    class="group rounded-[14px] border border-[var(--brand-border-light)] overflow-hidden cursor-pointer transition hover:border-[var(--brand-border-mid)] hover:shadow-[0_2px_12px_rgba(0,20,18,0.06)]"
    @click="emit('open')"
  >
    <!-- Gray header strip -->
    <div class="bg-[var(--brand-canvas)] px-5 py-3.5 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0 flex-wrap">
        <h3 class="text-[16px] font-bold text-[var(--brand-text)] truncate group-hover:text-[var(--brand-teal)] transition-colors">{{ r.title }}</h3>
        <RequisitionStatusBadge :status="r.status" variant="solid" />
        <span class="text-[13px] font-medium text-[var(--brand-text-quiet)] tabular-nums">#{{ r.code }}</span>
      </div>
      <div class="flex items-center gap-0.5 shrink-0" @click.stop>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] font-semibold transition-colors"
          :class="r.following ? 'text-[var(--brand-text-secondary)]' : 'text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'"
          :aria-pressed="r.following"
          @click="emit('follow')"
        >
          <Bookmark class="w-[17px] h-[17px]" :class="r.following ? 'text-[var(--brand-status-approved-text)]' : ''" :fill="r.following ? 'currentColor' : 'none'" />
          <span>{{ r.following ? 'Following' : 'Follow' }}</span>
        </button>
        <RequisitionRowActions
          :requisition="r"
          :current-user-id="currentUserId"
          @view="emit('open')"
          @follow="emit('follow')"
          @duplicate="emit('duplicate')"
          @archive="emit('archive')"
          @delete="emit('delete')"
        />
      </div>
    </div>

    <!-- White body: hires block + meta -->
    <div class="bg-white px-5 py-4 border-t border-[var(--brand-border-fade)] flex items-stretch gap-6">
      <div class="shrink-0 min-w-[56px] flex flex-col justify-center">
        <div class="text-[20px] font-bold text-[var(--brand-text)] tabular-nums leading-none">
          {{ r.openingsTotal ? `${r.hiresCount}/${r.openingsTotal}` : '–' }}
        </div>
        <div class="mt-1.5 text-[12px] font-medium text-[var(--brand-text-quiet)]">Hires</div>
      </div>
      <div class="w-px self-stretch bg-[var(--brand-border-fade)]" />
      <div class="min-w-0 flex-1 flex flex-col justify-center">
        <div class="flex items-center gap-x-2.5 gap-y-1 flex-wrap text-[13.5px] text-[var(--brand-text-secondary)]">
          <span class="tabular-nums">{{ fmtDate(r.updatedAt) }}</span>
          <template v-if="r.department"><span class="text-[var(--brand-text-faint)]">•</span><span>{{ r.department }}</span></template>
          <template v-if="r.openingsTotal"><span class="text-[var(--brand-text-faint)]">•</span><span>{{ r.openingsTotal }} job opening{{ r.openingsTotal === 1 ? '' : 's' }}</span></template>
          <template v-if="r.locations.length"><span class="text-[var(--brand-text-faint)]">•</span><span class="inline-flex items-center gap-1"><MapPin class="w-3.5 h-3.5" />{{ r.locations[0] }}{{ r.locations.length > 1 ? ` +${r.locations.length - 1}` : '' }}</span></template>
        </div>
        <p v-if="showHint" class="mt-2 text-[13px] text-[var(--brand-text-quiet)]">Only approved requisitions can be assigned to jobs.</p>
        <p v-else-if="r.status === 'filled'" class="mt-2 inline-flex items-center gap-1.5 text-[13px] text-[var(--brand-text-secondary)]"><span class="w-2 h-2 rounded-full bg-[var(--brand-danger)]" /> Assigned to a job</p>
        <p v-else class="mt-2 text-[13px] text-[var(--brand-status-approved-text)] font-medium">Ready to assign to jobs.</p>
      </div>
    </div>
  </div>
</template>
