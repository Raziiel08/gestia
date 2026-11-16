<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { authStore } from "../services/authStore";
import {
  obtenerReporte,
  listarHistorial,
  cambiarEstadoReporte,
} from "../services/reportesService";
import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  ESTADOS,
  plazoDias,
  formatearFechaHora,
} from "../services/reglas";

const route = useRoute();

const reporte = ref(null);
const historial = ref([]);
const cargando = ref(true);
const error = ref("");
const errorGestion = ref("");
const exito = ref("");
const guardando = ref(false);

const nuevoEstado = ref("");
const comentario = ref("");
const demoroMateriales = ref(false);
const calificacion = ref(null);

const rol = computed(() => authStore.state.perfil?.rol);
const puedeCambiarEstado = computed(() =>
  ["tecnico", "administrador"].includes(rol.value),
);

const abierto = computed(
  () =>
    reporte.value &&
    reporte.value.estado !== "resuelto" &&
    reporte.value.estado !== "cancelado",
);

const diasAbierto = computed(() => {
  if (!abierto.value) return null;
  const dias = (Date.now() - new Date(reporte.value.created_at)) / 86400000;
  return Math.max(0, Math.floor(dias));
});

const vencido = computed(
  () => abierto.value && diasAbierto.value > plazoDias(reporte.value.prioridad),
);

const sinCambios = computed(
  () => Boolean(reporte.value) && nuevoEstado.value === reporte.value.estado,
);

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    reporte.value = await obtenerReporte(route.params.id);
    historial.value = await listarHistorial(route.params.id);
    nuevoEstado.value = reporte.value.estado;
  } catch (e) {
    error.value = "No se pudo cargar el reporte: " + e.message;
  } finally {
    cargando.value = false;
  }
}

onMounted(cargar);

watch(nuevoEstado, () => {
  errorGestion.value = "";
  exito.value = "";
  demoroMateriales.value = false;
  const sel = document.querySelector("#calificacion");
  if (sel) sel.value = "";
});

