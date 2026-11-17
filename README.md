<img width="1536" height="1024" alt="99c65264-b4c5-447a-9f9b-4180013e07cd" src="https://github.com/user-attachments/assets/a36d6af1-edfc-4adb-8c77-bbbe9a703536" />

# SECCT — Sistema de Evaluación de Calidad de Carne de Tilapia

**SECCT** es una plataforma web y móvil (**Android / Capacitor**) en arquitectura de dos niveles para registrar y evaluar la calidad sensorial y fisicoquímica de lotes de tilapia bajo las normas técnicas colombianas **NTC 1443** y **GTC 157**. El piscicultor registra lotes, captura o sube fotografías de cada unidad de muestra y el sistema clasifica `OJO` y `PIEL` en la escala NTC 1 a 5 mediante inteligencia artificial (Google Gemini Vision API / modelo CNN), consolidando el cierre del lote, reportes versionados con gráficas estadísticas y exportación a PDF.

---

## Despliegue en Vivo y Entregables

| Entorno | URL / Ubicación | Estado |
| :--- | :--- | :--- |
| **Aplicación Web (Vercel)** | [https://secct.vercel.app/](https://secct.vercel.app/) | En producción |
| **API Backend (Render)** | [https://secct-backend.onrender.com](https://secct-backend.onrender.com) (`GET /actuator/health`) | En producción |
| **Cliente Móvil Android (APK)** | `frontend/android/app/build/outputs/apk/debug/app-debug.apk` | Compilado y conectado a Render |

---

## Matriz de Cumplimiento — Entrega Final

| Requerimiento de Rúbrica | Implementación y Evidencia en el Repositorio |
| :--- | :--- |
| **1. Versión Web y Móvil** | Web SPA en `frontend/src/` y app híbrida Android con **Capacitor 8** (`frontend/capacitor.config.ts`, `frontend/android/`, `frontend/src/services/platform.ts`, permisos en `frontend/android/app/src/main/AndroidManifest.xml`, APK en `frontend/android/app/build/outputs/apk/debug/app-debug.apk`). |
| **2. Arquitectura en 2 Niveles** | Nivel 1 (Presentación/Cliente React + Capacitor en `frontend/src/`) desacoplado vía HTTPS REST/JSON (`frontend/src/services/apiClient.ts`) del Nivel 2 (Lógica y Persistencia Spring Boot + PostgreSQL en `backend/src/main/java/co/unillanos/secct/`). |
| **3. ORM y Migraciones** | **Spring Data JPA / Hibernate** con 10 entidades en `backend/src/main/java/co/unillanos/secct/entities/`, repositorios en `backend/src/main/java/co/unillanos/secct/infrastructure/repositories/` y migraciones versionadas **Flyway** (`V1` a `V9`) en `backend/src/main/resources/db/migration/`. |
| **4. Accesibilidad (> 70 / WCAG 2.1 AA)** | Contraste WCAG AA (`#094b72`, `#003465`, `#1E293B`), enlace de salto `#main-content` en `frontend/src/App.tsx`, foco visible `:focus-visible`, etiquetas `<label htmlFor>`, regiones `aria-live="polite"` y estados `:disabled` en `frontend/src/styles.css`. |
| **5. Complemento de Accesibilidad** | Widget persistente `frontend/src/components/AccessibilityWidget.tsx` con 5 ajustes (tamaño de fuente, alto contraste, escala de grises, subrayado de enlaces y reducir animaciones) persistidos vía `frontend/src/services/accessibilityStorage.ts` (`localStorage` + `@capacitor/preferences`). |
| **6. Minificación y Ofuscación** | Pipeline de build en `frontend/vite.config.ts` con `build.sourcemap: false`, `build.minify: "esbuild"` (`drop: ["console", "debugger"]`, minificación de identificadores, sintaxis y espacios) y plugin `javascript-obfuscator` en `renderChunk`. |
| **7. Web Services (REST + IA externa)** | 8 controladores REST Spring WebMVC en `backend/src/main/java/co/unillanos/secct/adapters/controllers/` protegidos con JWT (`SecurityConfig.java`, `JwtService.java`) e integración externa con Gemini Vision API / CNN en `backend/src/main/java/co/unillanos/secct/infrastructure/classifier/HttpCnnClassifier.java`. |
| **8. Generador de Reportes y Gráficas** | `backend/src/main/java/co/unillanos/secct/infrastructure/reports/JasperReportGenerator.java` junto con plantillas **JasperReports** `backend/src/main/resources/reports/batch-report.jrxml` (PDF A4 vertical en zona horaria `America/Bogota`) y `chart.jrxml` (gráfica PNG de barras). |
| **9. Evidencia de Pruebas (271 tests)** | **240** pruebas automatizadas Backend (JUnit 5 + Mockito + MockMvc + H2 + JaCoCo) en `backend/src/test/java/co/unillanos/secct/` y **31** pruebas Frontend (Vitest) en `frontend/src/**/*.test.ts`. |
| **10. Logs (Archivo y Auditoría BD)** | Trazas SLF4J hacia `backend/logs/secct.log` configuradas en `backend/src/main/resources/application.yml` (`GlobalExceptionHandler.java`, `AuthService.java`, `BatchService.java`, `EvaluationService.java`, `ReportService.java`, `LogService.java`) más auditoría en tabla `log` con enmascaramiento de datos sensibles (`RNF-SEC-04`). |
| **11. Internacionalización (ES / EN)** | Contexto bilingüe completo Español / Inglés en `frontend/src/i18n/I18nContext.tsx` y diccionario `frontend/src/i18n/translations.ts`, con pruebas en `frontend/src/services/i18n.test.ts`. |
| **12. Responsive Design** | Diseño adaptable móvil-primero con Tailwind CSS 4 (`frontend/src/styles.css`), `viewport-fit=cover` y `safe-area-inset` en `frontend/index.html` y barra lateral/hamburguesa adaptable en `frontend/src/components/SideNav.tsx`. |
| **13. Semántica HTML5** | Uso estricto de `<header>`, `<nav>`, `<main id="main-content">`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<dl>/<dt>/<dd>` y jerarquía de encabezados `<h1>–<h3>` en `frontend/src/App.tsx`, `frontend/src/pages/` y `frontend/src/components/`. |

---

## Funcionalidades (HU-01 a HU-14)

| HU | Funcionalidad | Rol | Estado |
| :--- | :--- | :--- | :--- |
| **HU-01** | Registro de usuarios | Piscicultor | Implementada |
| **HU-02** | Inicio y cierre de sesión (JWT) | Ambos | Implementada |
| **HU-03** | Registro de lotes | Piscicultor | Implementada |
| **HU-04** | Evaluación de lotes (clasificación por imagen y cierre) | Piscicultor | Implementada |
| **HU-05** | Consulta de lotes evaluados | Piscicultor | Implementada |
| **HU-06** | Generación de reporte y gráfica estadística en lectura | Piscicultor | Implementada |
| **HU-07** | Monitoreo del sistema | Administrador | Implementada |
| **HU-08** | Baja lógica de usuario (`POST /api/users/me/delete`) | Piscicultor | Implementada |
| **HU-09** | Eliminación lógica de lote y reportes asociados | Piscicultor | Implementada |
| **HU-10** | Almacenamiento y versionado de reportes | Piscicultor | Implementada |
| **HU-11** | Consulta de reportes guardados | Piscicultor | Implementada |
| **HU-12** | Exportación de reporte a PDF (JasperReports) | Piscicultor | Implementada |
| **HU-13** | Ampliación de muestra en lote evaluado/reportado | Piscicultor | Implementada |
| **HU-14** | Eliminación lógica de versión de reporte | Piscicultor | Implementada |

### Reglas de negocio principales

- Todo usuario registrado recibe el rol `PISCICULTOR`. El rol `ADMINISTRADOR` está restringido a gestión interna y en el cliente web accede al panel de monitoreo (`#/admin`); en la app móvil Android se protege el flujo exclusivamente para el rol piscicultor (HU-02 a HU-06).
- Un lote tiene fecha de captura (no futura), peso entre `0,01` y `10.000` kg, entre `1` y `500` unidades de muestra y observaciones opcionales (máx. 500 caracteres).
- Estados del lote: `ABIERTO` → `EN_EVALUACION` → `EVALUADO` → `REPORTADO` (reversible a `EVALUADO` si se elimina el reporte vigente o reabrible a `EN_EVALUACION` mediante HU-13).
- Cada unidad se evalúa con una imagen (máx. 5 MB, formato JPG/PNG validado por cabecera binaria). No se permite evaluar dos veces la misma imagen en un lote (control por hash SHA-256).
- El clasificador evalúa `OJO` y `PIEL` en categoría NTC de `1` a `5`; al cerrar el lote calcula la clasificación final promedio redondeada a 2 decimales.

---

## Arquitectura y Estructura del Proyecto

```text
Navegador Web (Vercel) / APK Android (Capacitor)  ──HTTPS/JSON──►  Backend API (Render / Docker Java 21)
                                                                            │
                                                   ┌────────────────────────┴────────────────────────┐
                                                   ▼                                                 ▼
                                         PostgreSQL (Supabase)                           Google Gemini Vision API
```

| Componente | Tecnología |
| :--- | :--- |
| **Backend** | Spring Boot 4.1.1, Java 21, Maven Wrapper, Spring Security, Spring Data JPA, Flyway, JasperReports 7, Actuator |
| **Autenticación** | JWT HS256 (`jjwt 0.12.6`), expiración configurable de 30 minutos por defecto |
| **Base de datos** | PostgreSQL en Supabase (migraciones `V1` a `V9` + `H2` para suite unitaria/integración) |
| **Frontend Web & Móvil** | React 19, TypeScript, Vite 8 (`esbuild` + `javascript-obfuscator`), Tailwind CSS 4, Capacitor 8 Android |
| **Servicio IA / CNN** | Integración directa con `gemini-3.5-flash-lite:generateContent` en `HttpCnnClassifier` y respaldo Python/FastAPI en `servicioCNN/` |

```text
secct/
├── backend/
│   ├── Dockerfile                          Imagen multi-etapa Java 21 con fonts-dejavu-core para JasperReports
│   └── src/
│       ├── main/java/co/unillanos/secct/
│       │   ├── entities/                   Entidades JPA de dominio (User, Batch, Evaluation, Report, Log, etc.)
│       │   ├── usecases/                   dto/, exceptions/, ports/, services/
│       │   ├── adapters/                   controllers/ (REST + GlobalExceptionHandler), security/
│       │   └── infrastructure/             config/, classifier/, reports/, repositories/, security/
│       ├── main/resources/
│       │   ├── application.yml
│       │   ├── db/migration/               Migraciones Flyway V1 a V9
│       │   └── reports/                    Plantillas JasperReports (batch-report.jrxml y chart.jrxml)
│       └── test/java/co/unillanos/secct/   Suite de 240 pruebas unitarias e integración
├── frontend/
│   ├── vite.config.ts                      Minificación esbuild, sourcemap: false y ofuscación JS
│   ├── capacitor.config.ts                 Configuración Capacitor (co.unillanos.secct)
│   ├── android/                            Proyecto nativo Android Gradle y app-debug.apk
│   └── src/
│       ├── components/, pages/, i18n/, services/, types/, validation/
│       └── **/*.test.ts                    Suite de 31 pruebas unitarias en Vitest
├── servicioCNN/                            Servicio local alternativo de inferencia (FastAPI + TensorFlow)
├── models/                                 Modelo CNN entrenado (modelo_calidad_tilapia.h5)
├── docs/                                   Documentación de requerimientos, casos de uso y diagramas
└── README.md
```

---

## Configuración y Ejecución Local

### Requisitos
- **Java 21** (el proyecto incluye `./mvnw` / `mvnw.cmd`)
- **Node.js 20+** y `npm`
- Acceso a **PostgreSQL (Supabase)** y clave `GEMINI_API_KEY` (opcional `servicioCNN` con Python 3.13)

### Variables de entorno del Backend (`backend/.env`)

```env
DB_URL=jdbc:postgresql://<host>:5432/postgres?sslmode=require
DB_USERNAME=<usuario>
DB_PASSWORD=<contraseña>
JWT_SECRET=<clave de al menos 32 caracteres>
GEMINI_API_KEY=<clave API de Google Gemini>
```

| Variable | Valor por defecto | Descripción |
| :--- | :--- | :--- |
| `PORT` | `8080` | Puerto HTTP del servidor (Render / local) |
| `DB_POOL_SIZE` | `20` | Tamaño máximo del pool HikariCP |
| `JWT_EXPIRATION_MINUTES` | `30` | Duración del token JWT en minutos |
| `CNN_URL` | `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent` | Endpoint del clasificador |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen adicional permitido en CORS |

### Comandos de arranque

```bash
# Terminal 1: Backend (Spring Boot)
cd backend
./mvnw spring-boot:run          # En Windows PowerShell: .\mvnw.cmd spring-boot:run

# Terminal 2: Frontend (React + Vite)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

---

## API REST y Rutas del Frontend

Todos los endpoints bajo `/api/**` requieren cabecera `Authorization: Bearer <token>`, salvo registro, login y `/actuator/health`.

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/registro` y `/api/users` | Registrar usuario (HU-01) | Público |
| `POST` | `/api/auth/login` | Iniciar sesión JWT (HU-02) | Público |
| `POST` | `/api/auth/logout` | Cerrar sesión y registrar auditoría (HU-02) | Autenticado |
| `POST` | `/api/users/me/delete` | Baja lógica de la cuenta propia (HU-08) | Autenticado |
| `POST` | `/api/batches` | Registrar lote (HU-03) | Autenticado |
| `GET` | `/api/batches` y `/api/batches/available` | Listar lotes abiertos o en evaluación | Autenticado |
| `GET` | `/api/batches/evaluated` | Listar lotes evaluados o reportados (HU-05) | Autenticado |
| `GET` | `/api/batches/{code}` | Consultar lote por código | Autenticado |
| `DELETE` | `/api/batches/{code}` | Eliminación lógica de lote y reportes (HU-09) | Autenticado |
| `POST` | `/api/batches/{code}/expand` | Ampliar muestra de lote evaluado (HU-13) | Autenticado |
| `POST` | `/api/evaluations/batches/{code}/units` | Evaluar unidad por imagen multipart (HU-04) | Autenticado |
| `POST` | `/api/evaluations/batches/{code}/close` | Cerrar evaluación y calcular categoría NTC | Autenticado |
| `GET` | `/api/reports/batches/{code}` | Generar reporte previo y gráfica PNG (HU-06) | Autenticado |
| `POST` | `/api/reports/batches/{code}` | Guardar nueva versión de reporte (HU-10) | Autenticado |
| `GET` | `/api/reports` y `/api/reports/{id}` | Listar o consultar reportes guardados (HU-11) | Autenticado |
| `GET` | `/api/reports/{id}/pdf` | Exportar reporte en PDF A4 (HU-12) | Autenticado |
| `DELETE` | `/api/reports/{id}` | Eliminación lógica de versión de reporte (HU-14) | Autenticado |
| `GET` | `/api/admin/system-info` | Monitoreo y conteos globales del sistema (HU-07) | `ADMINISTRADOR` |
| `GET` | `/actuator/health` | Estado de salud del servicio | Público |

### Rutas del cliente SPA (`hash`)
- Públicas: `#/login`, `#/registro`
- Piscicultor (Web y Móvil): `#/register`, `#/evaluate`, `#/evaluados`, `#/reportes/lote`
- Piscicultor (Web escritorio): `#/gestion`, `#/reportes`, `#/reportes/{id}`, `#/cuenta`
- Administrador (Web escritorio): `#/admin`

---

## Pruebas Automatizadas y Compilación de Producción

### Backend (`240` pruebas)

```bash
cd backend
./mvnw test                     # Windows PowerShell: .\mvnw.cmd test
```

### Frontend (`31` pruebas + build minificado/ofuscado + Android APK)

```bash
cd frontend
npm test                        # 31 pruebas unitarias en Vitest
npm run build                   # Compilación TS + minificación esbuild + ofuscación JS (sin sourcemaps)
npx cap sync android            # Sincronización con proyecto Capacitor Android
```

---

## Registros (Logs) y Auditoría

- **Archivo de trazas de aplicación:** `backend/logs/secct.log` (SLF4J/Logback con eventos de negocio, validaciones `WARN` en `GlobalExceptionHandler` / servicios y excepciones `ERROR`).
- **Auditoría transaccional en BD:** tabla `log` administrada por `LogService` con enmascaramiento automático de correos y teléfonos (`RNF-SEC-04`).

---

## Equipo

Proyecto desarrollado por el equipo **Starbyte** — Universidad de los Llanos.

---

*Universidad de los Llanos · Ingeniería de Sistemas*
