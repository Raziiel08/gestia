<script setup>
import { computed } from "vue";
import { COLORES_SERIE } from "../lib/charts";
import { usarGrafico } from "../lib/usarGrafico";

const props = defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: "" },
  nota: { type: String, default: "" },
  datos: { type: Array, default: () => [] },
});

const canvas = usarGrafico(configurar, () => props.datos);

const etiquetaAccesible = computed(() => {
  if (!props.datos.length) return props.titulo;
  const detalle = props.datos
    .map((fila) => `${fila.etiqueta}: ${fila.creados} creados, ${fila.resueltos} resueltos`)
    .join("; ");
  return `${props.titulo}. ${detalle}.`;
});

function configurar() {
  return {
    type: "line",
    data: {
      labels: props.datos.map((fila) => fila.etiqueta),
      datasets: [
        {
          label: "Creados",
          data: props.datos.map((fila) => fila.creados),
          borderColor: COLORES_SERIE.creados,
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          pointBackgroundColor: COLORES_SERIE.creados,
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: "Resueltos",
          data: props.datos.map((fila) => fila.resueltos),
          borderColor: COLORES_SERIE.resueltos,
          backgroundColor: "rgba(21, 128, 61, 0.12)",
          pointBackgroundColor: COLORES_SERIE.resueltos,
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, boxHeight: 12 } },
      },
      scales: {
        x: { grid: { display: false }, title: { display: true, text: "Mes" } },
        y: {
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
    <div v-else class="chart-card__lienzo">
      <canvas ref="canvas" role="img" :aria-label="etiquetaAccesible"></canvas>
    </div>

    <p v-if="nota" class="chart-card__nota">{{ nota }}</p>
  </section>
</template>
