import { createRouter, createWebHistory } from "vue-router";
import { authStore } from "../services/authStore";

const routes = [
  { path: "/", redirect: "/inicio" },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Login.vue"),
    meta: { publica: true },
  },
  {
    path: "/registro",
    name: "registro",
    component: () => import("../views/Registro.vue"),
    meta: { publica: true },
  },
  {
    path: "/inicio",
    name: "inicio",
    component: () => import("../views/Inicio.vue"),
  },
  {
    path: "/reportes/nuevo",
    name: "nuevo-reporte",
    component: () => import("../views/NuevoReporte.vue"),
  },
  {
    path: "/reportes",
    name: "lista-reportes",
    component: () => import("../views/ListaReportes.vue"),
  },
  {
    path: "/reportes/:id",
    name: "detalle-reporte",
    component: () => import("../views/DetalleReporte.vue"),
    props: true,
  },
  {
    path: "/tablero",
    name: "tablero",
    component: () => import("../views/Tablero.vue"),
    meta: { roles: ["tecnico", "administrador"] },
  },
  {
    path: "/informe",
    name: "informe",
    component: () => import("../views/Informe.vue"),
    meta: { roles: ["tecnico", "administrador"] },
  },
  {
    path: "/usuarios",
    name: "usuarios",
    component: () => import("../views/Usuarios.vue"),
    meta: { roles: ["administrador"] },
  },
  { path: "/:pathMatch(.*)*", redirect: "/inicio" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const TITULOS = {
  inicio: "Inicio",
  login: "Ingresar",
  registro: "Crear cuenta",
  "nuevo-reporte": "Nuevo reporte",
  "lista-reportes": "Reportes",
  "detalle-reporte": "Reporte",
  tablero: "Tablero",
  usuarios: "Usuarios",
};

router.beforeEach(async (to) => {

  while (authStore.state.cargando) {
    await new Promise((r) => setTimeout(r, 30));
  }

  const logueado = !!authStore.state.user;
  if (!to.meta.publica && !logueado) {
    return { name: "login" };
  }
  if (to.meta.publica && logueado) {
    return { name: "inicio" };
  }
  if (to.meta.roles && !to.meta.roles.includes(authStore.state.perfil?.rol)) {
    return { name: "inicio" };
  }
  return true;
});

router.afterEach((to) => {

  if (to.name === "informe") return;
  const titulo = TITULOS[to.name];
  document.title = titulo
    ? `${titulo} · Gestia Mantenimiento`
    : "Gestia · Mantenimiento escolar";
});

export default router;
