import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

Chart.defaults.font.family =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = "#5c6b7a";
Chart.defaults.borderColor = "rgba(221, 226, 231, 0.9)";

export const COLORES_ESTADO = Object.freeze({
  pendiente: "#b45309",
  en_revision: "#1d4ed8",
  resuelto: "#15803d",
  cancelado: "#4b5563",
});

export const COLORES_SERIE = Object.freeze({
  creados: "#2563eb",
  resueltos: "#15803d",
});

export { Chart };
