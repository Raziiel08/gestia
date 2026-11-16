<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { obtenerMetricas } from "../services/estadisticasService";
import { listarUbicaciones } from "../services/reportesService";
import { PERIODOS, resolverPeriodo } from "../services/periodos";
import {
  formatearFechaHora,
  formatearNumero,
  formatearPeriodo,
} from "../services/reglas";
import StatCard from "../components/StatCard.vue";
import GraficoBarras from "../components/GraficoBarras.vue";
import GraficoLineas from "../components/GraficoLineas.vue";
import GraficoApilado from "../components/GraficoApilado.vue";

const METAS = Object.freeze({
  resueltos: 80,
  enPlazo: 90,
  tiempo: 5,
  backlog: 10,
});

const periodo = ref("ultimos_30");
const ubicacionId = ref("");
const ubicaciones = ref([]);

const metricas = ref(null);
const cargando = ref(true);
const error = ref("");

const rango = computed(() => resolverPeriodo(periodo.value));
const resumenPeriodo = computed(() => formatearPeriodo(rango.value));

const valorResueltos = computed(() => {
  const valor = metricas.value?.pctResueltos;
  return valor === null || valor === undefined ? null : formatearNumero(valor);
});
const valorEnPlazo = computed(() => {
  const valor = metricas.value?.pctEnPlazo;
  return valor === null || valor === undefined ? null : formatearNumero(valor);
});
const valorTiempo = computed(() => {
  const valor = metricas.value?.tiempoPromedioDias;
  return valor === null || valor === undefined ? null : formatearNumero(valor);
});

const detalleTiempo = computed(() => {
  const m = metricas.value;
  if (!m || !m.muestraTiempos) return "Sin resoluciones en el período";
  return `Mediana ${formatearNumero(m.tiempoMedianaDias)} días · ${m.muestraTiempos} resoluciones`;
});

const detalleBacklog = computed(() => {
  const estado = metricas.value?.porEstado;
  if (!estado) return "";
  return `${estado.pendiente} pendientes + ${estado.en_revision} en revisión`;
});

function estadoPorcentaje(valor, meta) {
  if (valor === null || valor === undefined) return "sin-datos";
  return valor >= meta ? "ok" : "alerta";
}

function estadoTiempo(valor, meta) {
  if (valor === null || valor === undefined) return "sin-datos";
  return valor <= meta ? "ok" : "alerta";
}

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    metricas.value = await obtenerMetricas({
      desde: rango.value.desde,
      hasta: rango.value.hasta,
      ubicacionId: ubicacionId.value || undefined,
    });
  } catch (e) {
    error.value = "No se pudieron cargar los indicadores: " + e.message;
  } finally {
    cargando.value = false;
  }
}

async function cargarUbicaciones() {
  try {
    ubicaciones.value = await listarUbicaciones();
  } catch {
    ubicaciones.value = [];
  }
}

function verTodoElHistorial() {
  periodo.value = "todo";
}

watch([periodo, ubicacionId], cargar);

onMounted(async () => {
  await cargarUbicaciones();
  await cargar();
});
</script>

