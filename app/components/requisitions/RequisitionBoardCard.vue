<!--
  Board (kanban) card — mirrors the jobs-pipeline CandidatePipelineCard design:
  requester avatar, title + code, a stats row (status pill + HIRES pill), a
  hover kebab, and a bordered footer (department + location).
-->
<script setup lang="ts">
import { MapPin, Briefcase, Bookmark, MoreHorizontal, Eye, Copy, Archive, Trash2 } from 'lucide-vue-next'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import RequisitionStatusBadge from './RequisitionStatusBadge.vue'
import type { Requisition } from '~/types'

const props = defineProps<{ requisition: Requisition, currentUserId: string }>()
const emit = defineEmits<{ open: []; follow: []; duplicate: []; archive: []; delete: [] }>()

const r = computed(() => props.requisition)
const isOwner = computed(() => r.value.requesterId === props.currentUserId)
const isArchived = computed(() => r.value.status === 'archived')
</script>

<template>
  <article
    class="group border rounded-[12px] overflow-hidden bg-white border-[var(--brand-border-light)] hover:shadow-[0_2px_8px_rgba(0,20,18,0.06)] hover:border-[var(--brand-border-mid)] transition-all cursor-pointer"
    @click="emit('open')"
  >
    <div class="flex items-start gap-[11px] pt-[13px] pb-[11px] px-3.5">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-[7px]">
          <span class="text-[14px] font-semibold text-[var(--brand-text)] truncate">{{ r.title }}</span>
          <span class="text-[11px] font-medium text-[var(--brand-text-quiet)] tabular-nums shrink-0">#{{ r.code }}</span>
          <Bookmark v-if="r.following" class="w-[13px] h-[13px] shrink-0 text-[var(--brand-status-approved-text)]" fill="currentColor" />
        </div>
        <div class="flex items-center gap-[10px] mt-[7px]">
          <RequisitionStatusBadge :status="r.status" variant="solid" />
          <span class="inline-flex items-center gap-[5px] whitespace-nowrap shrink-0 text-[9px] font-bold tracking-[0.05em] text-[var(--brand-text-secondary)] bg-[var(--brand-canvas)] rounded-[4px] px-1.5 py-0.5">
            HIRES
            <span class="text-[10px] text-[var(--brand-text)] tabular-nums">{{ r.openingsTotal ? `${r.hiresCount}/${r.openingsTotal}` : '–' }}</span>
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--brand-canvas)] transition"
            :aria-label="`Actions for ${r.title}`"
            @click.stop
            @keydown.stop
          >
            <MoreHorizontal class="w-4 h-4" stroke-width="1.8" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44" @click.stop>
          <DropdownMenuItem class="text-[13.5px] gap-2 cursor-pointer" @click="emit('open')"><Eye class="w-4 h-4" /> Open</DropdownMenuItem>
          <DropdownMenuItem class="text-[13.5px] gap-2 cursor-pointer" @click="emit('follow')"><Bookmark class="w-4 h-4" /> {{ r.following ? 'Unfollow' : 'Follow' }}</DropdownMenuItem>
          <DropdownMenuItem class="text-[13.5px] gap-2 cursor-pointer" @click="emit('duplicate')"><Copy class="w-4 h-4" /> Duplicate</DropdownMenuItem>
          <template v-if="isOwner">
            <DropdownMenuSeparator />
            <DropdownMenuItem v-if="!isArchived" class="text-[13.5px] gap-2 cursor-pointer" @click="emit('archive')"><Archive class="w-4 h-4" /> Archive</DropdownMenuItem>
            <DropdownMenuItem class="text-[13.5px] gap-2 cursor-pointer text-[var(--brand-danger)] focus:text-[var(--brand-danger)]" @click="emit('delete')"><Trash2 class="w-4 h-4" /> Delete</DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div v-if="r.department || r.locations.length" class="border-t border-[var(--brand-border-fade)] px-3.5 py-[9px] flex items-center gap-[14px] text-[12.5px] text-[var(--brand-text-quiet)]">
      <span v-if="r.department" class="inline-flex items-center gap-1.5 min-w-0 truncate"><Briefcase class="w-[14px] h-[14px] shrink-0" stroke-width="1.5" />{{ r.department }}</span>
      <span v-if="r.locations.length" class="inline-flex items-center gap-1.5 shrink-0"><MapPin class="w-[14px] h-[14px]" stroke-width="1.5" />{{ r.locations[0] }}</span>
    </div>
  </article>
</template>
