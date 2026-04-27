<template>
  <!-- ========================================================
    AppCard.vue
    Generic surface card wrapper used on every page.
    Slots: default (content), header (optional title row)
  ======================================================== -->
  <div class="app-card">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <span class="card-title">{{ title }}</span>
      </slot>
    </div>
    <slot />
  </div>
</template>

<script setup>
// title prop — shorthand when you just need a text header
defineProps({ title: { type: String, default: '' } })
</script>

<style scoped>
.app-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.75rem;
  margin-bottom: 1.25rem;
}
.card-header {
  margin-bottom: 1.25rem;
  display: flex; align-items: center; justify-content: space-between;
}
.card-title {
  font-size: .7rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted);
}
</style>
