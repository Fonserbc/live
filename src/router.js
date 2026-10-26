import { createRouter, createWebHistory } from 'vue-router'


import PartyView from './views/PartyView.vue'

// Route names/paths mirror the old Nuxt file-based routes, since app code
// pushes to some of these by name (e.g. 'party-party', matching Nuxt's
// auto-generated name for pages/party/_party/index.vue).
const routes = [
  { path: '/', name: 'index', component: PartyView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
