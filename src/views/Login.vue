<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore, mensajeError } from '../services/authStore'

const router = useRouter()
const email = ref('')
const password = ref('')
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
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
          />
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
