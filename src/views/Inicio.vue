<script setup>
import { computed, onMounted, ref } from 'vue'
import { authStore } from '../services/authStore'
import { listarReportes } from '../services/reportesService'
import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  ETIQUETAS_ROL,
  formatearFecha,
} from '../services/reglas'

const reportes = ref([])
const cargando = ref(true)
const error = ref('')

const rol = computed(() => authStore.state.perfil?.rol)
const esStaff = computed(() => ['tecnico', 'administrador'].includes(rol.value))
const nombre = computed(
  () => authStore.state.perfil?.nombre || authStore.state.user?.email || '',
)

const saludo = computed(() => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buen día'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
})

const conteo = computed(() => {
  const c = { pendiente: 0, en_revision: 0, resuelto: 0, cancelado: 0 }
  for (const reporte of reportes.value) {
    if (reporte.estado in c) c[reporte.estado] += 1
  }
  return {
    ...c,
    total: reportes.value.length,
  }
})

const paraAtender = computed(() =>
  reportes.value
    .filter((r) => r.estado === 'pendiente' || r.estado === 'en_revision')
    .slice(0, 6),
)

const recientes = computed(() => reportes.value.slice(0, 6))

const listado = computed(() => (esStaff.value ? paraAtender.value : recientes.value))

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    reportes.value = esStaff.value
      ? await listarReportes({})
      : await listarReportes({
          soloMios: true,
          userId: authStore.state.user?.id,
        })
  } catch (e) {
    error.value = 'No se pudieron cargar los reportes: ' + e.message
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div>
    <header class="page-header">
      <div>
        <h1>{{ saludo }}, {{ nombre }}</h1>
        <p class="page-header__sub">
          {{ ETIQUETAS_ROL[rol] || 'Estudiante / Docente' }} ·
          {{
            esStaff
              ? 'Resumen del servicio y reportes que esperan atención.'
              : 'Estado de tus reportes y acceso a enviar uno nuevo.'
          }}
        </p>
      </div>

      <div class="page-header__acciones">
        <RouterLink to="/reportes/nuevo" class="btn">Nuevo reporte</RouterLink>
        <RouterLink v-if="esStaff" to="/tablero" class="btn btn--secondary">
          Tablero
        </RouterLink>
      </div>
    </header>

    <div v-if="error" class="alert error" role="alert">
      {{ error }}
      <button class="secondary small" style="margin-left: 0.6rem" @click="cargar">
        Reintentar
      </button>
    </div>

    <template v-if="cargando">
      <div class="mini-grid">
        <div v-for="n in 4" :key="n" class="skeleton" style="height: 92px"></div>
      </div>
      <div class="card">
        <div v-for="n in 3" :key="n" class="skeleton skeleton--row" style="margin-bottom: 0.6rem"></div>
      </div>
    </template>

    <template v-else>
      <div class="mini-grid">
        <RouterLink
          class="mini-stat"
          :to="{ path: '/reportes', query: { estado: 'pendiente' } }"
        >
          <span class="mini-stat__label">Pendientes</span>
          <span class="mini-stat__value">{{ conteo.pendiente }}</span>
          <span class="mini-stat__hint">Sin tomar todavía</span>
        </RouterLink>

        <RouterLink
          class="mini-stat"
          :to="{ path: '/reportes', query: { estado: 'en_revision' } }"
        >
          <span class="mini-stat__label">En revisión</span>
          <span class="mini-stat__value">{{ conteo.en_revision }}</span>
          <span class="mini-stat__hint">Con trabajo en curso</span>
        </RouterLink>

        <RouterLink
          class="mini-stat"
          :to="{ path: '/reportes', query: { estado: 'resuelto' } }"
        >
          <span class="mini-stat__label">Resueltos</span>
          <span class="mini-stat__value">{{ conteo.resuelto }}</span>
          <span class="mini-stat__hint">Cerrados en el sistema</span>
        </RouterLink>

        <RouterLink class="mini-stat" to="/reportes">
          <span class="mini-stat__label">Total</span>
          <span class="mini-stat__value">{{ conteo.total }}</span>
          <span class="mini-stat__hint">
            {{ esStaff ? 'Todos los reportes' : 'Tus reportes' }}
          </span>
        </RouterLink>
      </div>

      <section class="card">
        <header class="card__head">
          <div>
            <h2>{{ esStaff ? 'Para atender' : 'Tus reportes recientes' }}</h2>
            <p class="hint" style="margin: 0.15rem 0 0">
              {{
                esStaff
                  ? 'Pendientes y en revisión, los más recientes primero.'
                  : 'Los últimos reportes que enviaste.'
              }}
            </p>
          </div>
          <RouterLink to="/reportes" class="btn btn--ghost btn--sm">
            Ver todos
          </RouterLink>
        </header>

        <div v-if="listado.length === 0" class="empty">
          <strong>
            {{ esStaff ? 'No hay reportes esperando atención' : 'Todavía no enviaste reportes' }}
          </strong>
          {{
            esStaff
              ? 'Todos los reportes cargados están resueltos o cancelados.'
              : 'Cuando detectes un problema en el edificio, cargalo desde el sistema.'
          }}
          <div>
            <RouterLink to="/reportes/nuevo" class="btn btn--secondary btn--sm">
              Crear un reporte
            </RouterLink>
          </div>
        </div>

        <div v-else>
          <div v-for="reporte in listado" :key="reporte.id" class="list-item">
            <div class="list-item__main">
              <RouterLink class="list-item__title" :to="`/reportes/${reporte.id}`">
                {{ reporte.titulo }}
              </RouterLink>
              <span class="list-item__meta">
                #{{ reporte.id }} · {{ reporte.ubicaciones?.nombre }} ·
                {{ reporte.categorias?.nombre }} ·
                {{ formatearFecha(reporte.created_at) }}
              </span>
            </div>

            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap">
              <span class="badge prioridad" :class="reporte.prioridad">
                {{ ETIQUETAS_PRIORIDAD[reporte.prioridad] }}
              </span>
              <span class="badge" :class="reporte.estado">
                {{ ETIQUETAS_ESTADO[reporte.estado] }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
