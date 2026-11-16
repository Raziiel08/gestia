<script setup>
import { computed } from "vue";
import { usarGrafico } from "../lib/usarGrafico";

const props = defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: "" },
  nota: { type: String, default: "" },
  datos: { type: Array, default: () => [] },
});

const canvas = usarGrafico(configurar, () => props.datos);

const altura = computed(() =>
  Math.max(220, props.datos.length * 36 + 40),
);

const etiquetaAccesible = computed(() => {
  if (!props.datos.length) return props.titulo;
  const detalle = props.datos
    .map((fila) => `${fila.nombre}: ${fila.total} reportes`)
    .join("; ");
  return `${props.titulo}. ${detalle}.`;
});

const porcentajes = computed(() => props.datos.map((fila) => fila.porcentaje));

function configurar() {
  return {
    type: "bar",
    data: {
      labels: props.datos.map((fila) => fila.nombre),
      datasets: [
        {
          label: "Reportes",
          data: props.datos.map((fila) => fila.total),
          backgroundColor: "#2563eb",
          borderRadius: 4,
          maxBarThickness: 24,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (contexto) => {
              const total = contexto.raw;
              const pct = porcentajes.value[contexto.dataIndex];
              return `${total} reportes (${pct} % del total)`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 },
          title: { display: true, text: "Cantidad de reportes" },
        },
        y: { grid: { display: false } },
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
