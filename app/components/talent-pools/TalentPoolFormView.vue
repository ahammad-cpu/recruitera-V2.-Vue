<!--
  Full-page create / edit talent pool form (Recruitee-style): Title + Department,
  a Description editor, and a Team members section. Used by new.vue and [id]/edit.vue.
-->
<script setup lang="ts">
import { ArrowLeft, Bold, Italic, Underline, Link2, Undo2, Redo2, Smile, Plus, X, Building2, CalendarDays } from 'lucide-vue-next'
import { BrandButton, BrandAvatarInitials } from '~/components/brand'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import type { NewTalentPoolInput, TalentPool, TalentPoolCategory } from '~/types'
import type { TalentPoolMemberOption } from '~/composables/useTalentPools'

const props = defineProps<{
  pool?: TalentPool | null
  members: TalentPoolMemberOption[]
  departments: string[]
  submitting?: boolean
}>()
const emit = defineEmits<{ submit: [payload: NewTalentPoolInput]; back: [] }>()

const isEdit = computed(() => !!props.pool)
const name = ref('')
const category = ref<TalentPoolCategory>('department')
const department = ref('')
const eventName = ref('')
const description = ref('')
const memberIds = ref<string[]>([])
const touched = ref(false)

watch(() => props.pool, (p) => {
  name.value = p?.name ?? ''
  category.value = (p?.category as TalentPoolCategory) ?? 'department'
  department.value = p?.department ?? ''
  eventName.value = p?.eventName ?? ''
  description.value = p?.description ?? ''
  memberIds.value = p ? p.members.map(m => m.id) : (props.members[0] ? [props.members[0].id] : [])
}, { immediate: true })
// Seed default member once members load (create mode)
watch(() => props.members, (m) => { if (!props.pool && !memberIds.value.length && m[0]) memberIds.value = [m[0].id] })

const nameErr = computed(() => touched.value && !name.value.trim())
const deptErr = computed(() => touched.value && category.value === 'department' && !department.value)
const eventErr = computed(() => touched.value && category.value === 'event' && !eventName.value.trim())
const assigned = computed(() => memberIds.value.map(id => props.members.find(m => m.id === id)).filter(Boolean) as TalentPoolMemberOption[])
const unassigned = computed(() => props.members.filter(m => !memberIds.value.includes(m.id)))

function addMember(id: string) { if (!memberIds.value.includes(id)) memberIds.value.push(id) }
function removeMember(id: string) { memberIds.value = memberIds.value.filter(x => x !== id) }

const valid = computed(() => name.value.trim()
  && (category.value === 'department' ? !!department.value : category.value === 'event' ? !!eventName.value.trim() : true))
function submit() {
  touched.value = true
  if (!valid.value) return
  emit('submit', {
    name: name.value.trim(), category: category.value,
    department: category.value === 'department' ? department.value : undefined,
    eventName: category.value === 'event' ? eventName.value.trim() : undefined,
    description: description.value.trim(), memberIds: memberIds.value,
  })
}

