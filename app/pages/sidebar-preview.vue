<script setup lang="ts">
import AppSidebar from '~/components/layout/AppSidebar.vue'
import AppSidebarV2 from '~/components/layout/AppSidebarV2.vue'
import { BrandButton } from '~/components/brand'
import { ArrowLeft } from 'lucide-vue-next'

// Full-page preview — no shell chrome so both sidebars render at true scale.
definePageMeta({ layout: false })
</script>

<template>
  <div class="min-h-screen bg-[var(--brand-canvas)]">
    <!-- Preview header -->
    <header class="flex items-center gap-4 px-6 h-14 border-b border-[var(--brand-border-light)] bg-[var(--brand-surface-white)]">
      <NuxtLink
        to="/dashboard"
        class="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)] transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to app
      </NuxtLink>
      <div class="h-6 w-px bg-[var(--brand-border-light)]" />
      <div>
        <div class="text-[15px] font-bold text-[var(--brand-text)]">Sidebar — design comparison</div>
        <div class="text-[11.5px] text-[var(--brand-text-quiet)]">Current shipping sidebar vs. alternate option. Live components, click through both to feel the difference.</div>
      </div>
      <div class="ml-auto text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--brand-text-quiet)]">
        Preview only
      </div>
    </header>

    <!-- Two variants side by side -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6">
      <!-- ─── Variant A: current sidebar ─── -->
      <section class="flex flex-col">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-[var(--brand-surface-badge)] text-[11.5px] font-bold text-[var(--brand-text-secondary)]">
            Option A · current
          </span>
          <span class="text-[12.5px] text-[var(--brand-text-quiet)]">Minimal Recruitee-style rail — 212 px / 64 px collapsed.</span>
        </div>
        <div class="rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div class="flex h-[640px]">
            <AppSidebar />
            <div class="flex-1 bg-[var(--brand-surface-white)] border-l border-[var(--brand-border-light)] p-6">
              <div class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-text-quiet)] mb-2">Preview content</div>
              <div class="text-[15px] font-bold text-[var(--brand-text)] mb-4">Main content area</div>
              <ul class="space-y-2 text-[13.5px] text-[var(--brand-text-secondary)] list-disc pl-5">
                <li>Icon-only rail, 6 primary items + Settings</li>
                <li>Single lime-active pill for the current route</li>
                <li>Hide/show toggle at the bottom</li>
                <li>No workspace switcher · no user card · no counts</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Variant B: alternate sidebar ─── -->
      <section class="flex flex-col">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-[var(--brand-teal)] text-[11.5px] font-bold text-[var(--brand-lime)]">
            Option B · alternate
          </span>
          <span class="text-[12.5px] text-[var(--brand-text-quiet)]">Workspace switcher, grouped sections, badges, user card — 240 px.</span>
        </div>
        <div class="rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div class="flex h-[640px]">
            <AppSidebarV2 />
            <div class="flex-1 bg-[var(--brand-surface-white)] border-l border-[var(--brand-border-light)] p-6">
              <div class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-text-quiet)] mb-2">Preview content</div>
              <div class="text-[15px] font-bold text-[var(--brand-text)] mb-4">Main content area</div>
              <ul class="space-y-2 text-[13.5px] text-[var(--brand-text-secondary)] list-disc pl-5">
                <li>Workspace pill at the top (multi-tenant ready)</li>
                <li>Inline ⌘K search built into the sidebar</li>
                <li>4 grouped sections — MAIN · HIRING · ANALYZE · COMMUNICATION</li>
                <li>Count badges (Interviews 3, Approvals 5) & live-status dot</li>
                <li>User card pinned at bottom w/ notifications bell</li>
                <li>"New job" quick action embedded in the rail</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Adoption note -->
    <div class="px-6 pb-8">
      <div class="max-w-3xl mx-auto rounded-[12px] border border-[var(--brand-border-light)] bg-[var(--brand-lime-tint-hover)] p-4 text-[13px] text-[var(--brand-text-secondary)]">
        <div class="font-bold text-[var(--brand-text)] mb-1">To adopt Option B</div>
        Swap the import in
        <code class="font-mono text-[12px] px-1.5 py-0.5 rounded bg-[var(--brand-surface-white)] border border-[var(--brand-border-light)]">app/layouts/default.vue</code>
        from
        <code class="font-mono text-[12px] px-1.5 py-0.5 rounded bg-[var(--brand-surface-white)] border border-[var(--brand-border-light)]">AppSidebar</code>
        to
        <code class="font-mono text-[12px] px-1.5 py-0.5 rounded bg-[var(--brand-surface-white)] border border-[var(--brand-border-light)]">AppSidebarV2</code>.
        Both components use the same store, tokens, and active-state treatment — the layout doesn't need to change.
        <div class="mt-3">
          <BrandButton variant="primary-teal" size="sm">Adopt Option B</BrandButton>
          <BrandButton variant="ghost" size="sm">Keep Option A</BrandButton>
        </div>
      </div>
    </div>
  </div>
</template>
