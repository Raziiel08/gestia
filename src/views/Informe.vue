<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { obtenerMetricas } from "../services/estadisticasService";
import { INFORME } from "../contenido/informe";
import { mesActual, rangoDeMes } from "../services/periodos";
import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  formatearFecha,
  formatearFechaHora,
  formatearNumero,
} from "../services/reglas";
import { interpolar } from "../services/texto";
import GraficoBarras from "../components/GraficoBarras.vue";
import GraficoLineas from "../components/GraficoLineas.vue";

const mes = ref(mesActual());
const metricas = ref(null);
const cargando = ref(true);
const error = ref("");

const rango = computed(() => rangoDeMes(mes.value));
const etiquetaPeriodo = computed(() => rango.value.etiqueta);

const textos = computed(
  () =>
    INFORME.interpretaciones[mes.value] ?? INFORME.interpretacionPorDefecto,
);

const valores = computed(() => {
  const m = metricas.value;
  if (!m) return {};
  const topCategoria = m.porCategoria[0];
  const topUbicacion = m.porUbicacion[0];
  const numero = (valor) =>
    valor === null || valor === undefined ? "sin datos" : formatearNumero(valor);

  return {
    periodo: etiquetaPeriodo.value,
    total: m.total,
    resueltos: m.resueltos,
    pctResueltos: numero(m.pctResueltos),
    pctEnPlazo: numero(m.pctEnPlazo),
    tiempoPromedio: numero(m.tiempoPromedioDias),
    mediana: numero(m.tiempoMedianaDias),
    backlog: m.backlog,
    vencidos: m.vencidos,
    categoriaTop: topCategoria?.nombre ?? "sin datos",
    categoriaTopPct: numero(topCategoria?.porcentaje),
    categoriaTopTotal: topCategoria?.total ?? 0,
    ubicacionTop: topUbicacion?.nombre ?? "sin datos",
    ubicacionTopTotal: topUbicacion?.total ?? 0,
  };
});

function texto(cadena) {
  return interpolar(cadena, valores.value);
}

function estadoCumplimiento(valor, tipo, meta) {
  if (valor === null || valor === undefined) return "sin-dato";
  const cumple = tipo === "min" ? valor >= meta : valor <= meta;
  return cumple ? "cumple" : "no-cumple";
}

const ETIQUETAS_CUMPLIMIENTO = {
  cumple: "Cumple",
  "no-cumple": "No cumple",
  "sin-dato": "No calculable",
};

const filasKpi = computed(() => {
  const m = metricas.value;
  if (!m) return [];
  const pct = (valor) =>
    valor === null || valor === undefined
      ? "No calculable"
      : `${formatearNumero(valor)} %`;

  return [
    {
      indicador: "Reportes resueltos",
      meta: "≥ 80 %",
      resultado: pct(m.pctResueltos),
      cumplimiento: estadoCumplimiento(m.pctResueltos, "min", 80),
      base: `${m.pctResueltosBase} reportes no cancelados`,
    },
    {
      indicador: "Resueltos dentro del plazo",
      meta: "≥ 90 %",
      resultado: pct(m.pctEnPlazo),
      cumplimiento: estadoCumplimiento(m.pctEnPlazo, "min", 90),
      base: `${m.pctEnPlazoBase} reportes resueltos`,
    },
    {
      indicador: "Tiempo promedio de resolución",
      meta: "≤ 5 días",
      resultado:
        m.tiempoPromedioDias === null
          ? "No calculable"
          : `${formatearNumero(m.tiempoPromedioDias)} días`,
      cumplimiento: estadoCumplimiento(m.tiempoPromedioDias, "max", 5),
      base: m.muestraTiempos
        ? `Mediana ${formatearNumero(m.tiempoMedianaDias)} días · ${m.muestraTiempos} resoluciones`
        : "Sin resoluciones en el período",
    },
    {
      indicador: "Reportes abiertos al cierre",
      meta: "≤ 10",
      resultado: String(m.backlog),
      cumplimiento: estadoCumplimiento(m.backlog, "max", 10),
      base: `${m.porEstado.pendiente} pendientes + ${m.porEstado.en_revision} en revisión`,
    },
    {
      indicador: "Reportes vencidos",
      meta: "0",
      resultado: String(m.vencidos),
      cumplimiento: m.vencidos === 0 ? "cumple" : "no-cumple",
      base: "Abiertos que superaron el plazo de su prioridad",
    },
  ];
});

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    metricas.value = await obtenerMetricas({
      desde: rango.value.desde,
      hasta: rango.value.hasta,
    });
  } catch (e) {
    error.value = "No se pudo generar el informe: " + e.message;
  } finally {
    cargando.value = false;
  }
}

function imprimir() {
  window.print();
}

watch(mes, cargar);

watch(
  etiquetaPeriodo,
  (valor) => {

    document.title = `Informe Gestia ${valor}`;
  },
  { immediate: true },
);

