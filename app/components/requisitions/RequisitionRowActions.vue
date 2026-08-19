<!-- Card kebab menu — follow, duplicate, archive, delete. -->
<script setup lang="ts">
import { MoreHorizontal, Eye, Bookmark, Copy, Archive, Trash2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type { Requisition } from '~/types'

const props = defineProps<{ requisition: Requisition, currentUserId: string }>()
const emit = defineEmits<{ view: []; follow: []; duplicate: []; archive: []; delete: [] }>()

const isOwner = computed(() => props.requisition.requesterId === props.currentUserId)
const isArchived = computed(() => props.requisition.status === 'archived')
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="h-8 w-8 rounded-lg text-[var(--brand-text-quiet)]" aria-label="Requisition actions" @click.stop>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-48" @click.stop>
      <DropdownMenuItem class="text-[13.5px] cursor-pointer gap-2" @click="emit('view')">
        <Eye class="w-4 h-4" /> Open
      </DropdownMenuItem>
      <DropdownMenuItem class="text-[13.5px] cursor-pointer gap-2" @click="emit('follow')">
        <Bookmark class="w-4 h-4" /> {{ requisition.following ? 'Unfollow' : 'Follow' }}
      </DropdownMenuItem>
      <DropdownMenuItem class="text-[13.5px] cursor-pointer gap-2" @click="emit('duplicate')">
        <Copy class="w-4 h-4" /> Duplicate
      </DropdownMenuItem>
      <template v-if="isOwner">
        <DropdownMenuSeparator />
        <DropdownMenuItem v-if="!isArchived" class="text-[13.5px] cursor-pointer gap-2" @click="emit('archive')">
          <Archive class="w-4 h-4" /> Archive
        </DropdownMenuItem>
        <DropdownMenuItem class="text-[13.5px] cursor-pointer gap-2 text-[var(--brand-danger)] focus:text-[var(--brand-danger)]" @click="emit('delete')">
          <Trash2 class="w-4 h-4" /> Delete
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
