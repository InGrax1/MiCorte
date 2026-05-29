# CHANGELOG — MiCorte Backend

Todos los cambios relevantes del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Fase 0] — Cimientos SaaS — 2026-05-20

### Base de Datos
- ADDED Schema SQL inicial con todas las entidades del sistema.
- ADDED Datos iniciales de roles del sistema.
- CONVENTION UUIDs como identificadores primarios en todas las tablas.
- CONVENTION Soft-delete en todas las entidades que lo requieren.
- CONVENTION Campos de auditoría (created_at, updated_at) en todas las tablas.

### Estructura del Proyecto
- ADDED Estructura de carpetas Clean Architecture (config, controllers, middlewares, routes, services, repositories, jobs, utils).
- ADDED Archivo .env.example con todas las variables de entorno requeridas documentadas.
- ADDED .gitignore configurado para excluir archivos sensibles.

### Dependencias
| Paquete | Versión | Uso |
|---|---|---|
| express | ^4.19.2 | Framework HTTP |
| mysql2 | ^3.9.7 | Driver MySQL con soporte Promise |
| dotenv | ^16.4.5 | Variables de entorno |
| bcryptjs | ^2.4.3 | Hash de contraseñas |
| jsonwebtoken | ^9.0.2 | Generación y verificación de JWT |
| joi | ^17.13.1 | Validación de inputs |
| uuid | ^10.0.0 | Generación de UUIDs |
| nodemon | ^3.1.4 | Recarga automática en desarrollo |

### Configuracion
- ADDED Pool de conexiones a MySQL con reconexión automática y timezone UTC.
- ADDED Configuración Express con CORS dinámico, parseo JSON y error handler global.
- ADDED Punto de entrada con verificación de conexión a BD antes de levantar el servidor.

### Autenticacion y Seguridad
- ADDED Helper de respuestas JSON con shape consistente en toda la API.
- ADDED Clase de error personalizada con código HTTP para manejo centralizado.
- ADDED Sistema de autenticación con JWT (access token 1h + refresh token 7d).
- ADDED Middleware de verificación de token en rutas protegidas.
- ADDED Middleware de aislamiento por tenant (multitenancy lógico).
- ADDED Middleware de control de acceso basado en roles (RBAC).
- ADDED Validación de inputs con Joi en todos los endpoints.

### Endpoints

| Método | Ruta | Auth | Descripcion |
|---|---|---|---|
| GET | /api/health | No | Health check del servidor |
| POST | /api/auth/login | No | Login con email y password |
| POST | /api/auth/refresh | No | Renovar access token |
| GET | /api/auth/me | Si | Datos del usuario autenticado |

### Pruebas realizadas
- Login con credenciales correctas e incorrectas.
- Renovacion de token con refresh token.
- Acceso a ruta protegida con token valido.
- Verificacion de roles en el payload del token.

### Bugs resueltos
- FIX Hash de usuario de prueba no correspondía a la contraseña. Resuelto regenerando el hash correctamente.
- FIX Carpetas de src creadas con sintaxis incorrecta. Recreadas con comandos individuales.

---

---

## [Fase 1] — Agenda Core — 2026-05-28

### Nuevos módulos

| Módulo | Archivos creados |
|---|---|
| Sucursales | repository, service, controller, routes |
| Estilistas + Horarios | repository, service, controller, routes |
| Servicios | repository, service, controller, routes |
| Clientes | repository, service, controller, routes |
| Citas | repository, service, controller, routes |

### Endpoints agregados

