<!--
  E5 UC-03/UC-04 — Admin/permitted-user manual assign or reassign of a
  single candidate's Smart Distribute owner. Distinct from CandidateAssignModal
  (that one assigns the candidate to jobs/talent pools, not a recruiter).
  Mirrors CandidateTagMenu's compact search-popover pattern.
-->
<script setup lang="ts">
import { Check, Search, UserCog } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { BrandAvatarInitials } from '~/components/brand'
import type { TeamMember } from '~/types'

const props = defineProps<{ teamMembers: TeamMember[]; current?: string | null }>()
const emit = defineEmits<{ select: [recruiterId: string | null] }>()

const open = ref(false)
const query = ref('')

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : ''
  return (first + last).toUpperCase() || '?'
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.teamMembers.filter(m => !q || m.name.toLowerCase().includes(q))
})

function pick(recruiterId: string | null) {
  emit('select', recruiterId)
  query.value = ''
  open.value = false
}
watch(open, (v) => { if (!v) query.value = '' })
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-full border border-dashed border-[var(--brand-border-mid)] text-[11.5px] font-bold text-[var(--brand-text-quiet)] hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal-secondary)] transition shrink-0"
        title="Assign to recruiter"
      >
        <UserCog class="w-3.5 h-3.5" stroke-width="1.8" />
        {{ current ? 'Reassign' : 'Assign to recruiter' }}
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-[264px] p-0 rounded-xl overflow-hidden">
      <div class="text-center text-[14px] font-bold text-[var(--brand-text)] px-4 py-2.5 border-b border-[var(--brand-border-hairline)] bg-[var(--brand-surface-hover)]">Assign to recruiter</div>
      <div class="p-3">
        <div class="flex items-center gap-2 border-[1.6px] border-[var(--brand-border)] rounded-[10px] px-3 py-2 focus-within:border-[var(--brand-lime)]">
          <Search class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
          <input
            v-model="query"
            type="text"
            placeholder="Search team members..."
            class="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px] text-[var(--brand-text)]"
          >
        </div>
      </div>
      <div class="px-1.5 pb-2 max-h-[240px] overflow-y-auto">
        <button
          v-if="current"
          type="button"
          class="block w-full text-left px-3 py-2.5 rounded-[9px] text-[13px] font-semibold text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/10 cursor-pointer"
          @click="pick(null)"
        >Unassign</button>
        <button
          v-for="m in filtered"
          :key="m.id"
          type="button"
          class="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-[9px] text-[13px] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)] cursor-pointer"
          @click="pick(m.id)"
        >
          <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="sm" />
          <span class="flex-1 min-w-0 truncate">{{ m.name }}</span>
          <Check v-if="m.id === current" class="w-3.5 h-3.5 text-[var(--brand-teal)] shrink-0" stroke-width="2.2" />
        </button>
        <p v-if="!filtered.length" class="px-3 py-2.5 text-[13px] text-[var(--brand-text-quiet)]">No team members found.</p>
      </div>
    </PopoverContent>
  </Popover>
</template>