onMounted(cargar);
</script>

<template>
  <div class="informe">
    <header class="page-header no-print">
      <div>
        <h1>Informe de seguimiento</h1>
        <p class="page-header__sub">
          Explica el desempeño del servicio en un período, no la consulta rápida.
        </p>
      </div>
      <div class="page-header__acciones">
        <div class="field campo-mes">
          <label for="mes">Período</label>
          <input id="mes" v-model="mes" type="month" />
        </div>
        <button :disabled="cargando || !metricas" @click="imprimir">
          Imprimir / Guardar PDF
        </button>
      </div>
    </header>

    <p class="no-print nota-impresion">
      En el diálogo de impresión elegí <strong>Guardar como PDF</strong>. El archivo
      se nombra con el período del informe.
    </p>

    <div v-if="error" class="alert error" role="alert">{{ error }}</div>

    <template v-if="cargando && !metricas">
      <div class="skeleton skeleton--chart" style="margin-bottom: 1rem"></div>
      <div class="skeleton skeleton--chart"></div>
    </template>

    <template v-else-if="metricas">
      <section class="card reporte-portada">
        <p class="reporte-entidad">{{ INFORME.entidad }}</p>
        <h1 class="reporte-titulo">{{ INFORME.titulo }}</h1>
        <p class="reporte-periodo">Período: <strong>{{ etiquetaPeriodo }}</strong></p>
        <p class="reporte-emitido">
          Emitido el {{ formatearFechaHora(metricas.actualizadoEn) }} · Sistema Gestia
        </p>
      </section>

      <section class="card">
        <h2 class="titulo-seccion">1. Datos del informe</h2>
        <dl class="datos">
          <dt>Propósito</dt>
          <dd>{{ INFORME.proposito }}</dd>
          <dt>Destinatarios</dt>
          <dd>{{ INFORME.destinatarios }}</dd>
          <dt>Frecuencia</dt>
          <dd>{{ INFORME.frecuencia }}</dd>
          <dt>Quién puede consultarlo</dt>
          <dd>{{ INFORME.consulta }}</dd>
          <dt>Objetivo del servicio</dt>
          <dd>{{ INFORME.objetivo }}</dd>
          <dt>Fuente de datos</dt>
          <dd>{{ INFORME.fuenteDatos }}</dd>
        </dl>
      </section>

      <section class="card">
        <h2 class="titulo-seccion">2. Indicadores del período</h2>
        <p v-if="!metricas.hayDatos" class="alerta-vacio">
          No hay reportes registrados en {{ etiquetaPeriodo }}. No se muestran
          indicadores en cero porque no habría datos para calcularlos; elegí otro
          período para ver resultados.
        </p>
        <template v-else>
          <div class="tabla-scroll">
            <table class="tabla-informe">
              <thead>
                <tr>
                  <th scope="col">Indicador</th>
                  <th scope="col">Meta</th>
                  <th scope="col">Resultado</th>
                  <th scope="col">Cumplimiento</th>
                  <th scope="col">Base / detalle</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fila in filasKpi" :key="fila.indicador">
                  <td>{{ fila.indicador }}</td>
                  <td class="num">{{ fila.meta }}</td>
                  <td class="num">{{ fila.resultado }}</td>
                  <td>
                    <span class="estado-cumplimiento" :class="fila.cumplimiento">
                      {{ ETIQUETAS_CUMPLIMIENTO[fila.cumplimiento] }}
                    </span>
                  </td>
                  <td class="detalle">{{ fila.base }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="subtitulo">Metodología de cálculo</h3>
          <ul class="lista">
            <li v-for="linea in INFORME.metodologia" :key="linea">{{ linea }}</li>
          </ul>
        </template>
      </section>

      <div v-if="metricas.hayDatos" class="chart-grid">
        <GraficoBarras
          titulo="Demanda por tipo de problema"
          :subtitulo="`${etiquetaPeriodo} · ${metricas.total} reportes`"
          :datos="metricas.porCategoria"
          :nota="`Porcentaje calculado sobre ${metricas.total} reportes del período.`"
        />

        <GraficoLineas
          titulo="Creados y resueltos por mes"
          :subtitulo="etiquetaPeriodo"
          :datos="metricas.serieMensual"
          nota="Los resueltos se cuentan por mes de cierre; un reporte creado en un mes puede resolverse en otro."
        />
      </div>

      <section v-if="metricas.hayDatos" class="card">
        <h2 class="titulo-seccion">3. Detalle de reportes del período</h2>
        <div class="tabla-scroll">
          <table class="tabla-informe tabla-reportes">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Fecha</th>
                <th scope="col">Problema</th>
                <th scope="col">Ubicación</th>
                <th scope="col">Tipo</th>
                <th scope="col">Prioridad</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reporte in metricas.reportes" :key="reporte.id">
                <td class="num">{{ reporte.id }}</td>
                <td>{{ formatearFecha(reporte.created_at) }}</td>
                <td>{{ reporte.titulo }}</td>
                <td>{{ reporte.ubicaciones?.nombre }}</td>
                <td>{{ reporte.categorias?.nombre }}</td>
                <td>
                  <span class="prioridad-texto" :class="reporte.prioridad">
                    {{ ETIQUETAS_PRIORIDAD[reporte.prioridad] || reporte.prioridad }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="reporte.estado">
                    {{ ETIQUETAS_ESTADO[reporte.estado] || reporte.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="metricas.hayDatos" class="card page-break">
        <h2 class="titulo-seccion">4. Interpretación de resultados</h2>
        <p class="parrafo">{{ texto(textos.resumen) }}</p>

        <h3 class="subtitulo">Metas cumplidas y resultados</h3>
        <ul class="lista">
          <li v-for="linea in textos.metas" :key="linea">{{ texto(linea) }}</li>
        </ul>

        <h3 class="subtitulo">Dificultades</h3>
        <ul class="lista">
          <li v-for="linea in textos.dificultades" :key="linea">{{ texto(linea) }}</li>
        </ul>

        <h3 class="subtitulo">Patrones observados</h3>
        <ul class="lista">
          <li v-for="linea in textos.patrones" :key="linea">{{ texto(linea) }}</li>
        </ul>

        <h3 class="subtitulo">Conclusiones que necesitan más información</h3>
        <ul class="lista">
          <li v-for="linea in textos.pendientes" :key="linea">{{ texto(linea) }}</li>
        </ul>

        <h3 class="subtitulo">Acciones de mejora propuestas</h3>
        <ol class="acciones">
          <li v-for="accion in textos.acciones" :key="accion.titulo" class="accion">
            <p class="accion__titulo">{{ accion.titulo }}</p>
            <p class="accion__detalle">{{ texto(accion.fundamento) }}</p>
            <p class="accion__meta">
              Responsable: {{ accion.responsable }} · Plazo: {{ accion.plazo }}
            </p>
          </li>
        </ol>
      </section>

      <footer class="card reporte-pie">
        <p>
          <strong>Fuente:</strong> sistema Gestia · datos de Supabase · período
          {{ etiquetaPeriodo }}.
        </p>
        <p>
          Documento generado el {{ formatearFechaHora(metricas.actualizadoEn) }}.
          Puede consultarse desde el sistema y archivarse como PDF.
        </p>
        <p class="solo-impresion">
          Copia impresa del sistema Gestia correspondiente al período
          {{ etiquetaPeriodo }}. No reemplaza el registro original de cada reporte.
        </p>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.informe {
  max-width: 860px;
  margin: 0 auto;
}

.campo-mes {
  margin-bottom: 0;
  width: 170px;
}

.campo-mes label {
  font-size: 0.8rem;
}

.nota-impresion {
  margin: -0.5rem 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.reporte-portada {
  border-top: 4px solid var(--color-primary);
}

.reporte-entidad {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.reporte-titulo {
  margin: 0.4rem 0;
  font-size: 1.6rem;
  line-height: 1.25;
}

.reporte-periodo {
  margin: 0;
  font-size: 1.05rem;
}

.reporte-emitido {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.titulo-seccion {
  margin: 0 0 0.85rem;
  font-size: 1.15rem;
}

.subtitulo {
  margin: 1.2rem 0 0.4rem;
  font-size: 0.95rem;
}

.tabla-scroll {
  overflow-x: auto;
}

.tabla-informe {
  min-width: 520px;
}

.tabla-informe td,
.tabla-informe th {
  vertical-align: top;
}

.tabla-informe .num {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tabla-informe .detalle {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.estado-cumplimiento {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.estado-cumplimiento.cumple { background: #15803d; }
.estado-cumplimiento.no-cumple { background: #b91c1c; }
.estado-cumplimiento.sin-dato { background: #4b5563; }

.prioridad-texto {
  font-size: 0.82rem;
  font-weight: 600;
}

.prioridad-texto.urgente { color: #b91c1c; }
.prioridad-texto.normal { color: #1d4ed8; }
.prioridad-texto.baja { color: var(--color-text-muted); }

.lista {
  margin: 0;
  padding-left: 1.15rem;
  font-size: 0.9rem;
  line-height: 1.55;
}

.lista li + li {
  margin-top: 0.35rem;
}

.parrafo {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.acciones {
  margin: 0;
  padding-left: 1.15rem;
}

.accion + .accion {
  margin-top: 0.9rem;
}

.accion__titulo {
  margin: 0;
  font-weight: 700;
}

.accion__detalle {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.accion__meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.alerta-vacio {
  margin: 0;
  padding: 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.reporte-pie {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.reporte-pie p {
  margin: 0.2rem 0;
}

@media (max-width: 640px) {
  .datos {
    grid-template-columns: 1fr;
  }
  .datos dd {
    margin-bottom: 0.5rem;
  }
}
</style>
