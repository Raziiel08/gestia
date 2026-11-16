import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Chart } from "./charts";

export function usarGrafico(configurar, obtenerDatos) {
  const lienzo = ref(null);
  let grafico = null;

  function renderizar() {
    if (!lienzo.value) {
      grafico?.destroy();
      grafico = null;
      return;
    }
    grafico?.destroy();
    grafico = new Chart(lienzo.value, configurar());
  }

  onMounted(renderizar);
  watch(obtenerDatos, renderizar, { deep: true, flush: "post" });
  onBeforeUnmount(() => {
    grafico?.destroy();
    grafico = null;
  });

  return lienzo;
}