async function guardarCambioEstado() {
  if (sinCambios.value) return;
  guardando.value = true;
  errorGestion.value = "";
  exito.value = "";
  try {
    await cambiarEstadoReporte({
      reporteId: reporte.value.id,
      estadoNuevo: nuevoEstado.value,
      userId: authStore.state.user.id,
      comentario: comentario.value.trim() || null,

      tecnicoId:
        rol.value === "tecnico" && !reporte.value.tecnico
          ? authStore.state.user.id
          : undefined,
      demoroMateriales:
        nuevoEstado.value === "resuelto"
          ? !!document.querySelector('input[type="checkbox"]')?.checked
          : null,
      calificacion:
        nuevoEstado.value === "resuelto"
          ? Number(document.querySelector("#calificacion")?.value) || null
          : null,
    });
    comentario.value = "";
    demoroMateriales.value = false;
    calificacion.value = null;
    await cargar();
    nuevoEstado.value = reporte.value.estado;
    exito.value = "Estado actualizado y registrado en el historial.";
  } catch (e) {
    errorGestion.value = "No se pudo actualizar el estado: " + e.message;
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <div>
    <div v-if="cargando">
      <div
        class="skeleton"
        style="height: 2.5rem; width: 40%; margin-bottom: 1rem"
      ></div>
      <div class="skeleton skeleton--chart"></div>
    </div>

    <div v-else-if="error" class="alert error" role="alert">
      {{ error }}
      <RouterLink
        to="/reportes"
        class="btn btn--ghost btn--sm"
        style="margin-left: 0.5rem"
      >
        Volver a reportes
      </RouterLink>
    </div>

    <template v-else-if="reporte">
      <RouterLink to="/reportes" class="back-link">← Reportes</RouterLink>

      <header class="page-header">
        <div>
          <h1>{{ reporte.titulo }}</h1>
          <p class="page-header__sub">
            Reporte #{{ reporte.id }} · {{ reporte.ubicaciones?.nombre }} ·
            {{ reporte.categorias?.nombre }} ·
            {{ formatearFechaHora(reporte.created_at) }}
          </p>
        </div>

        <div class="page-header__acciones">
          <span class="badge" :class="reporte.estado">
            {{ ETIQUETAS_ESTADO[reporte.estado] }}
          </span>
          <span class="badge prioridad" :class="reporte.prioridad">
            {{ ETIQUETAS_PRIORIDAD[reporte.prioridad] }}
          </span>
          <span v-if="vencido" class="badge urgente">Fuera de plazo</span>
        </div>
      </header>

      <div class="detalle-grid">
        <div>
          <section class="card">
            <h2>Descripción</h2>
            <p style="white-space: pre-line">{{ reporte.descripcion }}</p>
          </section>

          <section class="card">
            <header class="card__head">
              <h2>Historial</h2>
              <span class="hint">{{ historial.length }} movimientos</span>
            </header>

            <p
              v-if="historial.length === 0"
              class="empty"
              style="padding: 1rem"
            >
              Todavía no hay movimientos registrados.
            </p>

            <ol v-else class="timeline">
              <li
                v-for="movimiento in historial"
                :key="movimiento.id"
                class="timeline__item"
                :class="movimiento.estado_nuevo"
              >
                <div class="timeline__meta">
                  <span>{{ formatearFechaHora(movimiento.created_at) }}</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ movimiento.autor?.nombre || "Sistema" }}</span>
                </div>
                <p class="timeline__title">
                  {{ ETIQUETAS_ESTADO[movimiento.estado_nuevo] }}
                </p>
                <p v-if="movimiento.comentario" class="timeline__text">
                  {{ movimiento.comentario }}
                </p>
              </li>
            </ol>
          </section>
        </div>

        <aside>
          <section v-if="puedeCambiarEstado" class="card">
            <h2>Gestión</h2>

            <div v-if="exito" class="alert success" role="status">
              {{ exito }}
            </div>
            <div v-if="errorGestion" class="alert error" role="alert">
              {{ errorGestion }}
            </div>

            <div class="field">
              <label for="estado">Estado</label>
              <select id="estado" v-model="nuevoEstado">
                <option v-for="estado in ESTADOS" :key="estado" :value="estado">
                  {{ ETIQUETAS_ESTADO[estado] }}
                </option>
              </select>
            </div>

            <div class="field">
              <label for="comentario">Comentario</label>
              <textarea
                id="comentario"
                v-model="comentario"
                rows="3"
                placeholder="Qué se hizo o qué falta"
              ></textarea>
              <span class="hint"
                >Queda registrado en el historial del reporte.</span
              >
            </div>

            <div
              v-if="nuevoEstado === 'resuelto'"
              class="field"
            >
              <label>
                <input
                  v-model="demoroMateriales"
                  type="checkbox"
                />
                Demoró por falta de materiales
              </label>
            </div>

            <div
              v-if="nuevoEstado === 'resuelto'"
              class="field"
            >
              <label for="calificacion">Calificación del arreglo (1 a 5)</label>
              <select id="calificacion">
                <option :value="null">Sin calificar</option>
                <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>

            <button
              :disabled="guardando || sinCambios"
              @click="guardarCambioEstado"
            >
              {{ guardando ? "Guardando..." : "Guardar cambio" }}
            </button>

            <p v-if="sinCambios" class="hint" style="margin-bottom: 0">
              Elegí otro estado para habilitar el guardado.
            </p>
          </section>

          <section class="card">
            <h2>Ficha del reporte</h2>
            <dl class="datos">
              <dt>Lugar</dt>
              <dd>{{ reporte.ubicaciones?.nombre }}</dd>

              <dt>Tipo</dt>
              <dd>{{ reporte.categorias?.nombre }}</dd>

              <dt>Prioridad</dt>
              <dd>
                {{ ETIQUETAS_PRIORIDAD[reporte.prioridad] }} ·
                {{ plazoDias(reporte.prioridad) }} días de plazo
              </dd>

              <dt>Reportó</dt>
              <dd>{{ reporte.autor?.nombre || "—" }}</dd>

              <dt>Técnico</dt>
              <dd>{{ reporte.tecnico?.nombre || "Sin asignar" }}</dd>

              <dt>Creado</dt>
              <dd>{{ formatearFechaHora(reporte.created_at) }}</dd>

              <template v-if="reporte.resuelto_at">
                <dt>Resuelto</dt>
                <dd>{{ formatearFechaHora(reporte.resuelto_at) }}</dd>
              </template>

              <template v-else-if="abierto">
                <dt>Abierto</dt>
                <dd>{{ diasAbierto }} días</dd>
              </template>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
