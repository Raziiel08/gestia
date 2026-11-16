<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore, mensajeError } from '../services/authStore'

const router = useRouter()
const email = ref('')
const password = ref('')
const mostrarPassword = ref(false)
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Completá el email y la clave.'
    return
  }
  cargando.value = true
  try {
    await authStore.iniciarSesion({
      email: email.value.trim(),
      password: password.value,
    })
    router.push({ name: 'inicio' })
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
      <h1 class="auth__title">Iniciar sesión</h1>
      <p class="auth__sub">Ingresá con la cuenta institucional.</p>

      <div v-if="error" class="alert error" role="alert">{{ error }}</div>

      <form @submit.prevent="enviar">
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
              autocomplete="current-password"
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
        </div>

        <button type="submit" class="btn--block" :disabled="cargando">
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <p class="auth__footer">
        ¿No tenés cuenta?
        <RouterLink to="/registro">Crear cuenta</RouterLink>
      </p>
    </div>
  </div>
</template>
