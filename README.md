# MiCorte

Sistema SaaS multitenant para la gestion integral de barberias y salones de belleza: reservas en linea, punto de venta, e-commerce, fidelizacion de clientes y panel administrativo, todo en una sola plataforma.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Tabla de contenido

- [Descripcion general](#descripcion-general)
- [Arquitectura](#arquitectura)
- [Stack tecnologico](#stack-tecnologico)
- [Backend](#backend)
- [Frontend](#frontend)
- [Integraciones](#integraciones)
- [Seguridad](#seguridad)
- [Instalacion y puesta en marcha](#instalacion-y-puesta-en-marcha)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Fases de desarrollo](#fases-de-desarrollo)

---

## Descripcion general

MiCorte atiende a tres audiencias desde una misma base de codigo:

| Audiencia | Que puede hacer |
|---|---|
| **Cliente final** (sin cuenta) | Reservar cita en 6 pasos, comprar productos en la tienda en linea, dejar resenas verificadas, consultar su historial y puntos en el portal |
| **Personal del salon** | Gestionar citas, clientes, estilistas, horarios, servicios, inventario, ordenes y promociones desde el panel admin |
| **Operador de la plataforma** | Dar de alta nuevos negocios (tenants), supervisar metricas globales |

Cada negocio (empresa) opera de forma aislada con sus propias sucursales, personal, catalogo y clientes — el aislamiento se garantiza a nivel de datos en cada consulta.

---

## Arquitectura

### Backend — Clean Architecture en 3 capas

```
Request
   |
   v
Controllers ──── validacion de entrada (Joi) y manejo HTTP
   |
   v
Services ─────── reglas de negocio, transacciones, APIs externas
   |
   v
Repositories ─── acceso a datos (SQL parametrizado)
   |
   v
MySQL 8.0
```

Cada modulo sigue exactamente el mismo patron de archivos:

```
src/routes/<entidad>.routes.js        registro de endpoints + middlewares
src/controllers/<entidad>.controller.js
src/services/<entidad>.service.js
src/repositories/<entidad>.repository.js
```

### Principios invariantes

- **Multitenancy estricto**: toda tabla transaccional pertenece a una empresa; cada consulta filtra por el tenant resuelto desde el token, nunca desde la URL.
- **Soft delete**: los registros nunca se eliminan fisicamente; se marcan con fecha de borrado y todas las lecturas los excluyen.
- **Cadena de middlewares obligatoria** en rutas protegidas: autenticacion JWT, resolucion de tenant y verificacion de roles, siempre en ese orden.
- **Respuestas uniformes**: todos los endpoints responden con el mismo envelope `{ ok, data, message }`.
- **Errores controlados**: los services lanzan errores tipados con codigo HTTP; un handler global los traduce a la respuesta correcta.
- **IDs UUID v4** generados en el repositorio al momento de la insercion.

### Roles

| Rol | Alcance |
|---|---|
| `platform_admin` | Operador de la plataforma (bypass de tenant) |
| `super_admin` | Dueno del negocio, todas las sucursales |
| `admin_sucursal` | Administracion de una sucursal |
| `estilista` | Acceso restringido a su propia agenda |

---

## Stack tecnologico

### Backend

| Tecnologia | Uso |
|---|---|
| Node.js + Express | API REST |
| MySQL 8.0 (`mysql2`) | Persistencia, pool de conexiones, transacciones |
| JSON Web Tokens | Autenticacion (access + refresh) |
| bcrypt | Hash de contrasenas |
| Joi | Validacion de entrada |
| Nodemailer | Correos transaccionales |
| Twilio | SMS (opcional, degradacion silenciosa) |
| MercadoPago SDK | Pagos en linea via webhook |
| node-cron | Recordatorios automaticos de citas |

### Frontend

| Tecnologia | Uso |
|---|---|
| React 19 + Vite 6 | SPA |
| React Router 7 | Enrutamiento |
| TanStack Query v5 | Estado de servidor, cache e invalidacion |
| Zustand v5 | Estado global (sesion, carrito) con persistencia |
| Tailwind CSS v4 | Estilos |
| Three.js | Escena WebGL del hero de la landing |
| GSAP + ScrollTrigger | Animaciones cinematograficas por seccion |
| Lenis | Scroll suave de alta gama |

---

## Backend

### Modulos / endpoints

**Publicos (sin autenticacion):**

| Modulo | Descripcion |
|---|---|
| `reserva` | Flujo de reserva en linea: sucursales, servicios, estilistas, disponibilidad de horarios y creacion de cita |
| `tienda` | Catalogo publico por sucursal, categorias y creacion de ordenes con descuento de stock |
| `portal` | Acceso del cliente final con codigo OTP de un solo uso enviado por email |
| `resena` (por token) | Resena verificada generada al completar una cita, con filtro de lenguaje configurable |
| `quiosco` | Registro de visitas en tienda |
| Webhook de pagos | Confirmacion asincrona de MercadoPago |

**Protegidos (JWT + tenant + roles):**

| Modulo | Descripcion |
|---|---|
| `auth` | Login, refresh token, perfil |
| `citas` | CRUD + maquina de estados (pendiente de pago, confirmada, en proceso, completada, cancelada) con transiciones validadas por rol |
| `estilistas` | Personal, horarios semanales y bloqueos de agenda |
| `servicios` / `categorias` / `productos` | Catalogo del negocio |
| `inventario` | Stock por sucursal, alertas de stock minimo por email |
| `ordenes` / `pagos de orden` | Venta de productos, estados de entrega, confirmacion de pago en efectivo |
| `clientes` / `notas` | Expediente del cliente e historial |
| `lealtad` | Puntos por consumo, canje como descuento, ajustes manuales y bonus en fechas especiales |
| `promociones` | Descuentos aplicados automaticamente al reservar |
| `reportes` / `dashboard` | Metricas operativas y de ingresos |
| `retencion` | Identificacion de clientes inactivos |
| `platform` | Onboarding de nuevos tenants |

### Comportamientos automatizados

- Al **crear una cita** se valida solapamiento de agenda, se genera el registro de pago y se asigna estilista disponible automaticamente si el cliente no elige uno.
- Al **completar una cita** se genera la invitacion a resena (email y SMS) y se acumulan puntos de lealtad — con multiplicador en cumpleanos del cliente.
- Al **entregar una orden** se acumulan puntos; al **cancelarla** se repone stock y se marca el reembolso.
- Un **cron de recordatorios** envia email/SMS a las citas confirmadas dentro de la ventana de 24 horas.
- La **disponibilidad de horarios** cruza tres fuentes: horario semanal del estilista, bloqueos de agenda y citas existentes.
- **Auditoria**: middleware de log para toda mutacion, con registro de IP en inicios de sesion.

---

## Frontend

### Paginas publicas (cliente final)

| Ruta | Pagina |
|---|---|
| `/` | Landing cinematografica: parallax de capas con la escena de la barberia que reacciona al scroll y al cursor, animaciones GSAP por seccion, scroll suave Lenis, collage animado de trabajos y contadores de metricas |
| `/reservar` | Wizard de reserva en 6 pasos con barra de progreso |
| `/tienda` | E-commerce: catalogo con busqueda y filtros, carrito persistente (Zustand), checkout como invitado y confirmacion de orden |
| `/portal` | Portal del cliente con login OTP: proximas citas, historial, puntos y ordenes |
| `/resena/:token` | Calificacion verificada post-servicio |

### Panel administrativo

| Ruta | Pagina |
|---|---|
| `/login` | Acceso del personal |
| `/dashboard` | Metricas del dia y accesos rapidos |
| `/citas` | Agenda con cambio de estados y filtros |
| `/clientes` | Directorio, expediente y notas |
| `/estilistas` | Personal, horarios y bloqueos |
| `/servicios` | Catalogo de servicios |
| `/tienda` | Productos, inventario y ordenes |
| `/reportes` | Ingresos y rendimiento |
| `/ajustes` | Configuracion del negocio |
| `/quiosco` | Registro de visitas en mostrador |

### Detalles de UX

- Sistema de diseno propio: paleta dorado/negro consistente en todas las vistas publicas, navbar compartido.
- Animaciones con respeto a `prefers-reduced-motion` (la pagina es totalmente funcional sin ellas).
- Rendimiento cuidado: Three.js separado en su propio chunk con carga diferida, render pausado fuera del viewport, imagenes lazy y solo transforms GPU en animaciones.
- Responsivo en todos los puntos de quiebre (movil, tablet, escritorio).

---

## Integraciones

| Servicio | Proposito | Si no esta configurado |
|---|---|---|
| Gmail SMTP | Recordatorios, OTP del portal, invitaciones a resena, alertas de stock | Los envios fallan en runtime sin tumbar el flujo principal |
| Twilio | SMS de recordatorio y resena | Se omiten silenciosamente |
| MercadoPago | Pago en linea de citas via webhook firmado | Disponible pago en efectivo |

Los envios de email/SMS son **non-blocking**: nunca retrasan ni rompen la respuesta de la operacion principal.

---

## Seguridad

- Autenticacion JWT con refresh token; contrasenas con bcrypt.
- Acceso del cliente final mediante **OTP de 6 digitos** enviado por email: expira en 10 minutos y es de un solo uso (sin contrasenas para el cliente).
- Aislamiento de tenant verificado en middleware y reforzado en cada consulta SQL.
- Control de acceso por roles en cada endpoint; el rol de estilista solo ve su propia agenda.
- SQL 100% parametrizado (sin concatenacion de cadenas).
- Validacion de toda entrada con Joi antes de tocar la capa de negocio.
- Verificacion de firma en el webhook de pagos.
- Filtro configurable de lenguaje inapropiado en resenas publicas.
- Variables sensibles fuera del codigo: ver `.env.example` (sin valores reales en el repositorio).

---

## Instalacion y puesta en marcha

### Requisitos

- Node.js 18+
- MySQL 8.0

### 1. Base de datos

Crear la base de datos e importar el esquema SQL del proyecto (tablas, indices y datos semilla).

### 2. Backend

```bash
cd MiCorte-backend
npm install
cp .env.example .env   # completar con tus credenciales
npm run dev            # desarrollo (nodemon) — http://localhost:3000
npm start              # produccion
```

Variables a configurar en `.env` (ver `.env.example` para la lista completa): conexion a MySQL, secretos JWT, origenes CORS, credenciales SMTP, MercadoPago y Twilio (opcionales), y parametros del programa de lealtad.

### 3. Frontend

```bash
cd MiCorte-frontend
npm install
npm run dev            # http://localhost:5173
npm run build          # bundle de produccion
```

El frontend espera la API en `/api` (proxy de Vite en desarrollo) o en la URL definida por `VITE_API_URL`.

---

## Estructura del proyecto

```
MiCorte/
├── MiCorte-backend/
│   └── src/
│       ├── config/          # pool MySQL (UTC, decimales numericos)
│       ├── middlewares/     # auth JWT, tenant guard, RBAC, audit log
│       ├── routes/          # 25 modulos de rutas
│       ├── controllers/     # validacion Joi + HTTP
│       ├── services/        # reglas de negocio y transacciones
│       ├── repositories/    # SQL parametrizado
│       ├── jobs/            # cron de recordatorios
│       └── utils/           # respuestas, errores, email, SMS
│
└── MiCorte-frontend/
    └── src/
        ├── components/
        │   ├── layout/      # navbar compartido
        │   ├── landing/     # escena parallax de la barberia
        │   └── three/       # canvas WebGL
        ├── pages/           # 15 paginas (publicas + admin)
        ├── store/           # Zustand: sesion, portal, carrito
        └── lib/             # clientes axios (admin / portal)
```

---

## Fases de desarrollo

| Fase | Entregables |
|---|---|
| **F0 — Fundacion** | Arquitectura en capas, autenticacion JWT + refresh, RBAC, multitenancy, soft delete |
| **F1 — Operacion del salon** | Citas con maquina de estados, disponibilidad de agenda, estilistas y horarios, servicios, clientes |
| **F2 — Pagos y comunicacion** | MercadoPago + webhook, pago en efectivo, recordatorios por email/SMS (cron), resenas verificadas por token |
| **F3 — Tienda y lealtad** | Productos, inventario por sucursal, ordenes, puntos de fidelidad con canje |
| **F4 — Crecimiento** | Onboarding publico de tenants, promociones automaticas, alertas de stock, retencion de clientes, auditoria de mutaciones, portal del cliente con OTP, tienda publica y landing animada |

El detalle de cada cambio esta en el `CHANGELOG.md` del backend.

---

## Licencia

Proyecto privado. Todos los derechos reservados.
