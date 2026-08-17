<!-- Legacy route: the public career page moved to /careers. Redirect. -->
<script setup lang="ts">
definePageMeta({ layout: false })
await navigateTo('/careers', { redirectCode: 301, replace: true })
</script>

<template>
  <div />
</template>
