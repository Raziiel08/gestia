import { supabase } from "../supabase";

export async function listarPerfiles() {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, created_at")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
}

export async function cambiarRol(id, rol) {
  const { data, error } = await supabase
    .from("perfiles")
    .update({ rol })
    .eq("id", id)
    .select("id, nombre, rol")
    .single();

  if (error) throw error;
  return data;
}
