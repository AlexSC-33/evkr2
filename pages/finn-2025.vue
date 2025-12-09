<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div class="page">
    <h1>Finn 2025</h1>
    <p>Coming soon...</p>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  background: linear-gradient(135deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

p {
  color: #8b8b9f;
  margin-top: 1rem;
}
</style>
