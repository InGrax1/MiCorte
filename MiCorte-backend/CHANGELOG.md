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

*Proxima fase: Fase 1 — Agenda Core (Sucursales, Estilistas, Servicios, Citas)*