<script setup>
import { computed } from "vue";

const props = defineProps({
  titulo: { type: String, required: true },

  valor: { type: [String, Number], default: null },
  unidad: { type: String, default: "" },

  meta: { type: String, default: "" },

  detalle: { type: String, default: "" },

  explicacion: { type: String, default: "" },
  estado: {
    type: String,
    default: "neutral",
    validator: (valor) =>
      ["ok", "alerta", "sin-datos", "neutral"].includes(valor),
  },
});

const calculable = computed(
  () => props.valor !== null && props.valor !== undefined && props.valor !== "",
);
</script>

<template>
  <article class="stat-card" :class="estado">
    <p class="stat-card__titulo">{{ titulo }}</p>

    <p class="stat-card__valor">
      <template v-if="calculable">
        {{ valor }}<span v-if="unidad" class="stat-card__unidad">{{ unidad }}</span>
      </template>
      <span v-else class="stat-card__sin-dato">No calculable</span>
    </p>

    <p v-if="!calculable && explicacion" class="stat-card__explicacion">
      {{ explicacion }}
    </p>
    <p v-else-if="meta" class="stat-card__meta">{{ meta }}</p>

    <p v-if="detalle" class="stat-card__detalle">{{ detalle }}</p>
  </article>
</template>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.stat-card.ok { border-top-color: var(--color-resolved); }
.stat-card.alerta { border-top-color: var(--color-pending); }
.stat-card.sin-datos { border-top-color: var(--color-cancelled); }

.stat-card__titulo {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.stat-card__valor {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.stat-card__unidad {
  font-size: 0.95rem;
  font-weight: 600;
  margin-left: 0.15rem;
  color: var(--color-text-muted);
}

.stat-card__sin-dato {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.stat-card__meta,
.stat-card__detalle,
.stat-card__explicacion {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-muted);
}

.stat-card__explicacion {
  font-style: italic;
}
</style>
