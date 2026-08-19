<!-- "New requisition" — title + manpower project + department, then Save creates
     a draft and opens its detail page (matches the Recruitera flow). -->
<script setup lang="ts">
import { BrandButton } from '~/components/brand'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import type { NewRequisitionInput } from '~/types'

const props = defineProps<{ open: boolean, projects: string[], submitting?: boolean }>()
const emit = defineEmits<{ 'update:open': [v: boolean]; create: [payload: NewRequisitionInput] }>()

const title = ref('')
const manpowerProject = ref('')
const department = ref('')
watch(() => props.open, (o) => { if (o) { title.value = ''; manpowerProject.value = ''; department.value = '' } })

const canSave = computed(() => title.value.trim() && manpowerProject.value && department.value.trim())
function save() {
  if (canSave.value) emit('create', { title: title.value.trim(), manpowerProject: manpowerProject.value, department: department.value.trim() })
}

const fieldCls = 'w-full h-11 rounded-[10px] border border-[var(--brand-border)] bg-white px-3.5 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-teal)] transition-colors'
const labelCls = 'block text-[13.5px] font-semibold text-[var(--brand-text)] mb-1.5'
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle class="text-[20px]">New requisition</DialogTitle>
        <DialogDescription>Enter the requisition title and the department.</DialogDescription>
      </DialogHeader>

      <div class="py-1 space-y-4">
        <div>
          <label :class="labelCls">Job Title <span class="text-[var(--brand-danger)]">*</span></label>
          <input v-model="title" :class="fieldCls" placeholder="ex. Senior Software Engineer" @keydown.enter="save">
        </div>
        <div>
          <label :class="labelCls">Manpower Project <span class="text-[var(--brand-danger)]">*</span></label>
          <select v-model="manpowerProject" :class="fieldCls" :style="!manpowerProject ? 'color: var(--brand-text-quiet)' : ''">
            <option value="" disabled>Pick Project</option>
            <option v-for="p in projects" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div v-if="manpowerProject">
          <label :class="labelCls">Department <span class="text-[var(--brand-danger)]">*</span></label>
          <input v-model="department" :class="fieldCls" placeholder="ex. Engineering" @keydown.enter="save">
        </div>
      </div>

      <DialogFooter>
        <BrandButton variant="outline" @click="emit('update:open', false)">Cancel</BrandButton>
        <BrandButton variant="primary-teal" :disabled="!canSave || submitting" @click="save">Save</BrandButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
