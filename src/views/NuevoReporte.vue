<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../services/authStore'
import {
  crearReporte,
  listarUbicaciones,
  listarCategorias,
} from '../services/reportesService'
import {
  PRIORIDADES,
  ETIQUETAS_PRIORIDAD,
  PLAZOS_DIAS,
} from '../services/reglas'

const router = useRouter()

const titulo = ref('')
const descripcion = ref('')
const ubicacionId = ref('')
const categoriaId = ref('')
const prioridad = ref('normal')

const ubicaciones = ref([])
const categorias = ref([])

const errores = ref({})
const errorGeneral = ref('')
const enviando = ref(false)

onMounted(async () => {
  try {
    ;[ubicaciones.value, categorias.value] = await Promise.all([
      listarUbicaciones(),
      listarCategorias(),
    ])
  } catch (e) {
    errorGeneral.value = 'No se pudieron cargar las listas: ' + e.message
  }
})

function validar() {
  const e = {}
  if (!titulo.value.trim()) e.titulo = 'El título es obligatorio.'
  else if (titulo.value.length > 80) e.titulo = 'Máximo 80 caracteres.'
  if (!descripcion.value.trim()) e.descripcion = 'La descripción es obligatoria.'
  if (!ubicacionId.value) e.ubicacion = 'Elegí un lugar.'
  if (!categoriaId.value) e.categoria = 'Elegí un tipo de problema.'
  errores.value = e
  return Object.keys(e).length === 0
}

async function enviar() {
  errorGeneral.value = ''
  if (!validar()) return
  enviando.value = true
  try {
    const reporte = await crearReporte({
      titulo: titulo.value.trim(),
      descripcion: descripcion.value.trim(),
      ubicacionId: ubicacionId.value,
      categoriaId: categoriaId.value,
      autorId: authStore.state.user.id,
      prioridad: prioridad.value,
    })
    router.push(`/reportes/${reporte.id}`)
  } catch (e) {
    errorGeneral.value = 'No se pudo enviar el reporte: ' + e.message
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  router.push({ name: 'inicio' })
}
</script>

<template>
  <div>
    <RouterLink to="/reportes" class="back-link">← Reportes</RouterLink>

    <header class="page-header">
      <div>
        <h1>Nuevo reporte</h1>
        <p class="page-header__sub">
          Describí el problema para que el equipo técnico pueda atenderlo.
        </p>
      </div>
    </header>

    <div class="form-layout">
      <section class="card">
        <div v-if="errorGeneral" class="alert error" role="alert">
          {{ errorGeneral }}
        </div>

        <form @submit.prevent="enviar" novalidate>
          <div class="field">
            <label for="categoria">Tipo de problema</label>
            <select id="categoria" v-model="categoriaId">
              <option value="" disabled>Elegí una opción</option>
              <option v-for="c in categorias" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </select>
            <span v-if="errores.categoria" class="error">{{ errores.categoria }}</span>
          </div>

          <div class="field">
            <label for="ubicacion">Lugar</label>
            <select id="ubicacion" v-model="ubicacionId">
              <option value="" disabled>Elegí una opción</option>
              <option v-for="u in ubicaciones" :key="u.id" :value="u.id">
                {{ u.nombre }}
              </option>
            </select>
            <span v-if="errores.ubicacion" class="error">{{ errores.ubicacion }}</span>
          </div>

          <div class="field">
            <label for="prioridad">Prioridad</label>
            <select id="prioridad" v-model="prioridad">
              <option v-for="p in PRIORIDADES" :key="p" :value="p">
                {{ ETIQUETAS_PRIORIDAD[p] }} · {{ PLAZOS_DIAS[p] }} días de plazo
              </option>
            </select>
            <span class="hint">
              Si no estás seguro, dejá Normal. La coordinación puede ajustarla.
            </span>
          </div>

          <div class="field">
            <label for="titulo">Título breve</label>
            <input
              id="titulo"
              v-model="titulo"
              type="text"
              maxlength="80"
              placeholder="Ej: Proyector del aula 2 no enciende"
            />
            <span v-if="errores.titulo" class="error">{{ errores.titulo }}</span>
          </div>

          <div class="field">
            <label for="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              v-model="descripcion"
              rows="5"
              placeholder="Contá qué pasa, desde cuándo y si afecta el dictado de clases."
            ></textarea>
            <span v-if="errores.descripcion" class="error">{{ errores.descripcion }}</span>
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="enviando">
              {{ enviando ? 'Enviando...' : 'Enviar reporte' }}
            </button>
            <button type="button" class="secondary" @click="cancelar">
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <aside>
        <section class="card">
          <h2>Plazos de atención</h2>
          <p class="hint">
            Cada prioridad tiene un plazo máximo para resolverse. El tablero mide
            el cumplimiento contra estos valores.
          </p>

          <dl class="datos" style="grid-template-columns: 1fr auto">
            <template v-for="p in [...PRIORIDADES].reverse()" :key="p">
              <dt>{{ ETIQUETAS_PRIORIDAD[p] }}</dt>
              <dd>{{ PLAZOS_DIAS[p] }} días</dd>
            </template>
          </dl>
        </section>

        <section class="card">
          <h2>Qué pasa después</h2>
          <ul class="hint" style="padding-left: 1.1rem; line-height: 1.6">
            <li>El reporte queda pendiente y visible para el equipo técnico.</li>
            <li>Cuando alguien lo toma, pasa a En revisión.</li>
            <li>Al terminar el trabajo se marca como Resuelto.</li>
          </ul>
          <p class="hint" style="margin-bottom: 0">
            Podés seguir el estado desde la sección Reportes.
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>
