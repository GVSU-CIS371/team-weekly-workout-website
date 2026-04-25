<template>
  <!-- ========================================================
    StatPill.vue
    Large-number summary widget used at the top of data pages.
    Props:
      value  — the big number / text shown
      label  — small label below the number
      unit   — optional unit appended (e.g. 'kg', '%')
  ======================================================== -->
  <div class="stat-pill">
    <div class="stat-val">
      {{ value }}<small v-if="unit" class="stat-unit"> {{ unit }}</small>
    </div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<script setup>
defineProps({
  value: { required: true },
  label: { type: String, required: true },
  unit:  { type: String, default: '' }
})
</script>

<style scoped>
.stat-pill {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.4rem 1.2rem;
  text-align: center;
}
.stat-val {
  font-family: var(--font-display);
  font-size: 2.4rem;            /* change size of the big number here */
  color: var(--accent);
  line-height: 1;
}
.stat-unit { font-size: 1rem; }
.stat-label {
  font-size: .72rem;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted); margin-top: .35rem;
}
</style>
