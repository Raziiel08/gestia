import { plazoDias } from "./reglas.js";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function diasEntre(desdeIso, hastaIso) {
  return (new Date(hastaIso) - new Date(desdeIso)) / MS_POR_DIA;
}

function redondear(valor, decimales = 1) {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function porcentaje(parte, total) {
  if (!total) return null;
  return redondear((parte / total) * 100);
}

function mediana(valores) {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2
    ? orden[medio]
    : (orden[medio - 1] + orden[medio]) / 2;
}

function claveMes(iso) {
  const fecha = new Date(iso);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function etiquetaMes(clave) {
  const [anio, mes] = clave.split("-").map(Number);
  return new Date(anio, mes - 1, 1)
    .toLocaleDateString("es-AR", { month: "short", year: "numeric" })
    .replace(".", "");
}

export function calcularMetricas(
  reportes,
  { desde = null, hasta = null, ubicacionId = null, categoriaId = null } = {},
) {
  const lista = reportes ?? [];
  const total = lista.length;

  const porEstado = {
    pendiente: 0,
    en_revision: 0,
    resuelto: 0,
    cancelado: 0,
  };
  const porPrioridad = { baja: 0, normal: 0, urgente: 0 };

  for (const reporte of lista) {
    if (reporte.estado in porEstado) porEstado[reporte.estado] += 1;
    const prioridad = reporte.prioridad in porPrioridad ? reporte.prioridad : "normal";
    porPrioridad[prioridad] += 1;
  }

  const totalValidos = total - porEstado.cancelado;
  const resueltos = porEstado.resuelto;
  const backlog = porEstado.pendiente + porEstado.en_revision;

  const tiempos = lista
    .filter((reporte) => reporte.resuelto_at)
    .map((reporte) => diasEntre(reporte.created_at, reporte.resuelto_at))
    .filter((dias) => Number.isFinite(dias) && dias >= 0);

  const tiempoPromedioDias = tiempos.length
    ? redondear(tiempos.reduce((suma, dias) => suma + dias, 0) / tiempos.length)
    : null;
  const tiempoMedianaDias = tiempos.length ? redondear(mediana(tiempos)) : null;

  const conPlazo = lista.filter((reporte) => reporte.resuelto_at);
  const enPlazo = conPlazo.filter(
    (reporte) =>
      diasEntre(reporte.created_at, reporte.resuelto_at) <=
      plazoDias(reporte.prioridad),
  );

  const ahora = new Date();
  const vencidos = lista.filter(
    (reporte) =>
      reporte.estado !== "resuelto" &&
      reporte.estado !== "cancelado" &&
      diasEntre(reporte.created_at, ahora) > plazoDias(reporte.prioridad),
  ).length;

  const meses = new Map();
  const asegurarMes = (clave) => {
    if (!meses.has(clave)) {
      meses.set(clave, {
        mes: clave,
        etiqueta: etiquetaMes(clave),
        creados: 0,
        resueltos: 0,
      });
    }
    return meses.get(clave);
  };

  for (const reporte of lista) {
    asegurarMes(claveMes(reporte.created_at)).creados += 1;
    if (reporte.resuelto_at) {
      asegurarMes(claveMes(reporte.resuelto_at)).resueltos += 1;
    }
  }

  const serieMensual = [...meses.values()].sort((a, b) =>
    a.mes.localeCompare(b.mes),
  );

  const categorias = new Map();
  for (const reporte of lista) {
    const id = reporte.categoria_id;
    const nombre = reporte.categorias?.nombre ?? "Sin categoría";
    if (!categorias.has(id)) {
      categorias.set(id, { categoriaId: id, nombre, total: 0 });
    }
    categorias.get(id).total += 1;
  }
  const porCategoria = [...categorias.values()]
    .map((fila) => ({ ...fila, porcentaje: porcentaje(fila.total, total) }))
    .sort((a, b) => b.total - a.total);

  const ubicaciones = new Map();
  for (const reporte of lista) {
    const id = reporte.ubicacion_id;
    const nombre = reporte.ubicaciones?.nombre ?? "Sin ubicación";
    if (!ubicaciones.has(id)) {
      ubicaciones.set(id, {
        ubicacionId: id,
        nombre,
        total: 0,
        pendiente: 0,
        en_revision: 0,
        resuelto: 0,
        cancelado: 0,
      });
    }
    const fila = ubicaciones.get(id);
    fila.total += 1;
    if (reporte.estado in fila) fila[reporte.estado] += 1;
  }
  const porUbicacion = [...ubicaciones.values()].sort((a, b) => b.total - a.total);

  const reportesOrdenados = [...lista].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  return {
    rango: { desde, hasta },
    filtros: { ubicacionId, categoriaId },
    actualizadoEn: new Date().toISOString(),
    hayDatos: total > 0,

    total,
    totalValidos,
    porEstado,
    porPrioridad,
    resueltos,
    backlog,
    vencidos,
    reportes: reportesOrdenados,

    pctResueltos: porcentaje(resueltos, totalValidos),
    pctResueltosBase: totalValidos,

    tiempoPromedioDias,
    tiempoMedianaDias,
    muestraTiempos: tiempos.length,

    pctEnPlazo: porcentaje(enPlazo.length, conPlazo.length),
    pctEnPlazoBase: conPlazo.length,

    serieMensual,
    porCategoria,
    porUbicacion,
  };
}
