<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authStore } from './services/authStore'
import { ETIQUETAS_ROL } from './services/reglas'

const router = useRouter()
const route = useRoute()

onMounted(() => {
  authStore.inicializar()
})

const rol = computed(() => authStore.state.perfil?.rol)
const esStaff = computed(() => ['tecnico', 'administrador'].includes(rol.value))
const esAdmin = computed(() => rol.value === 'administrador')

const nombre = computed(
  () => authStore.state.perfil?.nombre || authStore.state.user?.email || '',
)
const inicial = computed(() => (nombre.value || '?').trim().charAt(0))

const mostrarApp = computed(
  () => !route.meta.publica && Boolean(authStore.state.user),
)

const enReportes = computed(
  () => route.path === '/reportes' || route.path.startsWith('/reportes/'),
)

async function salir() {
  await authStore.cerrarSesion()
  router.push({ name: 'login' })
}
</script>

<template>
  <a v-if="mostrarApp" class="skip-link" href="#contenido">Saltar al contenido</a>

  <header v-if="mostrarApp" class="app-header">
    <div class="app-header__inner">
      <RouterLink to="/inicio" class="brand">
        <span class="brand__mark" aria-hidden="true">G</span>
        <span class="brand__text">
          <strong>Gestia</strong>
          <span>Mantenimiento escolar</span>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="Secciones principales">
        <RouterLink to="/inicio">Inicio</RouterLink>
        <RouterLink to="/reportes" :class="{ 'nav-activo': enReportes }">
          Reportes
        </RouterLink>
        <RouterLink v-if="esStaff" to="/tablero">Tablero</RouterLink>
        <RouterLink v-if="esStaff" to="/informe">Informe</RouterLink>
        <RouterLink v-if="esAdmin" to="/usuarios">Usuarios</RouterLink>
      </nav>

      <div class="app-header__actions">
        <RouterLink to="/reportes/nuevo" class="btn btn--sm">
          Nuevo reporte
        </RouterLink>

        <div class="user-chip">
          <span class="avatar" aria-hidden="true">{{ inicial }}</span>
          <span class="user-chip__text">
            <strong :title="nombre">{{ nombre }}</strong>
            <span>{{ ETIQUETAS_ROL[rol] || 'Estudiante / Docente' }}</span>
          </span>
        </div>

        <button class="ghost small" @click="salir">Salir</button>
      </div>
    </div>
  </header>

  <main id="contenido" class="container">
    <RouterView />
  </main>
</template>
