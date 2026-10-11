<template>
  <section class="page">
    <header class="view-title">
      <span class="eyebrow">Radio</span>
      <h1>电台</h1>
    </header>

    <div class="radio-grid">
      <article v-for="channel in channels" :key="channel.id" class="radio-card" :style="{ '--tone': channel.color }">
        <img :src="channel.coverUrl" :alt="channel.name" />
        <span>
          <strong>{{ channel.name }}</strong>
          <small>{{ channel.description }}</small>
        </span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getRadioChannels } from '@/services/music'
import type { RadioChannel } from '@/types/music'

const channels = ref<RadioChannel[]>([])

onMounted(async () => {
  channels.value = await getRadioChannels()
})
</script>
