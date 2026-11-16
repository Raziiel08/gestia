import { reactive, readonly } from "vue";
import { supabase } from "../supabase";

const state = reactive({
  user: null,
  perfil: null,
  cargando: true,
});

async function cargarPerfil(userId) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, rol")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("No se pudo cargar el perfil:", error.message);
    state.perfil = null;
    return;
  }
  state.perfil = data;
}

async function inicializar() {
  const { data } = await supabase.auth.getSession();
  state.user = data.session?.user ?? null;
  if (state.user) await cargarPerfil(state.user.id);
  state.cargando = false;

  supabase.auth.onAuthStateChange((_event, session) => {
    state.user = session?.user ?? null;
    if (state.user) {
      cargarPerfil(state.user.id);
    } else {
      state.perfil = null;
    }
  });
}

async function registrarse({ email, password, nombre }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });
  if (error) throw error;
  return data;
}

async function iniciarSesion({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  state.user = data.user;
  if (data.user) await cargarPerfil(data.user.id);
  return data;
}

async function cerrarSesion() {
  await supabase.auth.signOut();
  state.user = null;
  state.perfil = null;
}

const MENSAJES_AUTH = [
  [
    "Invalid login credentials",
    "El email o la clave no son correctos.",
  ],
  [
    "Email not confirmed",
    "Tenés que confirmar el correo antes de ingresar. Revisá tu bandeja de entrada.",
  ],
  [
    "User already registered",
    "Ya existe una cuenta con ese email. Probá iniciar sesión.",
  ],
  [
    "Password should be at least",
    "La clave debe tener al menos 6 caracteres.",
  ],
  [
    "Email rate limit exceeded",
    "Se enviaron demasiados correos en poco tiempo. Esperá unos minutos y volvé a intentar.",
  ],
  [
    "Signups not allowed",
    "El registro está deshabilitado. Contactá a la administración del sistema.",
  ],
];

export function mensajeError(error) {
  const texto = error?.message ?? "";
  const encontrado = MENSAJES_AUTH.find(([clave]) => texto.includes(clave));
  if (encontrado) return encontrado[1];
  return texto || "No se pudo completar la operación. Intentá de nuevo.";
}

export const authStore = {
  state: readonly(state),
  inicializar,
  registrarse,
  iniciarSesion,
  cerrarSesion,
};
