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

---

## [Fase 3] — Tienda y Lealtad — 2026-06-03

### Nuevos módulos

| Módulo | Archivos creados |
|---|---|
| Categorias de producto | repository, service, controller, routes |
| Productos | repository, service, controller, routes |
| Inventario | repository, service, controller, routes |
| Ordenes | repository, service, controller, routes |
| Pagos de orden | repository, service, controller, routes |
| Lealtad | repository, service, controller, routes |

### Endpoints agregados

| Método | Ruta | Auth | Roles |
|---|---|---|---|
| GET | /api/categorias | JWT | super_admin, admin_sucursal |
| POST | /api/categorias | JWT | super_admin |
| PATCH | /api/categorias/:id | JWT | super_admin |
| DELETE | /api/categorias/:id | JWT | super_admin |
| GET | /api/productos | JWT | super_admin, admin_sucursal, estilista |
| GET | /api/productos/:id | JWT | super_admin, admin_sucursal, estilista |
| POST | /api/productos | JWT | super_admin |
| PATCH | /api/productos/:id | JWT | super_admin |
| DELETE | /api/productos/:id | JWT | super_admin |
| GET | /api/inventario | JWT | super_admin, admin_sucursal |
| PATCH | /api/inventario/:producto_id/sucursal/:sucursal_id | JWT | super_admin, admin_sucursal |
| GET | /api/ordenes | JWT | super_admin, admin_sucursal |
| GET | /api/ordenes/:id | JWT | super_admin, admin_sucursal |
| POST | /api/ordenes | JWT | super_admin, admin_sucursal |
| PATCH | /api/ordenes/:id/estado | JWT | super_admin, admin_sucursal |
| GET | /api/pagos-orden/orden/:orden_id | JWT | super_admin, admin_sucursal |
| PATCH | /api/pagos-orden/orden/:orden_id/confirmar-efectivo | JWT | super_admin, admin_sucursal |
| GET | /api/lealtad/cliente/:cliente_id | JWT | super_admin, admin_sucursal |
| POST | /api/lealtad/ajuste | JWT | super_admin |

### Comportamiento clave
- Al crear un producto se inicializa automáticamente el inventario en todas las sucursales del tenant (stock 0, mínimo 5).
- Crear una orden valida stock disponible, descuenta inventario y genera el pago en una sola transacción atómica.
- Cancelar una orden repone el stock de todos los items y marca el pago como reembolsado si estaba pagado.
- Al confirmar el pago en efectivo de una orden, esta avanza automáticamente a estado 'procesando'.
- Al entregar una orden se acumulan puntos de fidelidad al cliente (non-blocking).
- Al completar una cita también se acumulan puntos de fidelidad al cliente (non-blocking).
- El filtro ?bajo_minimo=true en inventario devuelve solo los productos con stock igual o menor al mínimo configurado.
- Ajuste manual de puntos acepta valores positivos (acumulación) y negativos (canje), con validación de saldo suficiente.
- La tasa de acumulación es configurable via variable de entorno PUNTOS_POR_PESO (default: 0.1 — 1 punto por cada $10 MXN).
- Todos los movimientos de puntos quedan auditados con tipo, origen y descripción.

---

## [Fase 4 — Parte 1] — Reportes Exportables — 2026-06-03

### Nuevas dependencias
| Paquete | Versión | Uso |
|---|---|---|
| exceljs | instalado | Generación de archivos .xlsx |
| pdfkit | instalado | Generación de archivos .pdf |

### Nuevos módulos

| Módulo | Archivos creados |
|---|---|
| Reportes | repository, service, controller, routes |
| Generador Excel | utils/excel.js |
| Generador PDF | utils/pdf.js |

### Endpoints agregados

| Método | Ruta | Auth | Roles | Formatos |
|---|---|---|---|---|
| GET | /api/reportes/ingresos | JWT | super_admin, admin_sucursal | json, xlsx, pdf |
| GET | /api/reportes/citas | JWT | super_admin, admin_sucursal | json, xlsx, pdf |
| GET | /api/reportes/inventario | JWT | super_admin, admin_sucursal | json, xlsx, pdf |
| GET | /api/reportes/no-shows | JWT | super_admin, admin_sucursal | json, xlsx, pdf |
| GET | /api/reportes/estilistas | JWT | super_admin, admin_sucursal | json, xlsx, pdf |

### Filtros disponibles
- `?formato=json|xlsx|pdf` — formato de salida (default: json)
- `?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD` — rango de fechas
- `?sucursal_id=` — filtrar por sucursal
- `?estilista_id=` — filtrar por estilista (solo reporte citas)

### Comportamiento clave
- Formato json devuelve respuesta normal con `{ data, resumen }`.
- Formatos xlsx y pdf devuelven el archivo con Content-Disposition attachment para descarga directa.
- Excel de ingresos incluye dos hojas: detalle por cita y resumen con KPIs.
- PDF generado en orientacion horizontal (landscape) con header de marca MiCorte y tabla con filas alternas.
- Reporte de inventario incluye columna de valuacion (stock x precio) y alerta de minimo por fila.
- Reporte de estilistas incluye tasa de no-show calculada en SQL.

