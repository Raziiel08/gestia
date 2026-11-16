export const PERIODOS = Object.freeze([
  { valor: "mes_actual", etiqueta: "Mes actual" },
  { valor: "mes_anterior", etiqueta: "Mes anterior" },
  { valor: "ultimos_30", etiqueta: "Últimos 30 días" },
  { valor: "ultimos_90", etiqueta: "Últimos 90 días" },
  { valor: "anio_actual", etiqueta: "Año actual" },
  { valor: "todo", etiqueta: "Todo el historial" },
]);

function aIso(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function hoyLocal() {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

export function resolverPeriodo(valor, referencia = new Date()) {
  const hoy = new Date(referencia);
  hoy.setHours(0, 0, 0, 0);

  switch (valor) {
    case "mes_actual":
      return {
        desde: aIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        hasta: aIso(hoy),
        etiqueta: "Mes actual",
      };
    case "mes_anterior":
      return {
        desde: aIso(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
        hasta: aIso(new Date(hoy.getFullYear(), hoy.getMonth(), 0)),
        etiqueta: "Mes anterior",
      };
    case "ultimos_30": {
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - 29);
      return { desde: aIso(desde), hasta: aIso(hoy), etiqueta: "Últimos 30 días" };
    }
    case "ultimos_90": {
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - 89);
      return { desde: aIso(desde), hasta: aIso(hoy), etiqueta: "Últimos 90 días" };
    }
    case "anio_actual":
      return {
        desde: `${hoy.getFullYear()}-01-01`,
        hasta: aIso(hoy),
        etiqueta: "Año actual",
      };
    default:
      return { desde: null, hasta: null, etiqueta: "Todo el historial" };
  }
}

export function mesActual() {
  const hoy = hoyLocal();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

export function rangoDeMes(clave) {
  const [anio, mes] = String(clave).split("-").map(Number);
  return {
    desde: aIso(new Date(anio, mes - 1, 1)),
    hasta: aIso(new Date(anio, mes, 0)),
    etiqueta: new Date(anio, mes - 1, 1)
      .toLocaleDateString("es-AR", { month: "long", year: "numeric" })
      .replace(/^./, (letra) => letra.toUpperCase()),
  };
}
