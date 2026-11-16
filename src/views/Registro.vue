<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore, mensajeError } from '../services/authStore'

const router = useRouter()

const nombre = ref('')
const email = ref('')
const password = ref('')
const repetir = ref('')
const error = ref('')
const exito = ref('')
const cargando = ref(false)

function validar() {
  if (!nombre.value.trim()) return 'Ingresá tu nombre y apellido.'
  if (!email.value.trim()) return 'Ingresá tu email.'
  if (password.value.length < 6) return 'La clave debe tener al menos 6 caracteres.'
  if (password.value !== repetir.value) return 'Las claves no coinciden.'
  return ''
}

async function enviar() {
  error.value = ''
  exito.value = ''

  const problema = validar()
  if (problema) {
    error.value = problema
    return
  }

  cargando.value = true
  try {
    const data = await authStore.registrarse({
      nombre: nombre.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })

    if (data.session) {
      router.push({ name: 'inicio' })
      return
    }
    exito.value =
      'Cuenta creada. Te enviamos un correo para confirmarla; después podés iniciar sesión.'
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="auth">
    <div class="auth__brand">
      <div class="brand">
        <span class="brand__mark" aria-hidden="true">G</span>
        <span class="brand__text">
          <strong>Gestia</strong>
          <span>Mantenimiento escolar</span>
        </span>
      </div>
      <p class="auth__tagline">
        Reportes, seguimiento y tablero del servicio de mantenimiento.
      </p>
    </div>

    <div class="card">
      <h1 class="auth__title">Crear cuenta</h1>
      <p class="auth__sub">
        Para estudiantes y docentes del establecimiento.
      </p>

      <div v-if="error" class="alert error" role="alert">{{ error }}</div>
      <div v-if="exito" class="alert success" role="status">{{ exito }}</div>

      <form v-if="!exito" @submit.prevent="enviar" novalidate>
        <div class="field">
          <label for="nombre">Nombre y apellido</label>
          <input id="nombre" v-model="nombre" type="text" required autocomplete="name" />
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="username"
            placeholder="nombre@escuela.edu.ar"
          />
        </div>

        <div class="field">
          <label for="password">Clave</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
          />
          <span class="hint">Mínimo 6 caracteres.</span>
        </div>

        <div class="field">
          <label for="repetir">Repetir clave</label>
          <input
            id="repetir"
            v-model="repetir"
            type="password"
            required
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn--block" :disabled="cargando">
          {{ cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="auth__nota">
        El alta desde el sistema crea cuentas de estudiante o docente. Los
        accesos de técnico y administrador los asigna la administración.
      </p>

      <p class="auth__footer">
        ¿Ya tenés cuenta?
        <RouterLink to="/login">Iniciar sesión</RouterLink>
      </p>
    </div>
  </div>
</template>
