<script setup>
import { computed } from "vue";
import { COLORES_ESTADO } from "../lib/charts";
import { ESTADOS, ETIQUETAS_ESTADO } from "../services/reglas.js";
import { usarGrafico } from "../lib/usarGrafico";

const props = defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: "" },
  nota: { type: String, default: "" },
  datos: { type: Array, default: () => [] },
});

const canvas = usarGrafico(configurar, () => props.datos);

const altura = computed(() => Math.max(240, props.datos.length * 38 + 60));

const etiquetaAccesible = computed(() => {
  if (!props.datos.length) return props.titulo;
  const detalle = props.datos
    .map(
      (fila) =>
        `${fila.nombre}: ${fila.total} en total, ${fila.pendiente} pendientes, ` +
        `${fila.en_revision} en revisión, ${fila.resuelto} resueltos`,
    )
    .join("; ");
  return `${props.titulo}. ${detalle}.`;
});

function configurar() {
  return {
    type: "bar",
    data: {
      labels: props.datos.map((fila) => fila.nombre),
      datasets: ESTADOS.map((estado) => ({
        label: ETIQUETAS_ESTADO[estado],
        data: props.datos.map((fila) => fila[estado]),
        backgroundColor: COLORES_ESTADO[estado],
        stack: "estado",
        maxBarThickness: 28,
        borderRadius: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, boxHeight: 12 } },
        tooltip: {
          callbacks: {
            label: (contexto) =>
              `${contexto.dataset.label}: ${contexto.raw} reportes`,
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { precision: 0 },
          title: { display: true, text: "Cantidad de reportes" },
        },
      },
    },
  };
}

</script>

<template>
  <section class="card chart-card">
    <header class="chart-card__head">
      <h2 class="chart-card__titulo">{{ titulo }}</h2>
      <p v-if="subtitulo" class="chart-card__subtitulo">{{ subtitulo }}</p>
    </header>

    <p v-if="!datos.length" class="chart-card__vacio">
      Sin datos para el período seleccionado.
    </p>
    <div v-else class="chart-card__lienzo" :style="{ height: altura + 'px' }">
      <canvas ref="canvas" role="img" :aria-label="etiquetaAccesible"></canvas>
    </div>

    <p v-if="nota" class="chart-card__nota">{{ nota }}</p>
  </section>
</template>
