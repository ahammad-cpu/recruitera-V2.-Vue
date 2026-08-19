<script setup lang="ts">
import { Plus, ChevronRight, ChevronDown, MoreHorizontal, Pencil, Upload, Download, Trash2, Building2, CalendarDays, Users } from 'lucide-vue-next'
import { BrandButton, BrandPageTitle, BrandAvatarInitials, BrandEmptyState } from '~/components/brand'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import ManpowerGrid from '~/components/manpower/ManpowerGrid.vue'
import { useManpowerProjects, useManpowerMutations } from '~/composables/useManpower'

definePageMeta({ layout: 'default' })

const { data, isFetching } = useManpowerProjects()
const summary = computed(() => data.value?.summary)
const projects = computed(() => data.value?.projects ?? [])
const { remove } = useManpowerMutations()

const tab = ref('all')
const activeProject = computed(() => projects.value.find(p => p.id === tab.value) ?? null)
const expanded = reactive<Record<string, boolean>>({})
function toggle(id: string) { expanded[id] = !expanded[id] }
const newOpen = ref(false)
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function target(p: { currentHeadcount: number, budgeted: number }) { return p.budgeted ? Math.min(100, Math.round((p.currentHeadcount / p.budgeted) * 100)) : 0 }

const metrics = computed(() => summary.value ? [
  { label: 'Company headcount budget', value: summary.value.companyBudget, icon: Building2 },
  { label: 'Current employees', value: summary.value.currentEmployees, icon: Users },
  { label: 'Need to hire', value: summary.value.needToHire, tone: 'pending' },
  { label: 'Hired', value: summary.value.hired, tone: 'approved' },
  { label: 'Target achieved', value: `${summary.value.targetAchieved}%`, tone: 'teal' },
] : [])
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
    <div class="px-6 pt-5 pb-3 flex items-center justify-between gap-4">
      <BrandPageTitle label="Manpower Planning" />
      <Popover v-model:open="newOpen">
        <PopoverTrigger as-child>
          <BrandButton variant="primary-teal" size="md" class="gap-2"><Plus class="w-4 h-4" /> New plan <ChevronDown class="w-3.5 h-3.5" /></BrandButton>
        </PopoverTrigger>
        <PopoverContent align="end" class="w-[280px] p-1.5 rounded-xl">
          <button type="button" class="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-[var(--brand-canvas)] transition" @click="newOpen = false; navigateTo('/manpower/new?kind=headcount')">
            <Building2 class="w-4.5 h-4.5 text-[var(--brand-teal)] mt-0.5" />
            <span><span class="block text-[13.5px] font-semibold text-[var(--brand-text)]">Headcount Budget</span><span class="block text-[12px] text-[var(--brand-text-quiet)]">Annual company headcount plan</span></span>
          </button>
          <button type="button" class="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-[var(--brand-canvas)] transition" @click="newOpen = false; navigateTo('/manpower/new?kind=project')">
            <CalendarDays class="w-4.5 h-4.5 text-[var(--brand-teal)] mt-0.5" />
            <span><span class="block text-[13.5px] font-semibold text-[var(--brand-text)]">Project Budget</span><span class="block text-[12px] text-[var(--brand-text-quiet)]">Time-boxed initiative or expansion</span></span>
          </button>
        </PopoverContent>
      </Popover>
    </div>

    <!-- Summary strip -->
    <div class="px-6 pb-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <div v-for="m in metrics" :key="m.label" class="rounded-[12px] border border-[var(--brand-border-light)] bg-white px-4 py-3">
        <div class="text-[12px] text-[var(--brand-text-quiet)] truncate">{{ m.label }}</div>
        <div class="text-[24px] font-bold tabular-nums mt-0.5" :class="m.tone === 'pending' ? 'text-[var(--brand-status-pending-text)]' : m.tone === 'approved' ? 'text-[var(--brand-status-approved-text)]' : m.tone === 'teal' ? 'text-[var(--brand-teal)]' : 'text-[var(--brand-text)]'">{{ m.value }}</div>
      </div>
    </div>

    <!-- Sub-tabs -->
    <div class="px-6 flex items-center gap-5 border-b border-[var(--brand-border-light)] overflow-x-auto">
      <button type="button" class="pb-2.5 -mb-px text-[14px] font-semibold border-b-2 whitespace-nowrap transition-colors" :class="tab === 'all' ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="tab = 'all'">All projects</button>
      <button v-for="p in projects" :key="p.id" type="button" class="pb-2.5 -mb-px text-[14px] font-semibold border-b-2 whitespace-nowrap transition-colors" :class="tab === p.id ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="tab = p.id">{{ p.name }}</button>
    </div>

    <div class="flex-1 overflow-auto px-6 py-4">
      <!-- All projects table -->
      <div v-if="tab === 'all'">
        <div v-if="isFetching && !projects.length" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-16 rounded-[12px] border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] animate-pulse" />
        </div>
        <BrandEmptyState v-else-if="!projects.length" :icon="Building2" title="No manpower projects yet" description="Create a new plan to get started.">
          <BrandButton variant="primary-teal" size="md" class="gap-2" @click="navigateTo('/manpower/new?kind=headcount')"><Plus class="w-4 h-4" /> New plan</BrandButton>
        </BrandEmptyState>

        <div v-else class="rounded-[14px] border border-[var(--brand-border-light)] overflow-hidden">
          <div class="overflow-x-auto">
            <div class="min-w-[900px]">
              <!-- header -->
              <div class="grid gap-2 px-4 py-2.5 bg-[var(--brand-surface-listview)] border-b border-[var(--brand-border-light)] text-[12px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]" style="grid-template-columns:1fr 160px 120px 100px 100px 100px 170px 44px">
                <div>Title</div><div>Assigned to</div><div>Created</div><div class="text-center">Current</div><div class="text-center">Budgeted</div><div class="text-center">Need</div><div>Target achieved</div><div />
              </div>
              <template v-for="p in projects" :key="p.id">
                <div class="grid gap-2 items-center px-4 py-3 border-b border-[var(--brand-border-fade)] hover:bg-[var(--brand-canvas)]/40 transition cursor-pointer" style="grid-template-columns:1fr 160px 120px 100px 100px 100px 170px 44px" @click="toggle(p.id)">
                  <div class="flex items-center gap-2 min-w-0">
                    <ChevronRight class="w-4 h-4 text-[var(--brand-text-quiet)] shrink-0 transition-transform" :class="expanded[p.id] ? 'rotate-90' : ''" />
                    <div class="min-w-0">
                      <div class="text-[13.5px] font-semibold text-[var(--brand-text)] truncate">{{ p.name }}</div>
                      <div class="text-[11.5px] text-[var(--brand-text-quiet)]">#{{ p.code }} · {{ p.kind === 'headcount' ? 'Headcount' : 'Project' }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 min-w-0"><BrandAvatarInitials :initials="p.assignedToInitials" size="sm" /><span class="text-[13px] text-[var(--brand-text-secondary)] truncate">{{ p.assignedToName }}</span></div>
                  <div class="text-[13px] text-[var(--brand-text-secondary)]">{{ fmtDate(p.createdAt) }}</div>
                  <div class="text-center text-[14px] font-bold tabular-nums">{{ p.currentHeadcount }}</div>
                  <div class="text-center text-[14px] font-bold tabular-nums">{{ p.budgeted }}</div>
                  <div class="text-center"><span class="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-full text-[12.5px] font-bold tabular-nums" :class="p.needToHire > 0 ? 'bg-[var(--brand-status-pending-bg)] text-[var(--brand-status-pending-text)]' : 'bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)]'">{{ p.needToHire }}</span></div>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 rounded-full bg-[var(--brand-canvas)] overflow-hidden"><div class="h-full rounded-full bg-[var(--brand-teal-secondary)]" :style="{ width: `${target(p)}%` }" /></div>
                    <span class="text-[12px] font-semibold text-[var(--brand-text-secondary)] tabular-nums w-9 text-right">{{ target(p) }}%</span>
                  </div>
                  <div @click.stop>
                    <Popover>
                      <PopoverTrigger as-child>
                        <button type="button" class="w-8 h-8 rounded-md grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition"><MoreHorizontal class="w-4 h-4" /></button>
                      </PopoverTrigger>
                      <PopoverContent align="end" class="w-[220px] p-1.5 rounded-xl">
                        <button type="button" class="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13.5px] font-medium text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition" @click="navigateTo(`/manpower/${p.id}`)"><Pencil class="w-4 h-4" /> Open &amp; edit</button>
                        <button type="button" class="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13.5px] font-medium text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition"><Upload class="w-4 h-4" /> Monthly headcount upload</button>
                        <button type="button" class="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13.5px] font-medium text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition"><Download class="w-4 h-4" /> Export</button>
                        <div class="my-1 border-t border-[var(--brand-border-fade)]" />
                        <button type="button" class="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13.5px] font-medium text-[var(--brand-danger)] hover:bg-[var(--brand-status-closed-bg)] transition" @click="remove.mutate(p.id)"><Trash2 class="w-4 h-4" /> Delete</button>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div v-if="expanded[p.id]" class="px-4 py-3 bg-[var(--brand-canvas)] border-b border-[var(--brand-border-fade)]">
                  <ManpowerGrid :project="p" />
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Per-project grid -->
      <div v-else-if="activeProject">
        <div class="flex items-center gap-3 flex-wrap mb-4 text-[13px] text-[var(--brand-text-secondary)]">
          <span class="inline-flex items-center gap-1.5"><Building2 class="w-4 h-4 text-[var(--brand-text-quiet)]" /> {{ activeProject.departments.join(', ') }}</span>
          <span class="inline-flex items-center gap-1.5"><CalendarDays class="w-4 h-4 text-[var(--brand-text-quiet)]" /> {{ activeProject.startDate }} → {{ activeProject.endDate }}</span>
          <span class="inline-flex items-center gap-1.5"><Users class="w-4 h-4 text-[var(--brand-text-quiet)]" /> {{ activeProject.assignedToName }}</span>
        </div>
        <ManpowerGrid :project="activeProject" />
      </div>
    </div>
  </div>
</template>