const cardCls = 'rounded-2xl border border-[var(--brand-border-light)] bg-white p-6'
const labelCls = 'block text-[14px] font-bold text-[var(--brand-text)] mb-1.5'
const fieldCls = 'w-full h-11 rounded-lg border bg-white px-3.5 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-teal)] transition-colors'
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
    <div class="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <button type="button" class="w-9 h-9 rounded-lg grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)] transition shrink-0" aria-label="Back" @click="emit('back')"><ArrowLeft class="w-5 h-5" /></button>
        <div>
          <h1 class="text-[22px] font-bold text-[var(--brand-text)]">{{ isEdit ? 'Edit talent pool' : 'Create a new talent pool' }}</h1>
          <p class="text-[13px] text-[var(--brand-text-quiet)]">Fill out required information and save.</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto px-6 pb-10">
      <div class="max-w-[1000px] mx-auto">
        <div class="flex items-center justify-between mb-4">
          <span class="text-[13px] text-[var(--brand-text-quiet)]">Not saved yet</span>
          <BrandButton variant="primary-teal" size="md" :disabled="submitting" @click="submit">{{ isEdit ? 'Save changes' : 'Create' }}</BrandButton>
        </div>

        <div class="space-y-5">
          <!-- Category + Title + Department/Event -->
          <section :class="cardCls">
            <!-- Category (create only) -->
            <div v-if="!isEdit" class="mb-5">
              <label :class="labelCls">Category <span class="text-[var(--brand-danger)]">*</span></label>
              <div class="grid grid-cols-2 gap-3 max-w-[520px]">
                <button type="button" class="flex items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition" :class="category === 'department' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint-hover)]' : 'border-[var(--brand-border-light)] hover:border-[var(--brand-border)]'" @click="category = 'department'">
                  <Building2 class="w-5 h-5 text-[var(--brand-teal)]" />
                  <span><span class="block text-[13.5px] font-semibold text-[var(--brand-text)]">Department</span><span class="block text-[11.5px] text-[var(--brand-text-quiet)]">Organize by business unit</span></span>
                </button>
                <button type="button" class="flex items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition" :class="category === 'event' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint-hover)]' : 'border-[var(--brand-border-light)] hover:border-[var(--brand-border)]'" @click="category = 'event'">
                  <CalendarDays class="w-5 h-5 text-[var(--brand-teal)]" />
                  <span><span class="block text-[13.5px] font-semibold text-[var(--brand-text)]">Event</span><span class="block text-[11.5px] text-[var(--brand-text-quiet)]">Capture candidates at a hiring event</span></span>
                </button>
              </div>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label :class="labelCls">Title <span class="text-[var(--brand-danger)]">*</span></label>
                <Input v-model="name" placeholder="e.g. Sales Manager" :class="[fieldCls, nameErr ? 'border-[var(--brand-danger)]' : 'border-[var(--brand-border)]']" />
                <p v-if="nameErr" class="mt-1 text-[12px] text-[var(--brand-danger)]">This field is required.</p>
              </div>
              <div v-if="category === 'department'">
                <label :class="labelCls">Department <span class="text-[var(--brand-danger)]">*</span></label>
                <select v-model="department" :class="[fieldCls, deptErr ? 'border-[var(--brand-danger)]' : 'border-[var(--brand-border)]']"><option value="">Select</option><option v-for="d in departments" :key="d" :value="d">{{ d }}</option></select>
                <p v-if="deptErr" class="mt-1 text-[12px] text-[var(--brand-danger)]">This field is required.</p>
              </div>
              <div v-else-if="category === 'event'">
                <label :class="labelCls">Event Name <span class="text-[var(--brand-danger)]">*</span></label>
                <Input v-model="eventName" placeholder="e.g. Cairo Career Fair 2026" :class="[fieldCls, eventErr ? 'border-[var(--brand-danger)]' : 'border-[var(--brand-border)]']" />
                <p v-if="eventErr" class="mt-1 text-[12px] text-[var(--brand-danger)]">Event Name is required.</p>
              </div>
            </div>

            <p v-if="!isEdit && category === 'event'" class="mt-3 text-[12.5px] text-[var(--brand-text-quiet)] inline-flex items-center gap-1.5"><CalendarDays class="w-3.5 h-3.5" /> After creating, you can build & publish a shareable application form for this event pool.</p>
          </section>

          <!-- Description -->
          <section :class="cardCls">
            <label :class="labelCls">Description</label>
            <div class="rounded-lg border border-[var(--brand-border)] overflow-hidden focus-within:border-[var(--brand-teal)] transition-colors">
              <textarea v-model="description" rows="4" placeholder="Add a description…" class="w-full resize-none bg-transparent outline-none text-[14px] leading-[1.55] text-[var(--brand-text)] placeholder:text-[var(--brand-text-quiet)] px-3.5 pt-3 pb-2" />
              <div class="flex items-center justify-between px-2 py-1.5 border-t border-[var(--brand-border-fade)]">
                <div class="flex items-center gap-0.5">
                  <button v-for="btn in [{ i: Bold, l: 'Bold' }, { i: Italic, l: 'Italic' }, { i: Underline, l: 'Underline' }, { i: Link2, l: 'Link' }, { i: Undo2, l: 'Undo' }, { i: Redo2, l: 'Redo' }]" :key="btn.l" type="button" class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition" :aria-label="btn.l" :title="btn.l"><component :is="btn.i" class="w-4 h-4" stroke-width="1.7" /></button>
                </div>
                <button type="button" class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition" aria-label="Emoji"><Smile class="w-4 h-4" stroke-width="1.7" /></button>
              </div>
            </div>
          </section>

          <!-- Team members -->
          <section :class="cardCls">
            <h2 class="text-[16px] font-bold text-[var(--brand-text)]">Team members</h2>
            <p class="text-[13px] text-[var(--brand-text-quiet)] mb-4">Assign team members to work on this talent pool.</p>

            <div class="space-y-2">
              <div v-for="m in assigned" :key="m.id" class="flex items-center gap-3 rounded-xl border border-[var(--brand-border-light)] px-3.5 py-2.5">
                <BrandAvatarInitials :initials="m.initials" size="sm" />
                <span class="flex-1 text-[13.5px] font-semibold text-[var(--brand-text)]">{{ m.name }}</span>
                <button v-if="assigned.length > 1" type="button" class="w-7 h-7 rounded-md grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-danger)] transition" aria-label="Remove member" @click="removeMember(m.id)"><X class="w-4 h-4" /></button>
              </div>
            </div>

            <Popover v-if="unassigned.length">
              <PopoverTrigger as-child>
                <button type="button" class="mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-dashed border-[var(--brand-border)] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)] transition"><Plus class="w-4 h-4" /> Add team member</button>
              </PopoverTrigger>
              <PopoverContent align="start" class="w-64 p-1.5">
                <button v-for="m in unassigned" :key="m.id" type="button" class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-[var(--brand-lime-tint-hover)]" @click="addMember(m.id)">
                  <BrandAvatarInitials :initials="m.initials" size="sm" />
                  <span class="flex-1 text-[13.5px] text-[var(--brand-text)]">{{ m.name }}</span>
                  <Plus class="w-4 h-4 text-[var(--brand-text-quiet)]" />
                </button>
              </PopoverContent>
            </Popover>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
