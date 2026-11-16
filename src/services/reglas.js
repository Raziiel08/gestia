export const ESTADOS = ["pendiente", "en_revision", "resuelto", "cancelado"];

export const ETIQUETAS_ESTADO = Object.freeze({
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
  cancelado: "Cancelado",
});

export const ROLES = ["estudiante_docente", "tecnico", "administrador"];

export const ETIQUETAS_ROL = Object.freeze({
  estudiante_docente: "Estudiante / Docente",
  tecnico: "Técnico",
  administrador: "Administrador",
});

export const PRIORIDADES = ["baja", "normal", "urgente"];

export const ETIQUETAS_PRIORIDAD = Object.freeze({
  baja: "Baja",
  normal: "Normal",
  urgente: "Urgente",
});

export const PLAZOS_DIAS = Object.freeze({
  urgente: 2,
  normal: 7,
  baja: 15,
});

export function plazoDias(prioridad) {
  return PLAZOS_DIAS[prioridad] ?? PLAZOS_DIAS.normal;
}

const FECHA = new Intl.DateTimeFormat("es-AR", { dateStyle: "short" });
const FECHA_HORA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const NUMERO = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 1,
});

export function aFechaLocal(valor) {
  if (valor instanceof Date) return valor;
  const texto = String(valor);
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (soloFecha) {
    return new Date(
      Number(soloFecha[1]),
      Number(soloFecha[2]) - 1,
      Number(soloFecha[3]),
    );
  }
  return new Date(texto);
}

export function formatearFecha(iso) {
  if (!iso) return "—";
  return FECHA.format(aFechaLocal(iso));
}

export function formatearFechaHora(iso) {
  if (!iso) return "—";
  return FECHA_HORA.format(aFechaLocal(iso));
}

export function formatearNumero(valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return NUMERO.format(valor);
}

export function formatearPeriodo({ desde, hasta } = {}) {
  if (!desde && !hasta) return "Todo el historial";
  if (desde && hasta) return `${formatearFecha(desde)} al ${formatearFecha(hasta)}`;
  return desde ? `Desde ${formatearFecha(desde)}` : `Hasta ${formatearFecha(hasta)}`;
}
