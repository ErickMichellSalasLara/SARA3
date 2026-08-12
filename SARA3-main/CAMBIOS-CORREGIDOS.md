# Correcciones aplicadas

- Corregida la ruta de importación de `DashboardHome` en `AdminHome.jsx`.
- Eliminado el import incorrecto y sin uso de `DashboardHome` en `App.jsx`.
- Agregadas las páginas informativas de inicio para administrador y alumno.
- Separadas las rutas de inicio y dashboard:
  - `/admin` y `/admin/dashboard`
  - `/alumno` y `/alumno/cubiculos`
- Agregadas las pestañas **Inicio** en ambos menús laterales.
- Actualizados los encabezados según la ruta activa.
- Completado el componente compartido de iconos.
- Agregadas animaciones de entrada y revelado progresivo en las páginas de inicio.
- Agregadas animaciones en la página pública principal.
- Conservadas las credenciales temporales:
  - Administrador: `admin@utr.edu.mx` / `Admin123`
  - Alumno: `alumno@utr.edu.mx` / `Alumno123`
- Verificadas la sintaxis de todos los archivos JavaScript/JSX y las rutas de imports relativos.

## Ejecución

```bash
npm install
npm run dev
```

El ZIP no incluye `node_modules`; deben instalarse en la computadora donde se ejecute el proyecto.

## Corrección de visibilidad de botones

Se corrigió una colisión de estilos entre la plantilla pública `assets/css/main.css` y las dashboards.

La plantilla aplicaba `color` y `border` con `!important` a todos los elementos `<button>`. Eso hacía que algunos botones específicos de las dashboards heredaran texto blanco sobre fondos claros o conservaran tamaños y espaciados de la plantilla pública.

### Cambios realizados
- Se eliminaron los `!important` globales de los estilos genéricos de botones en `main.css`.
- Se neutralizaron dentro de `.admin-shell` las propiedades heredadas de altura, `line-height`, espaciado de letras y transformación a mayúsculas.
- Se añadió un `line-height` explícito al botón principal de autenticación.
- Con esto recuperan visibilidad los filtros de cubículos, botones secundarios, botones de acción, botones de modal y enlaces tipo botón en las dashboards.

La página pública conserva sus estilos porque las clases `.button` siguen usando la plantilla original.
