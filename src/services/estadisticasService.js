import { supabase } from "../supabase";
import { aFechaLocal } from "./reglas.js";
import { calcularMetricas } from "./metricas.js";

const CAMPOS_REPORTE = `
  id, titulo, estado, prioridad, created_at, resuelto_at,
  ubicacion_id, categoria_id,
  ubicaciones ( id, nombre ),
  categorias ( id, nombre )
`;

function inicioDelDia(valor) {
  const fecha = new Date(aFechaLocal(valor));
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function finDelDia(valor) {
  const fecha = new Date(aFechaLocal(valor));
  fecha.setHours(23, 59, 59, 999);
  return fecha;
}

export async function obtenerMetricas(
  { desde = null, hasta = null, ubicacionId = null, categoriaId = null } = {},
) {
  let consulta = supabase.from("reportes").select(CAMPOS_REPORTE);

  if (desde) {
    consulta = consulta.gte("created_at", inicioDelDia(desde).toISOString());
  }
  if (hasta) {
    consulta = consulta.lte("created_at", finDelDia(hasta).toISOString());
  }
  if (ubicacionId) consulta = consulta.eq("ubicacion_id", ubicacionId);
  if (categoriaId) consulta = consulta.eq("categoria_id", categoriaId);

  const { data, error } = await consulta.order("created_at", {
    ascending: true,
  });
  if (error) throw error;

  return calcularMetricas(data, { desde, hasta, ubicacionId, categoriaId });
}
