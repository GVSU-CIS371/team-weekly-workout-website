<template>
  <!-- ========================================================
    NotFound.vue
    Shown for any route that doesn't match (catch-all).
  ======================================================== -->
  <div class="not-found">
    <div class="code">404</div>
    <p class="msg">Page not found.</p>
    <RouterLink to="/" class="btn btn-primary">← Go Home</RouterLink>
  </div>
</template>

<script setup></script>

<style scoped>
.not-found {
  min-height: calc(100vh - var(--nav-h));
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1rem; padding: 2rem;
}
.code {
  font-family: var(--font-display);
  font-size: 8rem; color: var(--accent); line-height: 1;
}
.msg { color: var(--muted); font-size: 1rem; }
.btn {
  display: inline-flex; align-items: center;
  padding: .65rem 1.5rem; border-radius: 7px; border: none;
  font-family: var(--font-body); font-size: .9rem; font-weight: 600;
  cursor: pointer; text-decoration: none;
  background: var(--accent); color: var(--bg);
  transition: opacity .15s;
}
.btn:hover { opacity: .85; }
</style>
