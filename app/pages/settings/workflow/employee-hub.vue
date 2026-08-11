<script setup lang="ts">
import { Plus, X, Mail, Briefcase, Wrench, GripVertical, User, Phone, Building2, Users, Calendar, MapPin, Clock, CreditCard, Type, AlignLeft, Check, CheckCheck, Hash, Video, Eye, ChevronDown, Pencil, Trash2 } from 'lucide-vue-next'
import { Switch } from '~/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsToggleCard from '~/components/settings/SettingsToggleCard.vue'
import { BrandButton } from '~/components/brand'

definePageMeta({ layout: 'settings' })

const activeTab = ref<'domains' | 'forms'>('domains')

// ─────────────── Tab 1 · Company email domains ───────────────
// Shared with the public /careers "For Employees" verification (useEmployeeHub())
// so a domain added here immediately unlocks internal access on the career site.
const { state: hub, addDomain: addHubDomain, removeDomain } = useEmployeeHub()
const { enabled, domainSelfServe, domains } = toRefs(hub)
const newDomain = ref('')
const domainError = ref('')

function addDomain() {
  const { ok, error } = addHubDomain(newDomain.value)
  domainError.value = error
  if (ok) newDomain.value = ''
}

// ─────────────── Tab 2 · Customize form (white / blue collar) ───────────────
type Requirement = 'required' | 'optional'
interface FormField { id: string; label: string; icon: any; requirement: Requirement }
let fid = 0
const nfid = () => `f${++fid}`
const mkField = (label: string, icon: any, requirement: Requirement = 'required'): FormField => ({ id: nfid(), label, icon, requirement })

const collar = ref<'white' | 'blue'>('white')
const forms = ref<Record<'white' | 'blue', FormField[]>>({
  white: [
    mkField('Full name', User), mkField('Work email', Mail), mkField('Phone number', Phone, 'optional'),
    mkField('Department', Building2), mkField('Job title', Briefcase), mkField('Manager', Users, 'optional'), mkField('Start date', Calendar),
  ],
  blue: [
    mkField('Full name', User), mkField('Phone number', Phone), mkField('National ID', CreditCard),
    mkField('Location', MapPin), mkField('Shift preference', Clock, 'optional'), mkField('Start date', Calendar),
  ],
})
const currentFields = computed(() => forms.value[collar.value])
function addField() { forms.value[collar.value] = [...forms.value[collar.value], mkField('', User)] }
function removeField(id: string) { forms.value[collar.value] = forms.value[collar.value].filter(f => f.id !== id) }

// ─────────────── Tab 2 · Custom questions (per collar) ───────────────
type QType = 'text-single' | 'text-multi' | 'yesno' | 'single-choice' | 'multi-choice' | 'date' | 'number'
const QUESTION_TYPES: { key: QType; label: string; icon: any }[] = [
  { key: 'text-single', label: 'Text (single line)', icon: Type },
  { key: 'text-multi', label: 'Text (multiple lines)', icon: AlignLeft },
  { key: 'yesno', label: 'Yes / No', icon: Check },
  { key: 'single-choice', label: 'Single choice', icon: Check },
  { key: 'multi-choice', label: 'Multiple choice', icon: CheckCheck },
  { key: 'date', label: 'Date', icon: Calendar },
  { key: 'number', label: 'Number', icon: Hash },
]
interface Question { id: string; type: QType; text: string; requirement: 'required' | 'optional'; visibility: 'everyone' | 'me' }
let qid = 0
const nqid = () => `q${++qid}`
const mkQ = (type: QType, text: string): Question => ({ id: nqid(), type, text, requirement: 'optional', visibility: 'everyone' })
const questions = ref<Record<'white' | 'blue', Question[]>>({
  white: [mkQ('text-single', 'What certifications do you hold relevant to this role?'), mkQ('date', 'What is your earliest available start date?')],
  blue: [mkQ('yesno', 'Do you have a valid driving licence?'), mkQ('text-single', 'Which shifts can you work?')],
})
const currentQuestions = computed(() => questions.value[collar.value])
function removeQuestion(id: string) { questions.value[collar.value] = questions.value[collar.value].filter(q => q.id !== id) }
const qTypeMeta = (t: QType) => QUESTION_TYPES.find(x => x.key === t) ?? QUESTION_TYPES[0]!