---
## [Fase 4 — Parte 2] — Platform Admin — 2026-06-03

### Nuevos módulos

| Módulo | Archivos creados |
|---|---|
| Platform Admin | repository, service, controller, routes |

### Setup requerido
- Usuario platform_admin creado manualmente en BD con empresa_id de tenant especial `MiCorte Platform`.
- La empresa plataforma tiene ID fijo `00000000-0000-0000-0000-000000000001`.

### Endpoints agregados

| Método | Ruta | Auth | Roles |
|---|---|---|---|
| GET | /api/platform/metricas | JWT | platform_admin |
| GET | /api/platform/tenants | JWT | platform_admin |
| GET | /api/platform/tenants/:id | JWT | platform_admin |
| PATCH | /api/platform/tenants/:id/toggle | JWT | platform_admin |
| PATCH | /api/platform/tenants/:id/plan | JWT | platform_admin |

### Comportamiento clave
- Las rutas de platform NO usan tenantGuard — el rol platform_admin no tiene empresa_id de tenant real.
- GET /metricas devuelve KPIs globales cross-tenant: total tenants, distribución de planes, citas, ordenes e ingresos totales de toda la plataforma, total de usuarios registrados.
- GET /tenants lista todas las empresas con conteo de sucursales, usuarios, citas e ingresos acumulados.
- GET /tenants/:id detalle completo del tenant: datos de empresa, sucursales activas y metricas calculadas con subqueries independientes (sin multiplicacion de filas).
- PATCH toggle activa o suspende un tenant (activo 1 <-> 0).
- PATCH plan cambia el plan de suscripcion (basico, pro, enterprise).


---

## [Fase 4 — Parte 3] — SMS Twilio — 2026-06-03

### Nueva dependencia
| Paquete | Version | Uso |
|---|---|---|
| twilio | instalado | Envio de SMS transaccionales |

### Nuevo modulo

| Modulo | Archivo creado |
|---|---|
| SMS utility | utils/sms.js |

### Archivos modificados
- `jobs/recordatorio.job.js` — ahora tambien envia SMS de recordatorio (non-blocking).
- `services/resena.service.js` — ahora tambien envia SMS con el enlace de resena (non-blocking).
- `repositories/resena.repository.js` — `findByToken` incluye `cliente_telefono` para que el objeto resena lo traiga listo.

### Variables de entorno nuevas
- `TWILIO_ACCOUNT_SID` — SID de la cuenta Twilio.
- `TWILIO_AUTH_TOKEN` — Auth token de Twilio.
- `TWILIO_PHONE` — Numero de origen registrado en Twilio (formato E.164).

### Comportamiento clave
- Si las variables `TWILIO_*` no estan configuradas, los envios de SMS se omiten silenciosamente sin afectar email ni ningun otro flujo.
- Si el cliente no tiene telefono registrado, el SMS se omite sin error.
- El recordatorio por SMS se dispara despues de marcar `recordatorio_enviado = 1`; un fallo de SMS no revierte ese marcado.
- El SMS de resena se dispara despues del email; un fallo de SMS no revierte la creacion de la resena.
- Ambos SMS son fire-and-forget desde su punto de llamada, con logging de error en consola si fallan.

---

## [Fase 4 — Parte 4] — Análisis de Retención — 2026-06-03

### Nuevos módulos

| Módulo | Archivos creados |
|---|---|
| Retención | repository, service, controller, routes |

### Endpoints agregados

| Método | Ruta | Auth | Roles |
|---|---|---|---|
| GET | /api/retencion/resumen | JWT | super_admin, admin_sucursal |
| GET | /api/retencion/en-riesgo | JWT | super_admin, admin_sucursal |
| GET | /api/retencion/top-clientes | JWT | super_admin, admin_sucursal |
| GET | /api/retencion/cohortes | JWT | super_admin, admin_sucursal |

### Filtros disponibles
- `?sucursal_id=` — filtrar por sucursal (todos los endpoints)
- `?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD` — rango de fechas (resumen, top-clientes)
- `?dias=30` — umbral de días sin visita para considerar cliente en riesgo (default: 30)
- `?limite=20` — top N clientes (default: 20)
- `?orden=gasto|visitas` — criterio de ordenamiento en top-clientes (default: gasto)

### Comportamiento clave
- Resumen devuelve KPIs de retención: tasa de retención, clientes activos/en riesgo/perdidos, ticket promedio e ingresos totales de citas completadas.
- En riesgo lista clientes cuya última visita supera el umbral de días configurado, ordenados por días sin visitar descendente.
- Top clientes incluye visitas totales, gasto total, ticket promedio, fecha de primera y última visita, días sin visitar y promedio de días entre visitas.
- Cohortes agrupa clientes por mes de primera visita y calcula cuántos regresaron (tuvieron 2+ visitas), mostrando los últimos 12 meses.
- Todos los cálculos se basan exclusivamente en citas con estado completada.
