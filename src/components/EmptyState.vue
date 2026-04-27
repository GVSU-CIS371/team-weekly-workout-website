<template>
  <div class="empty">
    <div v-if="icon" class="empty-icon">{{ icon }}</div>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  icon:    { type: String, default: '' },
  message: { type: String, default: 'Nothing here yet.' }
})
</script>

<style scoped>
.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--muted);
  font-size: .9rem;
}
.empty-icon { font-size: 2.5rem; margin-bottom: .75rem; opacity: .4; }
</style>
