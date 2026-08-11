<!--
  Create / edit a talent pool. Category drives which of the two conditional fields
  shows: Department picks from the departments list, Event takes free text.
  Validation matches the prototype — inline errors, revealed only after a save attempt.
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Building2, Check, ChevronDown, Ticket } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { BrandAvatarInitials, BrandButton } from '~/components/brand'
import SettingsFormModal from '~/components/settings/SettingsFormModal.vue'
import { useDepartments } from '~/composables/useDepartments'
import { useTeamMembers } from '~/composables/useTeam'
import type { TalentPool, TalentPoolCategory } from '~/types'

const props = defineProps<{
  modelValue: boolean
  /** null = create, otherwise edit that pool. */
  pool: TalentPool | null
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'save': [payload: Pick<TalentPool, 'name' | 'description' | 'category' | 'department' | 'event' | 'members'>]
}>()

const { data: departmentsData } = useDepartments()
const { data: teamData } = useTeamMembers()

const departments = computed(() => departmentsData.value?.data ?? [])
const team = computed(() => teamData.value?.data ?? [])

const form = reactive({
  name: '',
  category: null as TalentPoolCategory | null,
  department: '',
  event: '',
  description: '',
  members: [] as string[],
})

const submitted = ref(false)
const memberQuery = ref('')
const membersOpen = ref(false)

const isEdit = computed(() => props.pool !== null)

watch(() => props.modelValue, (open) => {
  if (!open) return
  submitted.value = false
  memberQuery.value = ''
  const p = props.pool
  form.name = p?.name ?? ''
  form.category = p?.category ?? null
  form.department = p?.department ?? ''
  form.event = p?.event ?? ''
  form.description = p?.description ?? ''
  form.members = [...(p?.members ?? [])]
}, { immediate: true })

// Picking a category clears the field belonging to the other one.
function pickCategory(c: TalentPoolCategory) {
  form.category = c
  if (c === 'department') form.event = ''
  else form.department = ''
}

const errors = computed(() => ({
  name: !form.name.trim(),
  category: form.category === null,
  department: form.category === 'department' && !form.department,
  event: form.category === 'event' && !form.event.trim(),
  members: form.members.length === 0,
}))

const isValid = computed(() => !Object.values(errors.value).some(Boolean))

const selectedMembers = computed(() => team.value.filter(m => form.members.includes(m.id)))

const filteredTeam = computed(() => {
  const q = memberQuery.value.trim().toLowerCase()
  if (!q) return team.value
  return team.value.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
})

function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function toggleMember(id: string) {
  form.members = form.members.includes(id)
    ? form.members.filter(m => m !== id)
    : [...form.members, id]
}

function save() {
  submitted.value = true
  if (!isValid.value) return
  emit('save', {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category as TalentPoolCategory,
    department: form.category === 'department' ? form.department : undefined,
    event: form.category === 'event' ? form.event.trim() : undefined,
    members: [...form.members],
  })
}

// Mirrors the prototype's .s-input: 14px text, 1.5px border, 11px radius.
const FIELD_CLASS = 'w-full rounded-[11px] border-[1.5px] border-[var(--brand-border)] bg-[var(--brand-surface-white)] px-[13px] py-2.5 text-[14px] text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-quiet)] focus:border-[var(--brand-teal)]'
</script>

