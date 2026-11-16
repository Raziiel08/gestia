import { supabase } from "../supabase";

export async function listarReportes(filtros = {}) {
  let query = supabase
    .from("reportes")
    .select(
      `
      id, titulo, descripcion, estado, prioridad, created_at,
      demoro_materiales, calificacion,
      ubicaciones ( id, nombre ),
      categorias ( id, nombre ),
      autor:perfiles!reportes_autor_id_fkey ( id, nombre ),
      tecnico:perfiles!reportes_tecnico_id_fkey ( id, nombre )
    `,
    )
    .order("created_at", { ascending: false });

  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.prioridad) query = query.eq("prioridad", filtros.prioridad);
  if (filtros.ubicacionId)
    query = query.eq("ubicacion_id", filtros.ubicacionId);
  if (filtros.categoriaId)
    query = query.eq("categoria_id", filtros.categoriaId);
  if (filtros.soloMios && filtros.userId)
    query = query.eq("autor_id", filtros.userId);
  if (filtros.busqueda) {
    const saneada = filtros.busqueda.replace(/[(),]/g, ' ').trim();
    if (saneada) {
      query = query.or(
        `titulo.ilike.%${saneada}%,descripcion.ilike.%${saneada}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function obtenerReporte(id) {
  const { data, error } = await supabase
    .from("reportes")
    .select(
      `
      id, titulo, descripcion, estado, prioridad, created_at, resuelto_at,
      demoro_materiales, calificacion,
      ubicaciones ( id, nombre ),
      categorias ( id, nombre ),
      autor:perfiles!reportes_autor_id_fkey ( id, nombre ),
      tecnico:perfiles!reportes_tecnico_id_fkey ( id, nombre )
    `,
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function crearReporte({
  titulo,
  descripcion,
  ubicacionId,
  categoriaId,
  autorId,
  prioridad = "normal",
}) {
  const { data, error } = await supabase
    .from("reportes")
    .insert({
      titulo,
      descripcion,
      ubicacion_id: ubicacionId,
      categoria_id: categoriaId,
      autor_id: autorId,
      estado: "pendiente",
      prioridad,
    })
    .select()
    .single();
  if (error) throw error;

  await agregarHistorial({
    reporteId: data.id,
    estadoNuevo: "pendiente",
    userId: autorId,
    comentario: "Reporte creado.",
  });

  return data;
}

export async function cambiarEstadoReporte({
  reporteId,
  estadoNuevo,
  userId,
  comentario,
  tecnicoId,
  demoroMateriales = null,
  calificacion = null,
}) {
  const { error } = await supabase.rpc("actualizar_estado_reporte", {
    p_reporte_id: reporteId,
    p_estado_nuevo: estadoNuevo,
    p_comentario: comentario || null,
    p_tecnico_id: tecnicoId || null,
    p_demoro_materiales: demoroMateriales,
    p_calificacion: calificacion,
  });
  if (error) throw error;
}

export async function agregarHistorial({
  reporteId,
  estadoNuevo,
  userId,
  comentario,
}) {
  const { error } = await supabase.from("historial_estados").insert({
    reporte_id: reporteId,
    estado_nuevo: estadoNuevo,
    autor_id: userId,
    comentario: comentario || null,
  });
  if (error) throw error;
}

export async function listarHistorial(reporteId) {
  const { data, error } = await supabase
    .from("historial_estados")
    .select(
      "id, estado_nuevo, comentario, created_at, autor:perfiles(id, nombre)",
    )
    .eq("reporte_id", reporteId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listarUbicaciones() {
  const { data, error } = await supabase
    .from("ubicaciones")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data;
}

export async function listarCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data;
}
