<script setup>
import { computed, onMounted, ref } from 'vue'
import { authStore } from '../services/authStore'
import { listarPerfiles, cambiarRol } from '../services/usuariosService'
import {
  ETIQUETAS_ROL,
  ROLES,
  formatearFecha,
} from '../services/reglas'

const perfiles = ref([])
const cargando = ref(true)
const error = ref('')
const exito = ref('')
const busqueda = ref('')
const guardando = ref('')
const errorFila = ref('')

const yo = computed(() => authStore.state.user?.id)

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  if (!texto) return perfiles.value
  return perfiles.value.filter((p) => p.nombre.toLowerCase().includes(texto))
})

const resumen = computed(() => {
  const c = { estudiante_docente: 0, tecnico: 0, administrador: 0 }
  for (const p of perfiles.value) if (p.rol in c) c[p.rol] += 1
  return c
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    perfiles.value = await listarPerfiles()
  } catch (e) {
    error.value = 'No se pudieron cargar los usuarios: ' + e.message
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

async function actualizarRol(perfil, nuevoRol) {
  if (perfil.rol === nuevoRol) return
  guardando.value = perfil.id
  errorFila.value = ''
  exito.value = ''
  const anterior = perfil.rol
  try {
    const actualizado = await cambiarRol(perfil.id, nuevoRol)
    perfil.rol = actualizado.rol
    exito.value = `Rol de ${perfil.nombre} actualizado a ${ETIQUETAS_ROL[actualizado.rol]}.`
  } catch (e) {
    perfil.rol = anterior
    errorFila.value = `No se pudo cambiar el rol de ${perfil.nombre}: ${e.message}`
  } finally {
    guardando.value = ''
  }
}
</script>

<template>
  <div>
    <header class="page-header">
      <div>
        <h1>Usuarios y roles</h1>
        <p class="page-header__sub">
          Cuentas del sistema y nivel de acceso de cada una.
        </p>
      </div>
      <div class="page-header__acciones">
        <span class="hint">{{ perfiles.length }} usuarios</span>
      </div>
    </header>

    <div class="alert info">
      Las cuentas nuevas se crean como Estudiante / Docente. Desde acá se
      habilitan los accesos de Técnico y Administrador.
    </div>

    <div v-if="error" class="alert error" role="alert">
      {{ error }}
      <button class="secondary small" style="margin-left: 0.6rem" @click="cargar">
        Reintentar
      </button>
    </div>

    <div v-if="exito" class="alert success" role="status">{{ exito }}</div>
    <div v-if="errorFila" class="alert error" role="alert">{{ errorFila }}</div>

    <div class="mini-grid">
      <div class="mini-stat">
        <span class="mini-stat__label">Estudiantes y docentes</span>
        <span class="mini-stat__value">{{ resumen.estudiante_docente }}</span>
        <span class="mini-stat__hint">Pueden cargar y seguir sus reportes</span>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__label">Técnicos</span>
        <span class="mini-stat__value">{{ resumen.tecnico }}</span>
        <span class="mini-stat__hint">Atienden reportes y ven el tablero</span>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__label">Administradores</span>
        <span class="mini-stat__value">{{ resumen.administrador }}</span>
        <span class="mini-stat__hint">Gestionan roles y configuración</span>
      </div>
    </div>

    <section class="card">
      <div class="toolbar">
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por nombre"
          aria-label="Buscar usuarios"
        />
        <span class="toolbar__meta" role="status">
          {{ filtrados.length }} {{ filtrados.length === 1 ? 'usuario' : 'usuarios' }}
        </span>
      </div>

      <div v-if="cargando" aria-hidden="true">
        <div v-for="n in 5" :key="n" class="skeleton skeleton--row" style="margin-bottom: 0.55rem"></div>
      </div>

      <div v-else-if="filtrados.length === 0" class="empty">
        <strong>No se encontraron usuarios</strong>
        <p>Probá con otro nombre.</p>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Rol</th>
              <th scope="col">Alta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="perfil in filtrados" :key="perfil.id">
              <td>
                {{ perfil.nombre }}
                <span v-if="perfil.id === yo" class="badge cancelado" style="margin-left: 0.4rem">
                  Vos
                </span>
              </td>
              <td>
                <select
                  :value="perfil.rol"
                  :disabled="perfil.id === yo || guardando === perfil.id"
                  :aria-label="`Rol de ${perfil.nombre}`"
                  style="max-width: 220px"
                  @change="actualizarRol(perfil, $event.target.value)"
                >
                  <option v-for="r in ROLES" :key="r" :value="r">
                    {{ ETIQUETAS_ROL[r] }}
                  </option>
                </select>
                <div v-if="perfil.id === yo" class="hint" style="margin-top: 0.2rem">
                  No podés cambiar tu propio rol.
                </div>
              </td>
              <td class="num">{{ formatearFecha(perfil.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
