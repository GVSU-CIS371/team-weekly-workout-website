<template>
  <!-- ========================================================
    PageHeader.vue
    Large display title + subtitle used at the top of each page.
  ======================================================== -->
  <div class="page-header">
    <h1 class="page-title">{{ title }}</h1>
    <p  class="page-sub">{{ subtitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>

<style scoped>
.page-header { margin-bottom: 2rem; }
.page-title {
  font-family: var(--font-display);
  font-size: 3rem;              /* change page heading size here */
  letter-spacing: .06em;
  color: var(--accent);
  line-height: 1;
  margin-bottom: .35rem;
}
.page-sub { color: var(--muted); font-size: .9rem; }

@media (max-width: 640px) {
  .page-title { font-size: 2.2rem; }
}
</style>