// Inline editor (Add new / edit)
const qEditorOpen = ref(false)
const qDraft = reactive<{ id: string | null; type: QType; text: string; requirement: 'required' | 'optional'; visibility: 'everyone' | 'me' }>({
  id: null, type: 'text-single', text: '', requirement: 'optional', visibility: 'everyone',
})
const qTypeOpen = ref(false)
const qReqOpen = ref(false)
const qVisOpen = ref(false)
const canSaveQ = computed(() => qDraft.text.trim().length > 0)
function openQEditor(q?: Question) {
  qDraft.id = q?.id ?? null
  qDraft.type = q?.type ?? 'text-single'
  qDraft.text = q?.text ?? ''
  qDraft.requirement = q?.requirement ?? 'optional'
  qDraft.visibility = q?.visibility ?? 'everyone'
  qEditorOpen.value = true
}
function saveQ(addAnother = false) {
  if (!canSaveQ.value) return
  const list = questions.value[collar.value]
  if (qDraft.id) {
    const q = list.find(x => x.id === qDraft.id)
    if (q) { q.type = qDraft.type; q.text = qDraft.text.trim(); q.requirement = qDraft.requirement; q.visibility = qDraft.visibility }
  } else {
    list.push({ id: nqid(), type: qDraft.type, text: qDraft.text.trim(), requirement: qDraft.requirement, visibility: qDraft.visibility })
  }
  if (addAnother) { qDraft.id = null; qDraft.text = '' } else { qEditorOpen.value = false }
}
</script>