<template>
  <div>
    <header class="page-header">
      <div>
        <h1>Tablero de mantenimiento</h1>
        <p class="page-header__sub">
          Consulta rápida del servicio · {{ resumenPeriodo }}
        </p>
      </div>
      <div class="page-header__acciones">
        <span v-if="metricas" class="actualizado" role="status">
          Actualizado: {{ formatearFechaHora(metricas.actualizadoEn) }}
        </span>
        <button class="secondary" :disabled="cargando" @click="cargar">
          {{ cargando ? "Actualizando..." : "Actualizar" }}
        </button>
      </div>
    </header>

    <section class="card filtros" aria-label="Filtros del tablero">
      <div class="field">
        <label for="periodo">Período</label>
        <select id="periodo" v-model="periodo">
          <option v-for="opcion in PERIODOS" :key="opcion.valor" :value="opcion.valor">
            {{ opcion.etiqueta }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="ubicacion">Ubicación</label>
        <select id="ubicacion" v-model="ubicacionId">
          <option value="">Todas las ubicaciones</option>
          <option v-for="u in ubicaciones" :key="u.id" :value="u.id">
            {{ u.nombre }}
          </option>
        </select>
      </div>

      <p class="filtro-resumen">{{ resumenPeriodo }}</p>
    </section>

    <div v-if="error" class="alert error" role="alert">
      {{ error }}
      <button class="secondary" style="margin-left: 0.75rem" @click="cargar">
        Reintentar
      </button>
    </div>

    <template v-if="cargando && !metricas">
      <div class="kpi-grid">
        <div v-for="n in 4" :key="n" class="skeleton skeleton--kpi"></div>
      </div>
      <div class="chart-grid">
        <div class="skeleton skeleton--chart"></div>
        <div class="skeleton skeleton--chart"></div>
      </div>
    </template>

    <template v-else-if="metricas && !metricas.hayDatos">
      <div class="card empty-state">
        <strong>No hay reportes en el período seleccionado</strong>
        <p>
          Probá con otro período u otra ubicación. Los indicadores no se muestran
          en cero porque no habría datos para calcularlos.
        </p>
        <button v-if="periodo !== 'todo'" @click="verTodoElHistorial">
          Ver todo el historial
        </button>
      </div>
    </template>

    <template v-else-if="metricas">
      <div class="kpi-grid">
        <StatCard
          titulo="Reportes resueltos"
          :valor="valorResueltos"
          unidad="%"
          :meta="`Meta ≥ ${METAS.resueltos} %`"
          :detalle="`Sobre ${metricas.pctResueltosBase} reportes no cancelados`"
          explicacion="No hay reportes en el período, no se puede calcular el porcentaje."
          :estado="estadoPorcentaje(metricas.pctResueltos, METAS.resueltos)"
        />

        <StatCard
          titulo="Resueltos en plazo"
          :valor="valorEnPlazo"
          unidad="%"
          :meta="`Meta ≥ ${METAS.enPlazo} %`"
          :detalle="`Sobre ${metricas.pctEnPlazoBase} reportes resueltos`"
          explicacion="No hay reportes resueltos en el período, no se puede calcular el cumplimiento."
          :estado="estadoPorcentaje(metricas.pctEnPlazo, METAS.enPlazo)"
        />

        <StatCard
          titulo="Tiempo promedio de resolución"
          :valor="valorTiempo"
          unidad="días"
          :meta="`Meta ≤ ${METAS.tiempo} días`"
          :detalle="detalleTiempo"
          explicacion="No hay resoluciones registradas en el período, no se puede calcular el promedio."
          :estado="estadoTiempo(metricas.tiempoPromedioDias, METAS.tiempo)"
        />

        <StatCard
          titulo="Reportes abiertos"
          :valor="metricas.backlog"
          unidad="reportes"
          :meta="`Meta ≤ ${METAS.backlog}`"
          :detalle="detalleBacklog"
          :estado="metricas.backlog <= METAS.backlog ? 'ok' : 'alerta'"
        />
      </div>

      <div v-if="metricas.vencidos > 0" class="alert error" role="status">
        <strong>{{ metricas.vencidos }}</strong>
        {{ metricas.vencidos === 1 ? "reporte abierto superó" : "reportes abiertos superaron" }}
        el plazo de su prioridad.
      </div>

      <div class="chart-grid chart-grid--dash">
        <GraficoBarras
          titulo="Demanda por tipo de problema"
          :subtitulo="`${resumenPeriodo} · ${metricas.total} reportes`"
          :datos="metricas.porCategoria"
          :nota="`Porcentaje calculado sobre ${metricas.total} reportes del período.`"
        />

        <GraficoLineas
          titulo="Creados y resueltos por mes"
          :subtitulo="resumenPeriodo"
          :datos="metricas.serieMensual"
          nota="Los resueltos se cuentan por mes de cierre; un reporte creado en un mes puede resolverse en otro."
        />

        <GraficoApilado
          titulo="Estado de los reportes por ubicación"
          :subtitulo="`${resumenPeriodo} · ${metricas.total} reportes`"
          :datos="metricas.porUbicacion"
          nota="Cada barra suma el total de reportes de esa ubicación, separado por estado."
        />
      </div>
    </template>
  </div>
</template>
