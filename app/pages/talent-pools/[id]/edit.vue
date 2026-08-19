<script setup lang="ts">
import TalentPoolFormView from '~/components/talent-pools/TalentPoolFormView.vue'
import { useTalentPool, useTalentPoolMutations, useTalentPoolMembers, useTalentPoolDepartments } from '~/composables/useTalentPools'
import type { NewTalentPoolInput } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data: pool } = useTalentPool(id)
const { data: members } = useTalentPoolMembers()
const { data: departments } = useTalentPoolDepartments()
const { update } = useTalentPoolMutations()

function onSubmit(payload: NewTalentPoolInput) {
  update.mutate({ id: id.value, input: payload }, { onSuccess: () => navigateTo('/talent-pools') })
}
</script>

<template>
  <TalentPoolFormView
    :pool="pool"
    :members="members ?? []"
    :departments="departments ?? []"
    :submitting="update.isPending.value"
    @submit="onSubmit"
    @back="navigateTo('/talent-pools')"
  />
</template>
