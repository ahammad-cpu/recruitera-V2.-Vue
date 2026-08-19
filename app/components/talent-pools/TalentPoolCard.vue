<!--
  Talent pool card (Recruitee-style): title + #code + Edit + kebab on top;
  department line if set; "N Candidates" + Follow/Following at the bottom.
-->
<script setup lang="ts">
import { Pencil, Users, Bookmark, Pin } from 'lucide-vue-next'
import TalentPoolRowActions from './TalentPoolRowActions.vue'
import type { TalentPool } from '~/types'

const props = defineProps<{ pool: TalentPool }>()
const emit = defineEmits<{ open: []; edit: []; follow: []; formLink: []; archive: []; retrieve: []; delete: [] }>()

const subLabel = computed(() => props.pool.category === 'department' ? props.pool.department : props.pool.category === 'event' ? props.pool.eventName : '')
</script>

<template>
  <div
    class="group rounded-[14px] border border-[var(--brand-border-light)] bg-white px-6 py-5 cursor-pointer transition hover:border-[var(--brand-border-mid)] hover:shadow-[0_2px_12px_rgba(0,20,18,0.06)]"
    @click="emit('open')"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-[17px] font-bold text-[var(--brand-text)] truncate group-hover:text-[var(--brand-teal)] transition-colors">{{ pool.name }}</h3>
          <Pin v-if="pool.pinned" class="w-3.5 h-3.5 text-[var(--brand-teal)] shrink-0" fill="currentColor" />
          <span class="text-[13px] font-medium text-[var(--brand-text-quiet)] tabular-nums">#{{ pool.code }}</span>
        </div>
        <div v-if="subLabel" class="mt-1 text-[13.5px] text-[var(--brand-text-secondary)]">{{ subLabel }}</div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0" @click.stop>
        <button v-if="!pool.system" type="button" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)] transition" @click="emit('edit')">
          <Pencil class="w-3.5 h-3.5" /> Edit
        </button>
        <TalentPoolRowActions :pool="pool" @form-link="emit('formLink')" @archive="emit('archive')" @retrieve="emit('retrieve')" @delete="emit('delete')" />
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-[var(--brand-border-fade)] flex items-center justify-between">
      <span class="inline-flex items-center gap-1.5 text-[13.5px] text-[var(--brand-text-secondary)]">
        <Users class="w-4 h-4 text-[var(--brand-text-quiet)]" />
        <strong class="text-[var(--brand-text)] font-bold tabular-nums">{{ pool.talentsCount }}</strong> Candidate{{ pool.talentsCount === 1 ? '' : 's' }}
      </span>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] font-semibold transition-colors"
        :class="pool.following ? 'text-[var(--brand-status-approved-text)]' : 'text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'"
        @click.stop="emit('follow')"
      >
        <Bookmark class="w-[17px] h-[17px]" :fill="pool.following ? 'currentColor' : 'none'" />
        {{ pool.following ? 'Following' : 'Follow' }}
      </button>
    </div>
  </div>
</template>
