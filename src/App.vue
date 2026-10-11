<template>
  <AppShell>
    <RouterView />
  </AppShell>
  <MiniPlayer />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'
</script>
