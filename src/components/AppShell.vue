<template>
  <div class="app-shell">
    <header class="top-bar">
      <RouterLink class="brand" to="/" aria-label="Pacey-music 首页">
        <PaceyLogo class="brand-logo" />
        <span class="brand-name">Pacey-music</span>
      </RouterLink>

      <nav
        ref="navigationElement"
        class="nav-tabs"
        :class="{ 'is-dragging': isNavigationDragging }"
        :style="navigationStyle"
        aria-label="主导航"
      >
        <span
          class="nav-tabs__indicator"
          aria-hidden="true"
          @pointerdown="startNavigationDrag"
          @pointermove="moveNavigationDrag"
          @pointerup="finishNavigationDrag"
          @pointercancel="cancelNavigationDrag"
        />
        <RouterLink
          v-for="(tab, index) in navigationTabs"
          :key="tab.to"
          :to="tab.to"
          :class="{ 'router-link-active': currentNavigationIndex === index }"
        >
          {{ tab.label }}
        </RouterLink>
      </nav>

      <button class="top-search" type="button" aria-label="搜索音乐" @click="searchOpen = true">
        <Search :size="18" />
        <span>搜索</span>
      </button>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <SearchOverlay v-model:open="searchOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@lucide/vue'
import PaceyLogo from '@/components/PaceyLogo.vue'
import SearchOverlay from '@/components/SearchOverlay.vue'

const searchOpen = ref(false)
const route = useRoute()
const router = useRouter()
const navigationElement = ref<HTMLElement | null>(null)
const isNavigationDragging = ref(false)
const dragNavigationIndex = ref(0)
const dragStartIndex = ref(0)
const navigationTabs = [
  { to: '/', label: '发现' },
  { to: '/playlists', label: '歌单' },
  { to: '/rankings', label: '排行' },
  { to: '/radio', label: '电台' },
]

const currentNavigationIndex = computed(() => {
  if (route.path.startsWith('/playlist')) return 1
  if (route.path.startsWith('/rankings')) return 2
  if (route.path.startsWith('/radio')) return 3
  return 0
})
const visibleNavigationIndex = computed(() =>
  isNavigationDragging.value ? dragNavigationIndex.value : currentNavigationIndex.value,
)
const navigationStyle = computed(
  () => ({ '--nav-index': visibleNavigationIndex.value }) as CSSProperties,
)

function indexFromPointer(event: PointerEvent) {
  const element = navigationElement.value
  if (!element) return dragNavigationIndex.value

  const bounds = element.getBoundingClientRect()
  const inset = 5
  const width = Math.max(1, bounds.width - inset * 2)
  const position = Math.max(0, Math.min(width - 0.01, event.clientX - bounds.left - inset))
  return Math.floor((position / width) * navigationTabs.length)
}

function startNavigationDrag(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  dragStartIndex.value = currentNavigationIndex.value
  dragNavigationIndex.value = currentNavigationIndex.value
  isNavigationDragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function moveNavigationDrag(event: PointerEvent) {
  if (!isNavigationDragging.value) return
  dragNavigationIndex.value = indexFromPointer(event)
}

function finishNavigationDrag(event: PointerEvent) {
  if (!isNavigationDragging.value) return
  const targetIndex = indexFromPointer(event)
  isNavigationDragging.value = false
  dragNavigationIndex.value = targetIndex
  if (targetIndex !== dragStartIndex.value) {
    void router.push(navigationTabs[targetIndex].to)
  }
}

function cancelNavigationDrag() {
  isNavigationDragging.value = false
  dragNavigationIndex.value = currentNavigationIndex.value
}
</script>
