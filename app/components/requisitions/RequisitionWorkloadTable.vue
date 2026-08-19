<!--
  Team-Lead workload dashboard (E5). One row per recruiter with Active / Pending
  / Fulfilled counts + avg time-to-fill; click a row to expand and see that
  recruiter's assigned requisitions.
-->
<script setup lang="ts">
import { ChevronDown, Clock, Users } from 'lucide-vue-next'
import { BrandDataTable, BrandAvatarInitials } from '~/components/brand'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import RequisitionStatusBadge from './RequisitionStatusBadge.vue'
import type { RecruiterWorkload } from '~/types'

defineProps<{ workload: RecruiterWorkload[], currentUserId: string }>()
const emit = defineEmits<{ open: [id: string] }>()

const expanded = reactive<Record<string, boolean>>({})
function toggle(id: string) { expanded[id] = !expanded[id] }
function fmtDate(iso: string) { return iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

const headCls = 'text-[12.5px] font-semibold text-[var(--brand-text-quiet)] uppercase tracking-wide whitespace-nowrap'
</script>

<template>
  <BrandDataTable>
    <template #header>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead :class="headCls">Recruiter</TableHead>
          <TableHead :class="headCls" class="text-center w-24">Active</TableHead>
          <TableHead :class="headCls" class="text-center w-24">Pending</TableHead>
          <TableHead :class="headCls" class="text-center w-24">Fulfilled</TableHead>
          <TableHead :class="headCls" class="w-40">Avg. time to fill</TableHead>
          <TableHead class="w-10" />
        </TableRow>
      </TableHeader>
    </template>

    <TableBody>
      <template v-for="w in workload" :key="w.recruiterId">
        <TableRow class="cursor-pointer" @click="toggle(w.recruiterId)">
          <TableCell>
            <div class="flex items-center gap-3">
              <BrandAvatarInitials :initials="w.initials" size="sm" />
              <div class="min-w-0">
                <div class="text-[14px] font-semibold text-[var(--brand-text)] truncate">
                  {{ w.name }}
                  <span v-if="w.recruiterId === currentUserId" class="ml-1 text-[11px] font-bold text-[var(--brand-teal)]">You</span>
                </div>
                <div class="text-[12px] text-[var(--brand-text-quiet)]">{{ w.role }}</div>
              </div>
            </div>
          </TableCell>
          <TableCell class="text-center">
            <span class="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-md text-[13px] font-bold tabular-nums bg-[color-mix(in_srgb,var(--brand-status-approved-text)_12%,white)] text-[var(--brand-status-approved-text)]">{{ w.active }}</span>
          </TableCell>
          <TableCell class="text-center">
            <span class="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-md text-[13px] font-bold tabular-nums bg-[var(--brand-status-pending-bg)] text-[var(--brand-status-pending-text)]">{{ w.pending }}</span>
          </TableCell>
          <TableCell class="text-center">
            <span class="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-md text-[13px] font-bold tabular-nums bg-[var(--brand-canvas)] text-[var(--brand-text-secondary)]">{{ w.fulfilled }}</span>
          </TableCell>
          <TableCell class="text-[13.5px] text-[var(--brand-text-secondary)]">
            <span class="inline-flex items-center gap-1.5"><Clock class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" />{{ w.avgDaysToFill != null ? `${w.avgDaysToFill} days` : '—' }}</span>
          </TableCell>
          <TableCell class="text-right">
            <ChevronDown class="w-4 h-4 text-[var(--brand-text-quiet)] inline transition-transform" :class="expanded[w.recruiterId] ? '' : '-rotate-90'" />
          </TableCell>
        </TableRow>

        <TableRow v-if="expanded[w.recruiterId]" class="hover:bg-transparent">
          <TableCell colspan="6" class="bg-[var(--brand-canvas)] p-0">
            <div class="divide-y divide-[var(--brand-border-fade)]">
              <button
                v-for="r in w.requisitions"
                :key="r.id"
                type="button"
                class="w-full flex items-center gap-3 px-5 py-2.5 text-left transition hover:bg-white"
                @click.stop="emit('open', r.id)"
              >
                <span class="text-[13.5px] font-semibold text-[var(--brand-text)] flex-1 min-w-0 truncate">{{ r.title }} <span class="text-[var(--brand-text-quiet)] font-normal tabular-nums">#{{ r.code }}</span></span>
                <RequisitionStatusBadge :status="r.status" variant="solid" />
                <span class="text-[12.5px] text-[var(--brand-text-quiet)] w-28 truncate hidden sm:block">{{ r.department }}</span>
                <span class="text-[12.5px] tabular-nums text-[var(--brand-text-secondary)] w-12 text-center">{{ r.hiresCount }}/{{ r.openingsTotal }}</span>
                <span class="text-[12px] text-[var(--brand-text-quiet)] w-24 tabular-nums text-right hidden md:block">{{ fmtDate(r.assignedAt) }}</span>
              </button>
            </div>
          </TableCell>
        </TableRow>
      </template>

      <TableRow v-if="!workload.length" class="hover:bg-transparent">
        <TableCell colspan="6" class="text-center py-14">
          <Users class="w-8 h-8 mx-auto text-[var(--brand-text-faint)] mb-2" stroke-width="1.5" />
          <div class="text-[14px] font-bold text-[var(--brand-text)]">No assigned requisitions yet</div>
          <div class="text-[13px] text-[var(--brand-text-quiet)]">Approved requisitions assigned to recruiters will appear here.</div>
        </TableCell>
      </TableRow>
    </TableBody>
  </BrandDataTable>
</template>
