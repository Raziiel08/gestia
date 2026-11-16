import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { configuracionFaltante } from './supabase'

if (configuracionFaltante) {

  document.querySelector('#app').innerHTML = `
    <div style="max-width:560px;margin:3rem auto;padding:1.25rem;border:1px solid #fca5a5;border-radius:10px;background:#fee2e2;color:#991b1b;font-family:system-ui,sans-serif;line-height:1.5;">
      <strong>No se pudo iniciar la aplicación</strong>
      <p style="margin:0.5rem 0 0;">${configuracionFaltante}</p>
    </div>`
} else {
  createApp(App).use(router).mount('#app')
}