| Método | Ruta | Auth | Roles |
|---|---|---|---|
| GET | /api/sucursales | Si | super_admin, admin_sucursal |
| GET | /api/sucursales/:id | Si | super_admin, admin_sucursal |
| POST | /api/sucursales | Si | super_admin |
| PUT | /api/sucursales/:id | Si | super_admin, admin_sucursal |
| PATCH | /api/sucursales/:id/toggle | Si | super_admin |
| DELETE | /api/sucursales/:id | Si | super_admin |
| GET | /api/estilistas | Si | super_admin, admin_sucursal |
| GET | /api/estilistas/:id | Si | super_admin, admin_sucursal, estilista |
| POST | /api/estilistas | Si | super_admin, admin_sucursal |
| PUT | /api/estilistas/:id | Si | super_admin, admin_sucursal |
| GET | /api/estilistas/:id/horarios | Si | super_admin, admin_sucursal, estilista |
| PUT | /api/estilistas/:id/horarios | Si | super_admin, admin_sucursal |
| DELETE | /api/estilistas/:id | Si | super_admin |
| GET | /api/servicios | Si | super_admin, admin_sucursal, estilista |
| GET | /api/servicios/:id | Si | super_admin, admin_sucursal, estilista |
| POST | /api/servicios | Si | super_admin, admin_sucursal |
| PUT | /api/servicios/:id | Si | super_admin, admin_sucursal |
| DELETE | /api/servicios/:id | Si | super_admin |
| POST | /api/servicios/:id/sucursales | Si | super_admin, admin_sucursal |
| DELETE | /api/servicios/:id/sucursales/:sucursal_id | Si | super_admin |
| GET | /api/clientes | Si | super_admin, admin_sucursal |
| GET | /api/clientes/:id | Si | super_admin, admin_sucursal, estilista |
| POST | /api/clientes | Si | super_admin, admin_sucursal |
| PUT | /api/clientes/:id | Si | super_admin, admin_sucursal |
| DELETE | /api/clientes/:id | Si | super_admin |
| GET | /api/citas | Si | super_admin, admin_sucursal, estilista |
| GET | /api/citas/:id | Si | super_admin, admin_sucursal, estilista |
| POST | /api/citas | Si | super_admin, admin_sucursal |
| PATCH | /api/citas/:id/estado | Si | super_admin, admin_sucursal, estilista |
| DELETE | /api/citas/:id | Si | super_admin, admin_sucursal |
| GET | /api/citas/disponibilidad | Si | super_admin, admin_sucursal, estilista |

### Comportamiento clave
- Creación de estilista genera usuario y perfil en una sola transacción atómica.
- Horarios semanales se reemplazan completamente (DELETE + INSERT) para evitar inconsistencias.
- Disponibilidad calcula slots libres cruzando horario semanal, bloqueos de agenda y citas existentes.
- Solapamiento de citas validado en backend con query SQL antes de insertar.
- Estilistas solo acceden a sus propias citas en GET /api/citas.
- Transiciones de estado controladas por mapa de transiciones con verificación de rol.

---

## [Fase 2] — Pagos, Reseñas y Recordatorios — 2026-05-28

### Nuevas dependencias
| Paquete | Versión | Uso |
|---|---|---|
| nodemailer | instalado | Envío de email vía Gmail SMTP |
| node-cron | instalado | Cron job para recordatorios automáticos |

### Nuevos módulos

| Módulo | Archivos creados |
|---|---|
| Email utility | utils/email.js |
| Pagos cita | repository, service, controller, routes |
| Reseñas | repository, service, controller, routes |
| Recordatorios | jobs/recordatorio.job.js |

### Endpoints agregados

| Método | Ruta | Auth |
|---|---|---|
| GET | /api/pagos/cita/:cita_id | JWT |
| PATCH | /api/pagos/cita/:cita_id/confirmar | JWT |
| PATCH | /api/pagos/cita/:cita_id/reembolsar | JWT |
| POST | /api/pagos/cita/:cita_id/iniciar-mp | JWT |
| POST | /api/pagos/webhook/mercadopago | Público (firma MP) |
| GET | /api/resenas | JWT |
| GET | /api/resenas/token/:token | Público |
| POST | /api/resenas/token/:token | Público |
| PATCH | /api/resenas/:id/visibilidad | JWT |

### Comportamiento clave
- Al crear una cita se genera automáticamente el registro de pago (best-effort).
- Confirmar pago efectivo cambia la cita a estado 'confirmada' en una sola operación.
- Webhook de MercadoPago verifica firma HMAC-SHA256 antes de procesar cualquier evento.
- Al completar una cita se genera la reseña y se envía email al cliente (non-blocking).
- Token de reseña es UUID de un solo uso con expiración de 7 días.
- Cron corre cada 30 minutos buscando citas en la ventana de 23-25 h para enviar recordatorio.

*Proxima fase: Fase 3 — Tienda (Productos, Inventario, Órdenes) y Lealtad*