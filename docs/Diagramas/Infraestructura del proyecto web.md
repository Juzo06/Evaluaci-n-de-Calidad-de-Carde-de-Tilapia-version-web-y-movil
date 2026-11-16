# Infraestructura de la capa web — SECCT (Sprint 1: HU-01 a HU-05)

## 1. Estructura del Proyecto Monorepo

```text
secct/  
├── backend/                                   ← API REST (Spring Boot 4.1.1, Java 21, Maven)  
│   ├── pom.xml  
│   ├── .env                                   ← Variables de entorno locales (DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET)  
│   ├── mvnw / mvnw.cmd  
│   └── src/  
│       ├── main/  
│       │   ├── java/co/unillanos/secct/  
│       │   │   ├── SecctApplication.java  
│       │   │   ├── entities/                  ← Entidades JPA y Dominio  
│       │   │   │   ├── Batch.java  
│       │   │   │   ├── BatchStatus.java  
│       │   │   │   ├── Evaluation.java  
│       │   │   │   ├── EvaluationPoint.java  
│       │   │   │   ├── EventType.java  
│       │   │   │   ├── FishPart.java  
│       │   │   │   ├── Log.java              ← Entidad única de auditoría transversal (tabla "log")  
│       │   │   │   ├── Role.java  
│       │   │   │   └── User.java  
│       │   │   ├── usecases/                  ← Casos de Uso y Lógica de Aplicación  
│       │   │   │   ├── dto/                   ← DTOs de Solicitud/Respuesta y validadores  
│       │   │   │   │   ├── BatchResponseDTO.java  
│       │   │   │   │   ├── ClassificationResult.java  
│       │   │   │   │   ├── ErrorResponseDTO.java  
│       │   │   │   │   ├── EvaluationResponseDTO.java  
│       │   │   │   │   ├── LoginRequestDTO.java / LoginResponseDTO.java  
│       │   │   │   │   ├── RegisterBatchRequestDTO.java  
│       │   │   │   │   ├── RegisterUserRequestDTO.java / RegisterUserResponseDTO.java  
│       │   │   │   │   └── TrimmedLength.java / TrimmedLengthValidator.java  
│       │   │   │   ├── exceptions/            ← Excepciones de negocio (BusinessException)  
│       │   │   │   ├── ports/                 ← Puertos / Interfaces (Classifier)  
│       │   │   │   └── services/              ← Servicios de negocio  
│       │   │   │       ├── AuthService.java          ← HU-02 (login / logout, auditoría de acceso)  
│       │   │   │       ├── UserService.java          ← HU-01 (registro de usuarios y validaciones)  
│       │   │   │       ├── PasswordService.java      ← Hash BCrypt y validación de contraseñas  
│       │   │   │       ├── BatchService.java         ← HU-03 / HU-05 (registro y consulta de lotes evaluados)  
│       │   │   │       ├── BatchCodeGenerator.java   ← Generador de código único de lote (SECCT-AAAAMMDD-NNN)  
│       │   │   │       ├── EvaluationService.java    ← HU-04 (evaluación de unidades, validación PL-4.20 y cierre NTC 1443)  
│       │   │   │       ├── ImageValidator.java       ← Validación de formato (JPEG/PNG) y peso (máx. 10MB)  
│       │   │   │       └── LogService.java           ← Auditoría transversal (RNF-REL-01, PI-09 a PI-13)  
│       │   │   ├── adapters/                  ← Adaptadores de Entrada (Controladores REST y Filtros)  
│       │   │   │   ├── controllers/           ← RegistrationController, AuthController, BatchController,  
│       │   │   │   │                            EvaluationController, GlobalExceptionHandler  
│       │   │   │   └── security/              ← JwtAuthenticationFilter  
│       │   │   └── infrastructure/            ← Infraestructura y Persistencia  
│       │   │       ├── config/                ← SecurityConfig (cadena de filtros, CORS, rutas públicas)  
│       │   │       ├── classifier/            ← Cliente HTTP para Servicio CNN (HttpCnnClassifier → POST /evaluar)  
│       │   │       ├── repositories/          ← Repositorios Spring Data JPA  
│       │   │       │   ├── BatchRepository / BatchStatusRepository / BatchEvaluationCount  
│       │   │       │   ├── EvaluationRepository / FishPartRepository  
│       │   │       │   ├── EventTypeRepository / LogRepository  
│       │   │       │   └── RoleRepository / UserRepository  
│       │   │       └── security/              ← JwtService (Gestión de tokens JWT HMAC-SHA256, expiración 30 min)  
│       │   └── resources/  
│       │       ├── application.yml            ← Entorno, BD (PostgreSQL/Supabase), JWT, CORS, CNN, Actuator y logs  
│       │       └── db/migration/              ← Migraciones Flyway (V1, V2, V3, V4, V6, V7)  
│       │           ├── V1__create_batch_registration_tables.sql  
│       │           ├── V2__create_evaluation_tables.sql  
│       │           ├── V3__create_auth_and_audit_tables.sql  
│       │           ├── V4__seed_data.sql  
│       │           ├── V6__seed_data.sql  
│       │           └── V7__cleanup_legacy_log_columns.sql  
│       └── test/                              ← Pruebas unitarias e integración (controladores, DTOs, entidades, servicios)  
│  
├── frontend/                                  ← Cliente Web (React 19 + Vite 8 + TypeScript 7 + Tailwind CSS 4)  
│   ├── index.html  
│   ├── vite.config.ts                         ← Proxy /api → http://localhost:8080  
│   ├── package.json  
│   └── src/  
│       ├── App.tsx                            ← Enrutador hash con control de acceso por sesión y rol  
│       ├── main.tsx                           ← Punto de entrada React  
│       ├── index.css / styles.css             ← Estilos globales (Tailwind CSS + personalizaciones de diseño)  
│       ├── components/                        ← Componentes UI modulares  
│       │   ├── BatchRegistrationForm.tsx  
│       │   ├── BatchResultCard.tsx  
│       │   ├── BatchSelector.tsx  
│       │   ├── SideNav.tsx  
│       │   ├── UnitImageForm.tsx  
│       │   ├── UnitResultsCard.tsx  
│       │   ├── UserRegistrationForm.tsx  
│       │   └── UserRegistrationResultCard.tsx  
│       ├── pages/                             ← Vistas de usuario del Sprint 1 (HU-01 a HU-05)  
│       │   ├── RegisterUserPage.tsx           ← Pantalla HU-01 (Registro de usuario)  
│       │   ├── LoginPage.tsx                  ← Pantalla HU-02 (Inicio de sesión)  
│       │   ├── RegisterBatchPage.tsx          ← Pantalla HU-03 (Registro de lote)  
│       │   ├── EvaluateBatchPage.tsx          ← Pantalla HU-04 (Evaluación de lote por unidad)  
│       │   ├── EvaluatedBatchesPage.tsx       ← Pantalla HU-05 (Consulta de lotes evaluados)  
│       │   └── AdminPage.tsx                  ← Panel de administración (vista de auditoría y monitoreo)  
│       ├── services/                          ← Clientes API REST y almacenamiento de sesión  
│       │   ├── apiClient.ts                   ← Cliente HTTP (apiPost, apiGet, apiPostForm) y gestión de 401  
│       │   ├── authStorage.ts                 ← Gestión de sesión en localStorage (token JWT, rol, usuario)  
│       │   ├── authService.ts                 ← Consumo de endpoints de Autenticación y Registro  
│       │   ├── batchService.ts                ← Consumo de endpoints de Lotes  
│       │   └── evaluationService.ts           ← Consumo de endpoints de Evaluación  
│       ├── types/                             ← Tipos e interfaces TypeScript (auth.ts, batch.ts, evaluation.ts)  
│       └── validation/                        ← Validaciones frontend de formularios e imágenes  
│           ├── authValidation.ts  
│           ├── batchValidation.ts  
│           └── imageValidation.ts  
│  
├── servicioCNN/                               ← Servicio de inferencia Python/FastAPI (puerto 8000)  
│   ├── servicio_inferencia.py                 ← Servicio CNN con TensorFlow / Keras (GET / y POST /evaluar)  
│   ├── mock_servicio_inferencia.py            ← Mock liviano FastAPI para desarrollo y pruebas (GET / y POST /evaluar)  
│   └── requirements.txt                       ← TensorFlow 2.21, FastAPI, Uvicorn, Pillow, NumPy, h5py  
│  
├── models/                                    ← Modelos CNN entrenados (modelo_calidad_tilapia.h5)  
├── docs/                                      ← Documentación, diagramas de diseño y casos de prueba  
│   └── Diagramas/                             ← Diagramas de clases (DC) y secuencias (DS)  
└── README.md                                  ← Instrucciones generales y comandos de arranque del monorepo  
```