<template>
  <SettingsFormModal
    :model-value="modelValue"
    :title="isEdit ? 'Edit Talent Pool' : 'Create Talent Pool'"
    scrollable
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <p class="text-[13px] text-[var(--brand-text-quiet)] -mt-4 mb-5">
      Organize candidates by department or capture them at an event.
    </p>

    <!-- Name -->
    <div class="mb-4">
      <label for="pool-name" class="block text-[13.5px] font-bold text-[var(--brand-text)] mb-2">
        Talent Pool Name <span class="text-[var(--brand-settings-danger)]">*</span>
      </label>
      <input id="pool-name" v-model="form.name" type="text" placeholder="e.g. Frontend Talent" :class="FIELD_CLASS">
      <p v-if="submitted && errors.name" class="mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
        This field is required.
      </p>
    </div>

    <!-- Category -->
    <div class="mb-4">
      <span class="block text-[13.5px] font-bold text-[var(--brand-text)] mb-2">
        Category <span class="text-[var(--brand-settings-danger)]">*</span>
      </span>
      <!-- Both options split the dialog width, as in the prototype — not two small
           chips floated to the left. -->
      <div class="flex gap-2.5">
        <button
          v-for="opt in ([
            { value: 'department', label: 'Department', icon: Building2 },
            { value: 'event', label: 'Event', icon: Ticket },
          ] as const)"
          :key="opt.value"
          type="button"
          class="flex-1 inline-flex items-center justify-center gap-[7px] rounded-[11px] border-[1.5px] px-3.5 py-[11px] text-[13.5px] font-bold transition-colors"
          :class="form.category === opt.value
            ? 'border-[var(--brand-lime)]/55 bg-[var(--brand-lime-active-bg)] text-[var(--brand-olive)]'
            : 'border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] text-[var(--brand-text-muted)] hover:bg-[var(--brand-lime-tint-hover)]'"
          @click="pickCategory(opt.value)"
        >
          <component :is="opt.icon" class="w-[15px] h-[15px]" :stroke-width="1.8" />
          {{ opt.label }}
        </button>
      </div>
      <p v-if="submitted && errors.category" class="mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
        Please select a category.
      </p>
    </div>

    <!-- Department (conditional) -->
    <div v-if="form.category === 'department'" class="mb-4">
      <span class="block text-[13.5px] font-bold text-[var(--brand-text)] mb-2">
        Department <span class="text-[var(--brand-settings-danger)]">*</span>
      </span>
      <Select v-model="form.department">
        <SelectTrigger class="w-full h-auto rounded-[11px] border-[1.5px] border-[var(--brand-border)] px-[13px] py-2.5 text-[14px]">
          <SelectValue placeholder="Select a department…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="d in departments" :key="d.id" :value="d.name">{{ d.name }}</SelectItem>
        </SelectContent>
      </Select>
      <p v-if="submitted && errors.department" class="mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
        Department is required.
      </p>
    </div>

    <!-- Event (conditional) -->
    <div v-if="form.category === 'event'" class="mb-4">
      <label for="pool-event" class="block text-[13.5px] font-bold text-[var(--brand-text)] mb-2">
        Event Name <span class="text-[var(--brand-settings-danger)]">*</span>
      </label>
      <input id="pool-event" v-model="form.event" type="text" placeholder="e.g. Cairo Tech Fair 2026" :class="FIELD_CLASS">
      <p v-if="submitted && errors.event" class="mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
        Event Name is required.
      </p>
    </div>

    <!-- Description -->
    <div class="mb-4">
      <label for="pool-desc" class="block text-[13.5px] font-bold text-[var(--brand-text)] mb-2">
        Description <span class="font-medium text-[13px] text-[var(--brand-text-quiet)]">(optional)</span>
      </label>
      <textarea id="pool-desc" v-model="form.description" rows="3" placeholder="What is this pool for?" :class="[FIELD_CLASS, 'resize-y']" />
    </div>

    <!-- Assigned team members -->
    <div>
      <span class="block text-[13.5px] font-bold text-[var(--brand-text)] mb-2">
        Assigned Team Members <span class="text-[var(--brand-settings-danger)]">*</span>
      </span>
      <Popover v-model:open="membersOpen">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="w-full min-h-[46px] flex items-center gap-2 rounded-[11px] border-[1.5px] border-[var(--brand-border)] bg-[var(--brand-surface-white)] px-3 py-[7px] text-left outline-none focus:border-[var(--brand-teal)]"
          >
            <span v-if="selectedMembers.length" class="flex flex-wrap gap-1.5 flex-1">
              <span
                v-for="m in selectedMembers"
                :key="m.id"
                class="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-lime-tint)] py-0.5 pl-0.5 pr-2 text-[12.5px] font-semibold text-[var(--brand-text)]"
              >
                <BrandAvatarInitials :initials="initialsOf(m.name)" size="xs" :bg="m.avatarBg" :color="m.avatarText" />
                {{ m.name }}
              </span>
            </span>
            <span v-else class="flex-1 text-[13.5px] text-[var(--brand-text-quiet)]">Search team members…</span>
            <ChevronDown class="w-[15px] h-[15px] shrink-0 text-[var(--brand-text-quiet)]" />
          </button>
        </PopoverTrigger>
        <PopoverContent class="p-0 w-[var(--reka-popover-trigger-width)]" align="start">
          <Command v-model:search-term="memberQuery">
            <CommandInput placeholder="Search team members…" />
            <CommandList>
              <CommandEmpty>No team members found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  v-for="m in filteredTeam"
                  :key="m.id"
                  :value="m.id"
                  class="gap-2.5"
                  @select="toggleMember(m.id)"
                >
                  <BrandAvatarInitials :initials="initialsOf(m.name)" size="sm" :bg="m.avatarBg" :color="m.avatarText" />
                  <span class="flex-1 min-w-0">
                    <span class="block text-[13px] font-semibold text-[var(--brand-text)] truncate">{{ m.name }}</span>
                    <span class="block text-[11.5px] text-[var(--brand-text-quiet)] truncate">{{ m.email }}</span>
                  </span>
                  <Check v-if="form.members.includes(m.id)" class="w-4 h-4 shrink-0 text-[var(--brand-teal)]" />
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p v-if="submitted && errors.members" class="mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
        Please assign at least one team member.
      </p>
    </div>

    <template #footer>
      <BrandButton variant="outline" size="md" @click="emit('update:modelValue', false)">Cancel</BrandButton>
      <BrandButton variant="primary-teal" size="md" @click="save">
        {{ isEdit ? 'Save Changes' : 'Create Talent Pool' }}
      </BrandButton>
    </template>
  </SettingsFormModal>
</template>
