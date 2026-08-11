<!--
  Header "Evaluate" quick-evaluation popover: a 1–5 star rating (required) +
  an optional comment. Submitting is a client-only no-op (no evaluation
  write endpoint yet) — it resets and closes, mirroring the reference mockup.
-->
<script setup lang="ts">
import { ThumbsUp, Star } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { BrandButton } from '~/components/brand'

const props = defineProps<{ candidateName: string; disabled?: boolean }>()

const open = ref(false)
const rating = ref(0)
const hover = ref(0)
const comment = ref('')
const shake = ref(false)

function submit() {
  if (!rating.value) {
    shake.value = true
    setTimeout(() => (shake.value = false), 320)
    return
  }
  // TODO: POST to /api/candidates/:id/evaluations once the endpoint exists.
  rating.value = 0
  comment.value = ''
  open.value = false
}
watch(open, (v) => { if (!v) { rating.value = 0; hover.value = 0; comment.value = '' } })
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child :disabled="props.disabled">
      <BrandButton
        variant="ghost" size="md" :disabled="props.disabled"
        :title="props.disabled ? 'Read-only — assigned to another recruiter' : undefined"
        class="!text-[var(--brand-text)] !text-[15px] !font-medium !px-3 !h-10 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <ThumbsUp class="!w-[18px] !h-[18px] text-[var(--brand-text)]" stroke-width="1.6" />Evaluate
      </BrandButton>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-[300px] p-0 rounded-[14px] overflow-hidden">
      <div class="px-[22px] py-3 border-b border-[var(--brand-border-hairline)] bg-[var(--brand-surface-hover)]">
        <div class="text-[16px] font-bold text-[var(--brand-text)] tracking-[-0.01em]">Quick Evaluation</div>
        <div class="text-[13px] text-[var(--brand-text-secondary)] mt-0.5 truncate">{{ candidateName }}</div>
      </div>
      <div class="px-[22px] pt-[18px] pb-[22px]">
        <div class="text-[14px] font-bold text-[var(--brand-text)] mb-2.5">Rating <span class="text-[var(--brand-danger)]">*</span></div>
        <div class="flex gap-1 mb-5" :class="{ 'cp-shake': shake }" @mouseleave="hover = 0">
          <button
            v-for="v in 5"
            :key="v"
            type="button"
            class="cursor-pointer"
            @mouseenter="hover = v"
            @click="rating = v"
          >
            <Star
              class="w-[26px] h-[26px] transition-colors"
              :class="v <= (hover || rating) ? 'text-[var(--brand-warning)] fill-[var(--brand-warning)]' : 'text-[var(--brand-border-mid)] fill-[var(--brand-border-mid)]'"
              stroke-width="0"
            />
          </button>
        </div>
        <div class="text-[14px] font-bold text-[var(--brand-text)] mb-2.5">Comment <span class="font-medium text-[var(--brand-text-quiet)]">(Optional)</span></div>
        <textarea
          v-model="comment"
          rows="4"
          placeholder="Type here…"
          class="w-full box-border resize-none border border-[var(--brand-border)] rounded-[10px] px-3 py-2.5 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-lime)]"
        />
        <BrandButton variant="primary-teal" size="md" class="w-full mt-4 justify-center" @click="submit">Submit Evaluation</BrandButton>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
@keyframes cp-shake { 0%, 100% { transform: translateX(0) } 25% { transform: translateX(-4px) } 75% { transform: translateX(4px) } }
.cp-shake { animation: cp-shake 0.32s ease }
</style>