---

## 2. Mapa de rutas por historia de usuario (Sprint 1: HU-01 a HU-05)

| HU | Rol | Ruta Frontend | Endpoint Backend (API REST) | Servicio |
| :--- | :--- | :--- | :--- | :--- |
| **HU-01 Registrar usuarios** | Piscicultor | `#/registro` | `POST /api/users`<br>*(alias: `POST /api/auth/registro`)* | `UserService.register` |
| **HU-02 Inicio de sesión** | Ambos (Piscicultor / Administrador) | `#/login` | `POST /api/auth/login`<br>`POST /api/auth/logout` | `AuthService.login`<br>`AuthService.logout` |
| **HU-03 Registrar lote** | Piscicultor | `#/register` | `POST /api/batches` | `BatchService.register` |
| **HU-04 Evaluar lote** | Piscicultor | `#/evaluate` | `GET /api/batches/available`<br>*(o `GET /api/batches`)*<br>`GET /api/batches/{code}`<br>`POST /api/evaluations/batches/{code}/units`<br>`POST /api/evaluations/batches/{code}/close` | `EvaluationService.evaluateUnit`<br>`EvaluationService.closeEvaluation`<br>*(consulta asistida por `BatchService.listAvailable` y `getByCodeAndOwner`)* |
| **HU-05 Consultar lotes evaluados** | Piscicultor | `#/evaluados` | `GET /api/batches/evaluated`<br>*(o `GET /api/batches?estado=EVALUADO`)* | `BatchService.listEvaluated` |

> **Nota de alcance**: Las historias HU-06 a HU-14 corresponden a sprints posteriores y no forman parte del entregable actual del Sprint 1. El rol Administrador cuenta con acceso de autenticación (HU-02) y panel de supervisión en `#/admin`.
