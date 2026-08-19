<script setup lang="ts">
import TalentPoolFormView from '~/components/talent-pools/TalentPoolFormView.vue'
import { useTalentPoolMutations, useTalentPoolMembers, useTalentPoolDepartments } from '~/composables/useTalentPools'
import type { NewTalentPoolInput } from '~/types'

definePageMeta({ layout: 'default' })

const { data: members } = useTalentPoolMembers()
const { data: departments } = useTalentPoolDepartments()
const { create } = useTalentPoolMutations()

function onSubmit(payload: NewTalentPoolInput) {
  create.mutate(payload, { onSuccess: () => navigateTo('/talent-pools') })
}
</script>

<template>
  <TalentPoolFormView
    :members="members ?? []"
    :departments="departments ?? []"
    :submitting="create.isPending.value"
    @submit="onSubmit"
    @back="navigateTo('/talent-pools')"
  />
</template>
