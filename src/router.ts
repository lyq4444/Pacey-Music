import { createRouter, createWebHistory } from 'vue-router'
import DiscoverView from './views/DiscoverView.vue'
import PlaylistView from './views/PlaylistView.vue'
import LibraryView from './views/LibraryView.vue'
import RankingView from './views/RankingView.vue'
import RadioView from './views/RadioView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'discover', component: DiscoverView },
    { path: '/playlists', name: 'playlists', component: LibraryView },
    { path: '/playlist/:id', name: 'playlist', component: PlaylistView, props: true },
    { path: '/rankings', name: 'rankings', component: RankingView },
    { path: '/radio', name: 'radio', component: RadioView }
  ]
})

export default router
