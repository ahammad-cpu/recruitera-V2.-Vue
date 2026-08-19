<!-- Pool kebab. System (General Application) pool exposes Form Link only. -->
<script setup lang="ts">
import { MoreHorizontal, Link2, Archive, RotateCcw, Trash2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type { TalentPool } from '~/types'

const props = defineProps<{ pool: TalentPool }>()
const emit = defineEmits<{ formLink: []; archive: []; retrieve: []; delete: [] }>()

const isActive = computed(() => props.pool.status === 'active')
const canForm = computed(() => props.pool.category === 'event' || props.pool.category === 'general')
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="h-8 w-8 rounded-lg text-[var(--brand-text-quiet)]" aria-label="Pool actions" @click.stop>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-52" @click.stop>
      <DropdownMenuItem v-if="canForm && pool.formPublished" class="text-[13.5px] cursor-pointer gap-2" @click="emit('formLink')">
        <Link2 class="w-4 h-4" /> Form Link
      </DropdownMenuItem>

      <template v-if="!pool.system">
        <DropdownMenuSeparator v-if="canForm && pool.formPublished" />
        <DropdownMenuItem v-if="isActive" class="text-[13.5px] cursor-pointer gap-2" @click="emit('archive')">
          <Archive class="w-4 h-4" /> Archive
        </DropdownMenuItem>
        <DropdownMenuItem v-else class="text-[13.5px] cursor-pointer gap-2" @click="emit('retrieve')">
          <RotateCcw class="w-4 h-4" /> Retrieve
        </DropdownMenuItem>
        <DropdownMenuItem class="text-[13.5px] cursor-pointer gap-2 text-[var(--brand-danger)] focus:text-[var(--brand-danger)]" @click="emit('delete')">
          <Trash2 class="w-4 h-4" /> Delete
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
