<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore, mensajeError } from '../services/authStore'
import { dominioEmailPermitido, normalizarEmail, mensajeEmailInvalido } from '../services/email'

const router = useRouter()

const nombre = ref('')
const email = ref('')
const password = ref('')
const repetir = ref('')
const mostrarPassword = ref(false)
const mostrarRepetir = ref(false)
const error = ref('')
const exito = ref('')
const cargando = ref(false)

function validar() {
  if (!nombre.value.trim()) return 'Ingresá tu nombre y apellido.'
  const correo = normalizarEmail(email.value)
  if (!correo) return 'Ingresá tu email.'
  if (!dominioEmailPermitido(correo)) return mensajeEmailInvalido()
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
      email: normalizarEmail(email.value),
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
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="mostrarPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              class="password-toggle"
              :aria-label="mostrarPassword ? 'Ocultar clave' : 'Mostrar clave'"
              :aria-pressed="mostrarPassword"
              @click="mostrarPassword = !mostrarPassword"
            >
              <svg
                v-if="mostrarPassword"
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m3 3 18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.8" />
                <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8" />
              </svg>
            </button>
          </div>
          <span class="hint">Mínimo 6 caracteres.</span>
        </div>

        <div class="field">
          <label for="repetir">Repetir clave</label>
          <div class="password-input">
            <input
              id="repetir"
              v-model="repetir"
              :type="mostrarRepetir ? 'text' : 'password'"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              class="password-toggle"
              :aria-label="mostrarRepetir ? 'Ocultar clave' : 'Mostrar clave'"
              :aria-pressed="mostrarRepetir"
              @click="mostrarRepetir = !mostrarRepetir"
            >
              <svg
                v-if="mostrarRepetir"
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m3 3 18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.8" />
                <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8" />
              </svg>
            </button>
          </div>
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
