<script setup>
definePageMeta({
  middleware: 'auth'
})

// Redirect to CTO page
if (process.client) {
  navigateTo('/finn/cto')
}
</script>

<template>
  <div></div>
</template>
