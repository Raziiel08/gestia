<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authStore } from '../services/authStore'
import {
  listarReportes,
  listarUbicaciones,
  listarCategorias,
} from '../services/reportesService'
import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  ESTADOS,
  formatearFecha,
} from '../services/reglas'

const route = useRoute()
const router = useRouter()

const reportes = ref([])
const ubicaciones = ref([])
const categorias = ref([])
const cargando = ref(true)
const error = ref('')

const filtroEstado = ref(String(route.query.estado ?? ''))
const filtroUbicacion = ref(String(route.query.ubicacion ?? ''))
const filtroCategoria = ref(String(route.query.categoria ?? ''))
const busqueda = ref(String(route.query.buscar ?? ''))

const esStaff = computed(() =>
  ['tecnico', 'administrador'].includes(authStore.state.perfil?.rol),
)

const hayFiltros = computed(
  () =>
    Boolean(filtroEstado.value) ||
    Boolean(filtroUbicacion.value) ||
    Boolean(filtroCategoria.value) ||
    Boolean(busqueda.value),
)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    reportes.value = await listarReportes({
      estado: filtroEstado.value || undefined,
      ubicacionId: filtroUbicacion.value || undefined,
      categoriaId: filtroCategoria.value || undefined,
      busqueda: busqueda.value.trim() || undefined,
      soloMios: !esStaff.value,
      userId: authStore.state.user?.id,
    })
  } catch (e) {
    error.value = 'No se pudieron cargar los reportes: ' + e.message
  } finally {
    cargando.value = false
  }
}

function sincronizarUrl() {
  const query = {}
  if (filtroEstado.value) query.estado = filtroEstado.value
  if (filtroUbicacion.value) query.ubicacion = filtroUbicacion.value
  if (filtroCategoria.value) query.categoria = filtroCategoria.value
  if (busqueda.value.trim()) query.buscar = busqueda.value.trim()
  router.replace({ name: 'lista-reportes', query })
}

function limpiarFiltros() {
  filtroEstado.value = ''
  filtroUbicacion.value = ''
  filtroCategoria.value = ''
  busqueda.value = ''
}

onMounted(async () => {
  try {
    ;[ubicaciones.value, categorias.value] = await Promise.all([
      listarUbicaciones(),
      listarCategorias(),
    ])
  } catch {

  }
  await cargar()
})

let debounceId
watch([filtroEstado, filtroUbicacion, filtroCategoria], () => {
  sincronizarUrl()
  cargar()
})
watch(busqueda, () => {
  clearTimeout(debounceId)
  debounceId = setTimeout(() => {
    sincronizarUrl()
    cargar()
  }, 300)
})
</script>

<template>
  <div>
    <header class="page-header">
      <div>
        <h1>Reportes</h1>
        <p class="page-header__sub">
          {{
            esStaff
              ? 'Todos los reportes del establecimiento y su estado actual.'
              : 'Los reportes que enviaste y el estado de cada uno.'
          }}
        </p>
      </div>

      <div class="page-header__acciones">
        <RouterLink to="/reportes/nuevo" class="btn">Nuevo reporte</RouterLink>
      </div>
    </header>

    <div v-if="error" class="alert error" role="alert">
      {{ error }}
      <button class="secondary small" style="margin-left: 0.6rem" @click="cargar">
        Reintentar
      </button>
    </div>

    <section class="card">
      <div class="toolbar">
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por título o descripción"
          aria-label="Buscar reportes"
        />

        <select v-model="filtroEstado" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option v-for="estado in ESTADOS" :key="estado" :value="estado">
            {{ ETIQUETAS_ESTADO[estado] }}
          </option>
        </select>

        <select v-model="filtroUbicacion" aria-label="Filtrar por ubicación">
          <option value="">Todas las ubicaciones</option>
          <option v-for="u in ubicaciones" :key="u.id" :value="u.id">
            {{ u.nombre }}
          </option>
        </select>

        <select v-model="filtroCategoria" aria-label="Filtrar por tipo de problema">
          <option value="">Todos los tipos</option>
          <option v-for="c in categorias" :key="c.id" :value="c.id">
            {{ c.nombre }}
          </option>
        </select>

        <button v-if="hayFiltros" class="ghost small" @click="limpiarFiltros">
          Limpiar
        </button>

        <span class="toolbar__meta" role="status">
          {{ cargando ? 'Buscando…' : `${reportes.length} ${reportes.length === 1 ? 'reporte' : 'reportes'}` }}
        </span>
      </div>

      <div v-if="cargando" aria-hidden="true">
        <div v-for="n in 4" :key="n" class="skeleton skeleton--row" style="margin-bottom: 0.55rem"></div>
      </div>

      <div v-else-if="reportes.length === 0" class="empty">
        <strong>No se encontraron reportes</strong>
        <p>
          {{
            hayFiltros
              ? 'Probá con otros filtros o limpiá la búsqueda.'
              : 'Todavía no hay reportes cargados en el sistema.'
          }}
        </p>
        <button v-if="hayFiltros" class="secondary small" @click="limpiarFiltros">
          Limpiar filtros
        </button>
        <RouterLink v-else to="/reportes/nuevo" class="btn btn--secondary btn--sm">
          Crear un reporte
        </RouterLink>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col" class="num">#</th>
              <th scope="col">Problema</th>
              <th scope="col">Lugar</th>
              <th scope="col">Tipo</th>
              <th scope="col">Prioridad</th>
              <th scope="col">Estado</th>
              <th scope="col">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reporte in reportes" :key="reporte.id">
              <td class="num">{{ reporte.id }}</td>
              <td>
                <RouterLink :to="`/reportes/${reporte.id}`">
                  {{ reporte.titulo }}
                </RouterLink>
              </td>
              <td>{{ reporte.ubicaciones?.nombre }}</td>
              <td>{{ reporte.categorias?.nombre }}</td>
              <td>
                <span class="badge prioridad" :class="reporte.prioridad">
                  {{ ETIQUETAS_PRIORIDAD[reporte.prioridad] }}
                </span>
              </td>
              <td>
                <span class="badge" :class="reporte.estado">
                  {{ ETIQUETAS_ESTADO[reporte.estado] }}
                </span>
              </td>
              <td class="num">{{ formatearFecha(reporte.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