<template>
  <div class="relative">
    <SettingsPageHeader
      title="Employee hub"
      subtitle="Let employees open the app through your company via a verified email domain, and tailor the registration form for each workforce type."
      learn-more-href="#"
      learn-more-label="How the Employee hub works"
      no-divider
      class="relative z-20"
    >
      <template #title-suffix>
        <Switch v-model="enabled" class="data-[state=checked]:bg-[var(--brand-teal)]" />
      </template>
    </SettingsPageHeader>

    <!-- Tabs -->
    <div class="flex gap-0 border-b border-[var(--brand-border-light)] mt-4 mb-6 relative z-20">
      <button
        v-for="tab in [
          { key: 'domains', label: 'Company email domain' },
          { key: 'forms', label: 'Customize form' },
        ]"
        :key="tab.key"
        type="button"
        class="px-4 py-2.5 text-[14px] outline-none border-b-2 -mb-px transition-colors"
        :class="activeTab === tab.key
          ? 'font-semibold text-[var(--brand-text)] border-[var(--brand-text)]'
          : 'font-normal text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'"
        @click="activeTab = tab.key as any"
      >
        {{ tab.label }}
      </button>
    </div>

    <div :class="{ 'opacity-40 pointer-events-none select-none': !enabled }">
      <!-- ─── Tab 1 · Company email domain ─── -->
      <div v-if="activeTab === 'domains'">
        <SettingsToggleCard
          v-model="domainSelfServe"
          title="Open through company email domain"
          description="Anyone who signs up with an email at one of these domains is recognized as an employee and can open the app through your company."
        >
          <template #body>
            <!-- Add domain -->
            <div class="flex items-stretch gap-2">
              <div class="flex-1 flex items-center rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-[var(--brand-surface-white)] overflow-hidden focus-within:border-[var(--brand-teal)] transition-colors">
                <span class="pl-3.5 pr-1.5 text-[14px] text-[var(--brand-text-quiet)]">@</span>
                <input
                  v-model="newDomain"
                  type="text"
                  placeholder="company.com"
                  class="flex-1 h-11 pr-3.5 text-[14px] bg-transparent outline-none text-[var(--brand-text)]"
                  @keydown.enter.prevent="addDomain"
                >
              </div>
              <BrandButton variant="primary-teal" :disabled="!newDomain.trim()" @click="addDomain">
                <Plus class="w-3.5 h-3.5 mr-1" stroke-width="2.4" />Add domain
              </BrandButton>
            </div>
            <p v-if="domainError" class="text-[12.5px] text-[var(--brand-settings-danger)] mt-1.5">{{ domainError }}</p>

            <!-- Domain list -->
            <div v-if="domains.length" class="mt-3.5 border border-[var(--brand-border-light)] rounded-[12px] overflow-hidden">
              <div
                v-for="(d, i) in domains"
                :key="d"
                class="flex items-center gap-3 px-4 py-3 border-b border-[var(--brand-border-light)] last:border-0"
                :class="i % 2 === 1 ? 'bg-[var(--brand-surface-table-alt)]' : 'bg-[var(--brand-surface-white)]'"
              >
                <Mail class="w-4 h-4 text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.7" />
                <span class="flex-1 text-[13.5px] font-medium text-[var(--brand-text)]">@{{ d }}</span>
                <span class="inline-flex items-center h-[20px] px-2 rounded-full text-[11px] font-bold text-[var(--brand-status-approved-text)] bg-[var(--brand-status-approved-bg)]">Verified</span>
                <button
                  type="button"
                  class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:text-[var(--brand-settings-danger)] hover:bg-[var(--brand-surface-white)] transition"
                  :aria-label="`Remove ${d}`"
                  @click="removeDomain(d)"
                >
                  <X class="w-3.5 h-3.5" stroke-width="2" />
                </button>
              </div>
            </div>
            <div v-else class="mt-3.5 text-[13px] text-[var(--brand-text-quiet)] italic">No domains yet — add one above.</div>
          </template>
        </SettingsToggleCard>
      </div>

      <!-- ─── Tab 2 · Customize form ─── -->
      <div v-else>
        <div class="text-[15px] font-bold text-[var(--brand-text)] mb-1">Registration form</div>
        <p class="text-[13.5px] text-[var(--brand-text-quiet)] mb-4">Choose which fields employees fill in — tailored per workforce type.</p>

        <!-- Collar selector -->
        <div class="inline-flex bg-[var(--brand-canvas)] rounded-[10px] p-1 gap-1 mb-4">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 h-9 rounded-md text-[13px] font-semibold transition"
            :class="collar === 'white' ? 'bg-white text-[var(--brand-text)] shadow-[0_1px_2px_rgba(0,20,18,0.06)]' : 'text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'"
            @click="collar = 'white'"
          >
            <Briefcase class="w-4 h-4" stroke-width="1.8" />White collar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 h-9 rounded-md text-[13px] font-semibold transition"
            :class="collar === 'blue' ? 'bg-white text-[var(--brand-text)] shadow-[0_1px_2px_rgba(0,20,18,0.06)]' : 'text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'"
            @click="collar = 'blue'"
          >
            <Wrench class="w-4 h-4" stroke-width="1.8" />Blue collar
          </button>
        </div>

        <!-- Fields for the selected collar — individual cards + Required/Optional/Remove -->
        <div class="flex flex-col gap-2.5">
          <div
            v-for="f in currentFields"
            :key="f.id"
            class="flex items-center gap-3.5 rounded-[10px] border border-[var(--brand-border-fade)] bg-white px-4 py-3 hover:border-[var(--brand-border)] transition"
          >
            <GripVertical class="w-3.5 h-3.5 text-[var(--brand-border)] shrink-0 cursor-grab" stroke-width="2" />
            <component :is="f.icon" class="w-4 h-4 text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.7" />
            <input
              v-model="f.label"
              placeholder="Field name…"
              class="flex-1 min-w-0 text-[14px] font-semibold text-[var(--brand-text)] bg-transparent outline-none placeholder:font-normal placeholder:text-[var(--brand-text-quiet)]"
            >
            <div class="inline-flex items-center gap-2 shrink-0">
              <button type="button" class="px-4 h-9 rounded-full text-[13px] font-bold transition" :class="f.requirement === 'required' ? 'bg-[var(--brand-text)] text-white' : 'bg-white text-[var(--brand-text-secondary)] border-[1.5px] border-[var(--brand-border-fade)] hover:bg-[var(--brand-canvas)]'" @click="f.requirement = 'required'">Required</button>
              <button type="button" class="px-4 h-9 rounded-full text-[13px] font-bold transition" :class="f.requirement === 'optional' ? 'bg-[var(--brand-text)] text-white' : 'bg-white text-[var(--brand-text-secondary)] border-[1.5px] border-[var(--brand-border-fade)] hover:bg-[var(--brand-canvas)]'" @click="f.requirement = 'optional'">Optional</button>
              <button type="button" class="px-4 h-9 rounded-full text-[13px] font-bold text-[var(--brand-text-secondary)] border-[1.5px] border-[var(--brand-border-fade)] hover:bg-[var(--brand-status-closed-bg)] hover:text-[var(--brand-status-closed-text)] hover:border-[var(--brand-status-closed-bg)] transition" @click="removeField(f.id)">Remove</button>
            </div>
          </div>

          <button
            type="button"
            class="w-full inline-flex items-center justify-center gap-2 h-12 rounded-[10px] border-[1.5px] border-dashed border-[var(--brand-border)] text-[13.5px] font-bold text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)] hover:border-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)] transition"
            @click="addField"
          >
            <Plus class="w-3.5 h-3.5" stroke-width="2.2" />Add new field
          </button>
        </div>

        <!-- ─── Custom questions (Screening-questions experience) ─── -->
        <div class="mt-8">
          <div class="mb-4">
            <h3 class="text-[15px] font-bold text-[var(--brand-text)]">Custom questions</h3>
            <p class="text-[13px] text-[var(--brand-text-quiet)] mt-0.5">Extra questions {{ collar === 'white' ? 'white-collar' : 'blue-collar' }} employees answer during registration.</p>
          </div>

          <div class="flex flex-col gap-2.5">
            <div
              v-for="q in currentQuestions"
              :key="q.id"
              class="flex items-start gap-3.5 rounded-[10px] border border-[var(--brand-border-fade)] bg-white px-4 py-3 hover:border-[var(--brand-border)] transition"
            >
              <GripVertical class="w-3.5 h-3.5 text-[var(--brand-border)] shrink-0 cursor-grab mt-0.5" stroke-width="2" />
              <component :is="qTypeMeta(q.type).icon" class="w-4 h-4 text-[var(--brand-text-quiet)] shrink-0 mt-0.5" stroke-width="1.7" />
              <span class="flex-1 min-w-0 text-[14px] font-semibold text-[var(--brand-text)]">{{ q.text }}</span>
              <span class="text-[12px] text-[var(--brand-text-quiet)] whitespace-nowrap self-center">{{ q.visibility === 'me' ? 'Only me' : 'Everyone' }}</span>
              <div class="flex items-center gap-1 shrink-0 self-center">
                <button type="button" class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition" aria-label="Edit question" @click="openQEditor(q)"><Pencil class="w-3.5 h-3.5" stroke-width="1.8" /></button>
                <button type="button" class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:text-[var(--brand-status-closed-text)] hover:bg-[var(--brand-status-closed-bg)] transition" aria-label="Delete question" @click="removeQuestion(q.id)"><Trash2 class="w-3.5 h-3.5" stroke-width="1.8" /></button>
              </div>
            </div>

            <!-- Inline question editor -->
            <div v-if="qEditorOpen" class="rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white overflow-hidden">
              <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--brand-border-fade)] bg-[var(--brand-canvas)]">
                <Popover v-model:open="qTypeOpen">
                  <PopoverTrigger as-child>
                    <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] border-[1.5px] border-[var(--brand-border-fade)] bg-white text-[13px] font-bold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition">
                      <component :is="qTypeMeta(qDraft.type).icon" class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
                      {{ qTypeMeta(qDraft.type).label }}
                      <ChevronDown class="w-3 h-3 text-[var(--brand-text-quiet)]" stroke-width="2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" :side-offset="6" class="w-[240px] p-1 max-h-[300px] overflow-y-auto rounded-[12px] border border-[var(--brand-border-light)] shadow-[0_12px_34px_rgba(0,20,18,0.16)]">
                    <button v-for="t in QUESTION_TYPES" :key="t.key" type="button" class="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-[13.5px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition" @click="qDraft.type = t.key; qTypeOpen = false">
                      <component :is="t.icon" class="w-4 h-4 text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.7" />{{ t.label }}
                    </button>
                  </PopoverContent>
                </Popover>
                <div class="flex items-center gap-2">
                  <Popover v-model:open="qReqOpen">
                    <PopoverTrigger as-child>
                      <button type="button" class="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] border-[1.5px] border-[var(--brand-border-fade)] bg-white text-[13px] font-bold text-[var(--brand-text)] capitalize hover:bg-[var(--brand-canvas)] transition">
                        {{ qDraft.requirement }}<ChevronDown class="w-3 h-3 text-[var(--brand-text-quiet)]" stroke-width="2" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" :side-offset="6" class="w-[150px] p-1 rounded-[12px] border border-[var(--brand-border-light)] shadow-[0_12px_34px_rgba(0,20,18,0.16)]">
                      <button type="button" class="w-full text-left px-3 h-9 rounded-md text-[13.5px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)]" @click="qDraft.requirement = 'optional'; qReqOpen = false">Optional</button>
                      <button type="button" class="w-full text-left px-3 h-9 rounded-md text-[13.5px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)]" @click="qDraft.requirement = 'required'; qReqOpen = false">Required</button>
                    </PopoverContent>
                  </Popover>
                  <button type="button" class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-white transition" aria-label="Close" @click="qEditorOpen = false"><X class="w-4 h-4" stroke-width="2" /></button>
                </div>
              </div>

              <div class="px-5 py-4">
                <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Question <span class="text-[var(--brand-settings-danger)]">*</span></label>
                <input v-model="qDraft.text" placeholder="Type your question…" class="w-full h-11 px-3.5 text-[14px] rounded-[9px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none transition">
                <div class="mt-3">
                  <Popover v-model:open="qVisOpen">
                    <PopoverTrigger as-child>
                      <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[var(--brand-canvas)] text-[13px] font-bold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)] transition">
                        <Eye class="w-3.5 h-3.5" stroke-width="1.8" />
                        {{ qDraft.visibility === 'me' ? 'Only me' : 'Visible to everyone' }}
                        <ChevronDown class="w-3 h-3 text-[var(--brand-text-quiet)]" stroke-width="2" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" :side-offset="6" class="w-[200px] p-1 rounded-[12px] border border-[var(--brand-border-light)] shadow-[0_12px_34px_rgba(0,20,18,0.16)]">
                      <button type="button" class="w-full text-left px-3 h-9 rounded-md text-[13.5px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)]" @click="qDraft.visibility = 'everyone'; qVisOpen = false">Visible to everyone</button>
                      <button type="button" class="w-full text-left px-3 h-9 rounded-md text-[13.5px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)]" @click="qDraft.visibility = 'me'; qVisOpen = false">Only me</button>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--brand-border-fade)] bg-[var(--brand-canvas)]">
                <button type="button" class="px-4 h-9 rounded-[9px] text-[13px] font-bold text-[var(--brand-text-secondary)] hover:bg-white transition" @click="qEditorOpen = false">Cancel</button>
                <button type="button" class="px-4 h-9 rounded-[9px] text-[13px] font-bold text-[var(--brand-text)] hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition" :disabled="!canSaveQ" @click="saveQ(true)">Save and add another</button>
                <button type="button" class="px-5 h-9 rounded-[9px] text-[13px] font-bold bg-[var(--brand-teal)] text-white disabled:opacity-40 disabled:pointer-events-none transition" :disabled="!canSaveQ" @click="saveQ(false)">Save</button>
              </div>
            </div>

            <button
              v-else
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 h-12 rounded-[10px] border-[1.5px] border-dashed border-[var(--brand-border)] text-[13.5px] font-bold text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)] hover:border-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)] transition"
              @click="openQEditor()"
            >
              <Plus class="w-3.5 h-3.5" stroke-width="2.2" />Add new
            </button>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <BrandButton variant="primary-teal">Save form</BrandButton>
        </div>
      </div>
    </div>
  </div>
</template>
