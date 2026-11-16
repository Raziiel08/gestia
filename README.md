# Gestia

Sistema web de mantenimiento escolar. Permite reportar problemas del
edificio, hacer seguimiento de cada caso y analizar el desempeño del
servicio con indicadores y un informe de gestión.

## Qué hace

- Quien detecta un problema lo reporta con lugar, tipo, prioridad y
  descripción.
- El equipo técnico lo toma, cambia el estado y deja un comentario.
- La dirección consulta indicadores y un informe mensual.

## Puesta en marcha

1. Instalar dependencias: `npm install`.
2. Crear `.env` y completar `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. En Supabase, ir a SQL Editor y correr el contenido de
   `supabase/gestia.sql`.
4. Marcar el primer administrador:

   ```sql
   update perfiles set rol = 'administrador'
   where id = (select id from auth.users where email = '...');
   ```

5. Levantar la app: `npm run dev`.


## Roles y permisos

| Rol | Puede hacer |
| --- | --- |
| Estudiante / Docente | Crear reportes y seguir los propios. |
| Técnico | Ver todos los reportes, cambiar estados y consultar tablero e informe. |
| Administrador | Todo lo anterior, reabrir o reactivar reportes y administrar roles. |

Las cuentas nuevas se crean como estudiante / docente. Los demás roles se
asignan desde Usuarios. Nadie puede cambiar su propio rol.

## Pantallas

- Inicio: resumen de casos.
- Reportes: búsqueda y filtros.
- Nuevo reporte: formulario.
- Detalle: ficha y historial.
- Tablero: indicadores y gráficos.
- Informe: seguimiento mensual.
- Usuarios: administración de roles.

## Indicadores

El tablero y el informe usan los mismos indicadores:

| Indicador | Meta |
| --- | --- |
| Reportes resueltos | ≥ 80 % |
| Resueltos en plazo | ≥ 90 % |
| Tiempo promedio de resolución | ≤ 7 días |
| Reportes abiertos | ≤ 10 |
| Reportes vencidos | 0 |

Plazos por prioridad: urgente 2 días, normal 7 días, baja 15 días.

Si un indicador no puede calcularse, se muestra "No calculable" en lugar
de un cero.

## Decisiones técnicas

- Se usa Supabase y no localStorage: varios usuarios trabajan sobre los
  mismos reportes y la seguridad se aplica en el servidor.
- El tablero y el informe usan una sola consulta filtrada y un cálculo
  puro. No hay cifras que no cierren.

## Limitaciones

- No se adjuntan fotos.
- No se registran costos ni conformación del usuario.
- La asignación de técnico es automática.
- No hay notificaciones.

## Estructura

- `src/`: componentes, servicios, vistas y estilos.
- `supabase/`: base de datos.