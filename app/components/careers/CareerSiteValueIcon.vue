<script setup lang="ts">
import { CAREER_SITE_VALUE_ICONS } from '~/composables/useCareerSite'

const props = defineProps<{ index: number, color: string, size?: number }>()
const Icon = computed(() => CAREER_SITE_VALUE_ICONS[props.index] ?? CAREER_SITE_VALUE_ICONS[0])
</script>

<template>
  <component :is="Icon" :size="props.size ?? 18" :style="{ color: props.color }" />
</template>
