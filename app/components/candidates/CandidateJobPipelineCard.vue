<!--
  One row in the Overview-tab aside "jobs" card: status dot + job title +
  collapsible stage/action body. Extracted because a candidate can be linked
  to multiple jobs — this repeats N times inside the same white card shell.
  Disqualify opens a searchable reason picker; the chosen reason is shown
  in place of the stage while the candidate is disqualified for that job.
-->
<script setup lang="ts">
import { ChevronDown, GripVertical, XCircle, ArrowRight, RotateCcw, Check, Search } from 'lucide-vue-next'
import { BrandButton } from '~/components/brand'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import type { CandidateJob } from '~/types'

defineProps<{
  job: CandidateJob
  location: string
  assignedDate: string
  /** E2 — non-owner viewers can see the pipeline but can't move/disqualify/requalify. */
  readOnly?: boolean
}>()

const emit = defineEmits<{
  disqualify: [reason: string]
  proceed: []
  requalify: []
}>()

const open = ref(true)

const STAGES = ['Applied', 'Phone Interview', 'Assessment', 'Offer'] as const
const stage = ref<typeof STAGES[number]>('Applied')

const DISQUALIFY_REASONS = [
  'Not a fit', 'Lack of knowledge', 'Hired elsewhere', 'Overpriced',
  'Spam', 'Lacks interpersonal skills', 'Wrong skill set',
]
const reasonQuery = ref('')
const disqPickerOpen = ref(false)
const reason = ref('Not a fit')
const filteredReasons = computed(() => {
  const q = reasonQuery.value.trim().toLowerCase()
  return DISQUALIFY_REASONS.filter(r => !q || r.toLowerCase().includes(q))
})
function pickReason(r: string) {
  reason.value = r
  disqPickerOpen.value = false
  reasonQuery.value = ''
  emit('disqualify', r)
}
</script>

<template>
  <div class="border-b border-[var(--brand-border-hairline)] last:border-b-0">
    <button
      type="button"
      class="w-full flex items-center gap-2.5 px-5 pt-3 pb-1 cursor-pointer text-left"
      @click="open = !open"
    >
      <GripVertical class="w-3.5 h-3.5 text-[var(--brand-border-mid)] shrink-0" />
      <span class="flex-1 inline-flex items-center gap-2 text-[14px] font-bold text-[var(--brand-text)]">
        <span
          class="w-[9px] h-[9px] rounded-full shrink-0"
          :class="job.disqualified ? 'bg-[var(--brand-danger)]' : 'bg-[var(--brand-status-teal-green)]'"
        />
        {{ job.title }}
      </span>
      <ChevronDown
        class="w-4 h-4 text-[var(--brand-text-quiet)] transition-transform duration-150 shrink-0"
        :class="{ 'rotate-180': open }"
        stroke-width="2"
      />
    </button>
    <div v-show="open" class="px-5 pt-0.5 pb-4">
      <span
        v-if="job.disqualified"
        class="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--brand-danger)]"
      >
        <XCircle class="w-4 h-4" stroke-width="1.8" />{{ reason }}
      </span>
      <DropdownMenu v-else>
        <DropdownMenuTrigger as-child :disabled="readOnly">
          <button
            type="button"
            :disabled="readOnly"
            :title="readOnly ? 'Read-only — assigned to another recruiter' : undefined"
            class="inline-flex items-center gap-2 mt-1.5 font-semibold text-[14px] text-[var(--brand-text)] bg-[var(--brand-surface-hover)] border border-[var(--brand-border)] rounded-[10px] px-3.5 py-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ stage }}
            <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-icon-default)]" stroke-width="2" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="min-w-[180px] p-1.5 rounded-[12px]">
          <DropdownMenuItem v-for="s in STAGES" :key="s" class="flex items-center justify-between gap-2 text-[13.5px]" @click="stage = s">
            {{ s }}
            <Check v-if="stage === s" class="w-3.5 h-3.5 text-[var(--brand-teal)]" stroke-width="2" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div class="text-[13px] text-[var(--brand-text-quiet)] mt-3">
        Assigned {{ assignedDate }} · {{ location }}
      </div>
      <div v-if="job.disqualified" class="mt-4">
        <BrandButton
          variant="outline" size="md" :disabled="readOnly"
          :title="readOnly ? 'Read-only — assigned to another recruiter' : undefined"
          class="w-full !text-[var(--brand-success)] !border-[color-mix(in_srgb,var(--brand-success)_35%,transparent)] disabled:opacity-60 disabled:cursor-not-allowed"
          @click="emit('requalify')"
        >
          <RotateCcw class="w-4 h-4" stroke-width="1.9" />Requalify
        </BrandButton>
      </div>
      <div v-else class="flex gap-2.5 mt-4">
        <Popover v-model:open="disqPickerOpen">
          <PopoverTrigger as-child :disabled="readOnly">
            <BrandButton
              variant="outline" size="md" :disabled="readOnly"
              :title="readOnly ? 'Read-only — assigned to another recruiter' : undefined"
              class="flex-1 !text-[var(--brand-danger)] !border-[color-mix(in_srgb,var(--brand-danger)_25%,transparent)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <XCircle class="w-4 h-4" stroke-width="1.8" />Disqualify
            </BrandButton>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-[300px] p-0 rounded-[14px] overflow-hidden">
            <div class="text-center text-[14px] font-bold text-[var(--brand-text)] px-4 py-3 border-b border-[var(--brand-border-hairline)] bg-[var(--brand-surface-hover)]">Disqualify candidate</div>
            <div class="p-3 pb-1.5">
              <div class="flex items-center gap-2.5 border-[1.6px] border-[var(--brand-border)] rounded-[10px] px-3 py-2.5 focus-within:border-[var(--brand-lime)]">
                <Search class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
                <input v-model="reasonQuery" type="text" placeholder="Search disqualify reasons" class="flex-1 min-w-0 border-none outline-none bg-transparent text-[13.5px] text-[var(--brand-text)]">
              </div>
            </div>
            <div class="px-1.5 pb-1.5 max-h-[280px] overflow-y-auto">
              <button
                v-for="r in filteredReasons"
                :key="r"
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-[9px] cursor-pointer hover:bg-[var(--brand-surface-hover)] text-left"
                @click="pickReason(r)"
              >
                <XCircle class="w-[18px] h-[18px] text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.7" />
                <span class="text-[14px] font-semibold text-[var(--brand-text)]">{{ r }}</span>
              </button>
              <p v-if="!filteredReasons.length" class="px-3 py-2.5 text-[13px] text-[var(--brand-text-quiet)]">No reasons match.</p>
            </div>
          </PopoverContent>
        </Popover>
        <BrandButton
          variant="primary-teal" size="md" :disabled="readOnly"
          :title="readOnly ? 'Read-only — assigned to another recruiter' : undefined"
          class="flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
          @click="emit('proceed')"
        >
          Proceed<ArrowRight class="w-4 h-4" stroke-width="2" />
        </BrandButton>
      </div>
    </div>
  </div>
</template>
