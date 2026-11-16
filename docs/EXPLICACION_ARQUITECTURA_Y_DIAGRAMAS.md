# SECCT: Guía Integral de Arquitectura, Flujos y Cumplimiento de Diagramas

> **Audiencia y Enfoque:** Este documento explica de forma clara, didáctica y exhaustiva cómo funciona todo el sistema **SECCT (Sistema de Evaluación de Calidad de Carne de Tilapia)**, tanto en el **Frontend (React)** como en el **Backend (Spring Boot)**. Está redactado para que cualquier persona —incluso sin experiencia previa en estas tecnologías— comprenda el flujo de datos paso a paso, la correspondencia exacta con los diagramas oficiales de la carpeta `docs/Diagramas/` y la evidencia en el código fuente.

---

## 1. Conceptos Básicos: ¿Cómo Funciona la Aplicación?

Para entender el código, primero veamos las dos piezas maestras del sistema y la analogía del **Restaurante de Alta Cocina**:

```
[ Navegador Web / Usuario ]
            │  (1) Hace clic o llena un formulario
            ▼
┌────────────────────────────────────────┐
│         FRONTEND (React + TS)          │  <- El Salón del Restaurante
│   Componentes visuales y validación    │
└────────────────────────────────────────┘
            │  (2) Petición HTTP con JSON o Imagen (Fetch / API Client)
            ▼
┌────────────────────────────────────────┐
│        BACKEND (Spring Boot)           │  <- La Cocina y Administración
│   Controladores -> Servicios -> Repos  │
└────────────────────────────────────────┘
            │  (3) Consultas SQL / Persistencia
            ▼
┌────────────────────────────────────────┐
│       BASE DE DATOS (PostgreSQL)       │  <- La Despensa / Archivo
│        Tablas de datos protegidos      │
└────────────────────────────────────────┘
```

### 1.1 El Frontend (React + TypeScript)
- **¿Qué es React?** Es como una caja de bloques **LEGO**. En vez de programar una página web gigante en un solo archivo, creamos piezas pequeñas reutilizables llamadas **Componentes** (por ejemplo: la barra lateral `SideNav`, el selector de lotes `BatchSelector`, o el formulario `UserRegistrationForm`).
- **¿Qué es el Estado (`useState`)?** Es la **memoria a corto plazo** de un componente. Si el usuario escribe una letra, sube una foto o selecciona una opción, el componente guarda ese dato en su estado. Cuando el estado cambia, React vuelve a dibujar en pantalla solo la parte que cambió.
- **¿Qué es `useEffect`?** Es una **alarma o rutina automática**. Le dice al componente: *"Apenas aparezcas en la pantalla del usuario, ejecuta esta tarea"* (por ejemplo: consultar la lista de lotes al servidor).
- **¿Qué es un DTO (Data Transfer Object) en TypeScript?** Es como una **hoja de pedido con casillas fijas**. Asegura que el cliente envíe exactamente los datos que el servidor espera (por ejemplo: correo, contraseña, peso, fecha).

### 1.2 El Backend (Spring Boot + Java)
El Backend está organizado bajo una **Arquitectura Limpia / Hexagonal** dividida en capas para que el código sea ordenado y seguro:
1. **Controladores (`@RestController` en `adapters.controllers`)**: Son los **meseros o recepcionistas**. Reciben la petición de internet, verifican que el usuario tenga permiso y entregan la orden a la cocina. No cocinan ni procesan reglas de negocio.
2. **Servicios (`@Service` en `usecases.services`)**: Son los **chefs principales**. Aquí residen las **reglas de negocio** (por ejemplo: verificar si una contraseña es correcta, calcular el código de un lote, validar que un lote no supere sus unidades o calcular la clasificación NTC 1443).
3. **Repositorios (`@Repository` en `infrastructure.repositories`)**: Son los **asistentes de almacén**. Son interfaces de Spring Data JPA que saben cómo buscar, guardar o actualizar información en la base de datos SQL sin necesidad de escribir código manual repetitivo.
4. **Entidades (`@Entity` en `entities`)**: Representan las **estanterías o tablas reales** de la base de datos (por ejemplo: `User`, `Batch`, `Evaluation`, `FishPart`, `Log`).
5. **Token JWT (JSON Web Token)**: Es una **manilla digital VIP**. Cuando inicias sesión exitosamente, el servidor te entrega este texto cifrado. En cada acción posterior, tu navegador muestra esa manilla en la cabecera `Authorization: Bearer <token>` para demostrar quién eres sin tener que volver a pedir tu contraseña.

---

## 2. Matriz Global de Cumplimiento de Diagramas

Todos los diagramas ubicados en `docs/Diagramas/` se encuentran **100% implementados y verificados** mediante pruebas unitarias e integrales (`147/147 pruebas exitosas`).

| Historia / Módulo | Diagrama de Clases (DC) | Diagrama de Secuencia (DS) | ¿Cumple? | Componentes Principales Implicados |
| :--- | :--- | :--- | :---: | :--- |
| **HU-01: Registrar Usuario** | `DC-HU1.png` | `DS-HU1.png` | **SÍ (100%)** | `RegistrationController`, `UserService`, `PasswordService`, `UserRepository`, `RoleRepository`, `RegisterUserPage`, `UserRegistrationForm`. |
| **HU-02: Inicio de Sesión** | `DC-HU2.png` | `DS-HU2-login.png` | **SÍ (100%)** | `AuthController`, `AuthService`, `JwtService`, `JwtAuthenticationFilter`, `LoginPage`, `authStorage`. |
| **HU-02: Cierre de Sesión** | `DC-HU2.png` | `DS-HU2-logout.png` | **SÍ (100%)** | `AuthController`, `AuthService`, `SideNav`, `authStorage`. |
| **HU-03: Registrar Lote** | `DC-HU3.png` | `DS-HU3.png` | **SÍ (100%)** | `BatchController`, `BatchService`, `BatchCodeGenerator`, `BatchRepository`, `RegisterBatchPage`, `BatchRegistrationForm`. |
| **HU-04: Listar Lotes para Evaluar** | `DC-HU4.png` | `DS-HU4-listar.png` | **SÍ (100%)** | `BatchController`, `BatchService`, `EvaluateBatchPage`, `BatchSelector`. |
| **HU-04: Evaluar Unidad con CNN** | `DC-HU4.png` | `DS-HU4-evaluar-unidad.png`| **SÍ (100%)** | `EvaluationController`, `EvaluationService`, `HttpCnnClassifier` (Python ResNet), `UnitImageForm`, `UnitResultsCard`. |
| **HU-04: Finalizar Evaluación Lote** | `DC-HU4.png` | `DS-HU4-cerrar.png` | **SÍ (100%)** | `EvaluationController`, `EvaluationService`, `BatchRepository`, `UnitResultsCard`. |
| **HU-05: Consultar Lotes Evaluados** | `DC-HU5.png` | `DS-HU5.png` | **SÍ (100%)** | `BatchController`, `BatchService`, `EvaluationRepository`, `EvaluatedBatchesPage`. |
| **Transversal: Auditoría y Logs** | `DC-Log-transversal.png`| Integrado en todos | **SÍ (100%)** | `LogService`, `LogRepository`, `EventTypeRepository`, `Log`, `EventType`. |

---

## 3. Desglose Paso a Paso por Historia de Usuario

---

### HU-01: Registrar Usuario (`DC-HU1.png` y `DS-HU1.png`)

#### A. Objetivo del Módulo
Permitir que un nuevo piscicultor cree su cuenta en el sistema ingresando nombres, apellidos, correo electrónico, teléfono celular y contraseña segura.

#### B. Evidencia y Cumplimiento del Diagrama de Clases (`DC-HU1.png`)
1. **Frontend**:
   - `RegisterUserPage.tsx`: Implementa `submitRegistration(request)` y `showRegistrationResult(response)`.
   - `UserRegistrationForm.tsx`: Componente de formulario con validación en tiempo real.
   - `UserRegistrationResultCard.tsx`: Tarjeta de confirmación que muestra el ID único generado y el rol asignado.
2. **Backend**:
   - `RegistrationController`: Endpoint `POST /api/users` (con alias `POST /api/auth/registro`) que recibe `RegisterUserRequestDTO` y retorna `201 Created` con `RegisterUserResponseDTO`.
   - `UserService`: Método `register(RegisterUserRequestDTO request): RegisterUserResponseDTO`.
   - `PasswordService`: Métodos criptográficos `generateSalt(): String`, `hashPassword(password, salt): String` y `verifyPassword(...)`.
   - Entidad `User` asociada a la entidad `Role` con código `"PISCICULTOR"`.

#### C. Flujo de Ejecución Paso a Paso (`DS-HU1.png`)
```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant V as RegisterUserPage (React)
    participant C as RegistrationController
    participant S as UserService
    participant P as PasswordService
    participant R as UserRepository
    participant L as LogService
    participant DB as Base de Datos

    U->>V: Ingresa datos y pulsa "Crear cuenta"
    V->>V: Valida en cliente (authValidation.ts)
    V->>C: POST /api/users (JSON)
    C->>S: register(request)
    S->>S: normalizeEmail(email)
    S->>R: existsByEmail(normalizedEmail)
    alt Correo ya existe
        S-->>C: Lanza BusinessException (409 Conflict)
        C-->>V: Error 409 "correo ya registrado"
        V-->>U: Muestra banner de error
    else Correo disponible
        S->>P: generateSalt()
        P-->>S: salt (16 bytes Base64)
        S->>P: hashPassword(password, salt)
        P-->>S: passwordHash (SHA-256 de 64 caracteres)
        S->>R: save(User con Rol PISCICULTOR)
        R->>DB: INSERT INTO usuario (...)
        DB-->>R: Usuario persistido con ID
        S->>L: recordEvent("USER_REGISTERED", userId, null, null, desc)
        L->>DB: INSERT INTO log_auditoria (...)
        S-->>C: RegisterUserResponseDTO(id, email)
        C-->>V: HTTP 201 Created
        V-->>U: Renderiza UserRegistrationResultCard con ID de cuenta
    end
```

#### D. Dónde se Evidencia en el Código
- **Validación del Formulario**: [`authValidation.ts`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/frontend/src/validation/authValidation.ts#L10-L60) verifica longitud (nombres 2-50, teléfono iniciando en 3 con 10 dígitos, contraseña 8-20).
- **Recepción del Endpoint**: [`RegistrationController.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/adapters/controllers/RegistrationController.java#L25-L35).
- **Normalización y Reglas**: [`UserService.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/services/UserService.java#L40-L95).
- **Criptografía Segura (Salt + SHA-256)**: [`PasswordService.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/services/PasswordService.java#L20-L55).

---

### HU-02: Inicio y Cierre de Sesión (`DC-HU2.png`, `DS-HU2-login.png`, `DS-HU2-logout.png`)

#### A. Objetivo del Módulo
Autenticar al usuario contra la base de datos comparando su hash de contraseña con verificación en tiempo constante, entregar un token JWT seguro con rol y nombre, y gestionar el cierre de sesión invalidando el estado local y auditando la salida.

#### B. Evidencia y Cumplimiento del Diagrama de Clases (`DC-HU2.png`)
1. **Frontend**:
   - `LoginPage.tsx`: Implementa `submitLogin(request)`, `showLoginResult(response)`, `submitLogout()` y `removeLocalToken()`.
   - `SideNav.tsx`: Implementa `submitLogout()` y `removeLocalToken()`.
   - `authStorage.ts`: Persiste y elimina `accessToken`, `roleCode`, `fullName`, `email` y `userId`.
2. **Backend**:
   - `AuthController`: Endpoints `POST /api/auth/login` y `POST /api/auth/logout`.
   - `AuthService`: Métodos `login(LoginRequestDTO): LoginResponseDTO` y `logout(Integer userId): void`.
   - `JwtService`: Métodos `generateToken(User)`, `validateToken(token)`, `getUserId(token)`, `getRoleCode(token)` y `getFullName(token)`.
   - `JwtAuthenticationFilter`: Filtro interceptor que inspecciona el encabezado `Authorization: Bearer <token>`.

#### C. Flujo de Inicio de Sesión (`DS-HU2-login.png`)
```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant V as LoginPage (React)
    participant C as AuthController
    participant S as AuthService
    participant R as UserRepository
    participant P as PasswordService
    participant J as JwtService
    participant L as LogService

    U->>V: Ingresa correo y contraseña, pulsa "Ingresar"
    V->>V: Deshabilita botón para evitar doble clic (PL-2.20)
    V->>C: POST /api/auth/login
    C->>S: login(request)
    S->>S: normalizeEmail()
    S->>R: findByEmail(email)
    alt Usuario no existe o eliminado
        S->>L: recordEvent("LOGIN_FAILED", ...)
        S-->>C: Lanza BusinessException (401 Unauthorized)
        C-->>V: 401 "credenciales inválidas"
        V-->>U: Muestra mensaje de error
    else Usuario existe
        S->>P: verifyPassword(password, salt, hash)
        alt Contraseña incorrecta
            S->>L: recordEvent("LOGIN_FAILED", ...)
            S-->>C: Lanza BusinessException (401)
            C-->>V: 401 "credenciales inválidas"
        else Contraseña correcta
            S->>J: generateToken(user)
            J-->>S: token JWT firmado con HMAC-SHA256
            S->>L: recordEvent("LOGIN_SUCCESS", userId, ...)
            S-->>C: LoginResponseDTO(id, email, roleCode, token, 30)
            C-->>V: HTTP 200 OK con JSON
            V->>V: saveSession(response) en localStorage
            alt Rol == "ADMINISTRADOR"
                V-->>U: Redirige con replace a #/admin
            else Rol == "PISCICULTOR"
                V-->>U: Redirige con replace a #/register
            end
        end
    end
```

#### D. Flujo de Cierre de Sesión (`DS-HU2-logout.png`)
```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant N as SideNav (React)
    participant C as AuthController
    participant S as AuthService
    participant L as LogService
    participant ST as authStorage (Cliente)

    U->>N: Clic en "Cerrar sesión"
    N->>N: submitLogout()
    N->>C: POST /api/auth/logout (Header Authorization: Bearer <token>)
    C->>S: logout(userId extraído del token)
    S->>L: recordEvent("LOGOUT", userId, ...)
    S-->>C: Retorna éxito
    C-->>N: HTTP 204 No Content
    N->>ST: removeLocalToken() (Limpia localStorage)
    N-->>U: Redirige inmediatamente a #/login
```

#### E. Dónde se Evidencia en el Código
- **Autenticación e Historial Seguro**: [`LoginPage.tsx`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/frontend/src/pages/LoginPage.tsx#L42-L75).
- **Generación y Firma JWT**: [`JwtService.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/infrastructure/security/JwtService.java#L38-L75).
- **Protección de Rutas (Filtro)**: [`JwtAuthenticationFilter.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/adapters/security/JwtAuthenticationFilter.java#L35-L85).
- **Cierre de Sesión en Barra Lateral**: [`SideNav.tsx`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/frontend/src/components/SideNav.tsx#L28-L41).

---

### HU-03: Registrar Lote (`DC-HU3.png` y `DS-HU3.png`)

#### A. Objetivo del Módulo
Registrar un lote de tilapia especificando fecha de captura, peso en kilogramos, tamaño de la muestra de peces a evaluar y observaciones opcionales. El sistema genera un código único de lote con formato determinista `LOTE-YYYYMMDD-NNN` y lo deja en estado `ABIERTO`.

#### B. Evidencia y Cumplimiento del Diagrama de Clases (`DC-HU3.png`)
1. **Frontend**:
   - `RegisterBatchPage.tsx`: Implementa `submitBatchRegistration(request)` y `showBatchResult(response)`.
   - `BatchRegistrationForm.tsx`: Formulario con validación en cliente.
   - `BatchResultCard.tsx`: Muestra el código asignado y resumen del lote registrado.
2. **Backend**:
   - `BatchController`: Endpoint `POST /api/batches`.
   - `BatchService`: Método `register(RegisterBatchRequestDTO request, Integer ownerId): BatchResponseDTO`.
   - `BatchCodeGenerator`: Generador algorítmico del código único de lote.
   - `BatchRepository` y `BatchStatusRepository`: Persistencia del lote y resolución del estado inicial `ABIERTO`.

#### C. Flujo de Ejecución Paso a Paso (`DS-HU3.png`)
```mermaid
sequenceDiagram
    autonumber
    actor U as Piscicultor
    participant V as RegisterBatchPage (React)
    participant C as BatchController
    participant S as BatchService
    participant G as BatchCodeGenerator
    participant BR as BatchRepository
    participant SR as BatchStatusRepository
    participant L as LogService
    participant DB as Base de Datos

    U->>V: Ingresa fecha, peso, unidades y observaciones; pulsa "Guardar lote"
    V->>V: Valida fecha no futura, peso > 0 y unidades entre 1 y 500
    V->>C: POST /api/batches (Bearer Token)
    C->>C: getAuthenticatedUserId()
    C->>S: register(request, ownerId)
    S->>SR: findByCode("ABIERTO")
    SR-->>S: BatchStatus(id=1, "ABIERTO")
    S->>BR: countByCaptureDate(fechaCaptura)
    BR-->>S: dailyCount (número de lotes de ese día)
    S->>G: generate(fechaCaptura, dailyCount + 1)
    G-->>S: "LOTE-20261020-001"
    S->>BR: save(Batch)
    BR->>DB: INSERT INTO lote (...)
    DB-->>BR: Lote guardado con ID generado
    S->>L: recordEvent("BATCH_REGISTERED", ownerId, batchId, null, desc)
    S-->>C: BatchResponseDTO(código, fecha, peso, unidades, estado="ABIERTO")
    C-->>V: HTTP 201 Created
    V-->>U: Muestra BatchResultCard con el código del lote
```

#### D. Dónde se Evidencia en el Código
- **Generador de Código**: [`BatchCodeGenerator.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/services/BatchCodeGenerator.java#L10-L25).
- **Lógica de Registro y Estado**: [`BatchService.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/services/BatchService.java#L52-L71).
- **Controlador REST**: [`BatchController.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/adapters/controllers/BatchController.java#L30-L45).

---

### HU-04: Evaluar Lote y Clasificación con Red Neuronal (`DC-HU4.png`, `DS-HU4-listar`, `evaluar-unidad`, `cerrar`)

#### A. Objetivo del Módulo
Permitir al usuario seleccionar uno de sus lotes disponibles (`ABIERTO` o `EN_EVALUACION`), cargar una fotografía por cada unidad de muestra, clasificarla mediante el modelo de inteligencia artificial CNN ResNet para **OJO** y **PIEL** según la norma **NTC 1443**, y al completar todas las unidades, finalizar la evaluación calculando el índice de calidad final del lote.

#### B. Evidencia y Cumplimiento del Diagrama de Clases (`DC-HU4.png`)
1. **Frontend**:
   - `EvaluateBatchPage.tsx`: Coordina `loadAvailableBatches()`, `selectBatch(code)`, `submitUnitEvaluation(code, image)` y `closeEvaluation(code)`.
   - `BatchSelector.tsx`: Selector desplegable de lotes disponibles.
   - `UnitImageForm.tsx`: Componente de arrastrar/seleccionar archivo con validación (JPEG/PNG, máx. 5 MB) y barra de progreso.
   - `UnitResultsCard.tsx`: Tabla de resultados por unidad con etiquetas de categoría NTC y botón "Finalizar evaluación".
2. **Backend**:
   - `BatchController` y `EvaluationController`: Endpoints `GET /api/batches/available`, `POST /api/batches/{code}/evaluations` y `POST /api/batches/{code}/close`.
   - `EvaluationService`: Orquesta la evaluación de unidades, el cálculo de hash SHA-256 de imagen para evitar duplicados y el cálculo del promedio final de calidad.
   - Puerto `Classifier` e Implementación `HttpCnnClassifier`: Conector HTTP hacia el microservicio Python que ejecuta la red neuronal ResNet.

#### C. Flujo 1: Listar Lotes Disponibles (`DS-HU4-listar.png`)
1. `EvaluateBatchPage` se monta y ejecuta `loadAvailableBatches()`.
2. Llama a `GET /api/batches/available`.
3. `BatchService.listAvailable(ownerId)` busca los lotes del usuario cuyo estado sea `ABIERTO` o `EN_EVALUACION` y calcula en una sola consulta cuántas unidades llevan evaluadas.
4. Llena el `<select>` de `BatchSelector` con opciones como `LOTE-20261020-001 (0/10 unidades)`.

#### D. Flujo 2: Evaluar Unidad con Red Neuronal (`DS-HU4-evaluar-unidad.png`)
```mermaid
sequenceDiagram
    autonumber
    actor U as Piscicultor
    participant V as EvaluateBatchPage (React)
    participant C as EvaluationController
    participant S as EvaluationService
    participant Vld as ImageValidator
    participant CNN as HttpCnnClassifier (Python)
    participant ER as EvaluationRepository
    participant L as LogService
    participant DB as Base de Datos

    U->>V: Carga foto JPG/PNG y pulsa "Cargar imagen"
    V->>C: POST /api/batches/{code}/evaluations (Multipart Form-Data)
    C->>S: evaluateUnit(code, ownerId, imageBytes)
    S->>Vld: validateSize() y validateFormat()
    S->>S: generateImageReference() -> Hash SHA-256
    S->>ER: existsByBatchIdAndImageReference()
    alt Imagen repetida en el mismo lote
        S-->>C: Lanza BusinessException (409 Conflict)
        C-->>V: Error 409 "Esta imagen ya fue evaluada"
    else Imagen nueva
        S->>CNN: classify(imageBytes)
        CNN->>CNN: Inferencia ResNet en partes OJO y PIEL
        CNN-->>S: List<ClassificationResult> (Ojo: Cat 1, Piel: Cat 1)
        S->>DB: Actualiza lote a estado "EN_EVALUACION"
        S->>ER: save(Evaluation + EvaluationPoints)
        ER->>DB: INSERT INTO evaluacion y evaluacion_punto
        S->>L: recordEvent("UNIT_EVALUATED", ownerId, batchId, ...)
        S-->>C: EvaluationResponseDTO (resultados de la unidad)
        C-->>V: HTTP 200 OK con JSON
        V-->>U: Agrega fila en UnitResultsCard y actualiza contador de progreso
    end
```

#### E. Flujo 3: Cerrar y Calcular Calidad Final (`DS-HU4-cerrar.png`)
1. Cuando `classifiedCount == totalUnits`, se habilita el botón **"Finalizar evaluación"**.
2. El usuario hace clic y se llama a `POST /api/batches/{code}/close`.
3. `EvaluationService.closeEvaluation()` verifica que no falte ninguna unidad por evaluar.
4. Calcula la **Clasificación Final NTC 1443** promediando las categorías obtenidas en los puntos de evaluación.
5. Cambia el estado del lote a `EVALUADO` y asigna el valor numérico final.
6. Registra el evento de auditoría `EVALUATION_CLOSED`.
7. Retorna el lote actualizado y la interfaz muestra el resultado final en verde.

#### F. Dónde se Evidencia en el Código
- **Servicio de Evaluación y Cierre**: [`EvaluationService.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/services/EvaluationService.java#L60-L122).
- **Conexión con el Modelo de IA (CNN)**: [`HttpCnnClassifier.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/infrastructure/classifier/HttpCnnClassifier.java#L47-L80).
- **Controlador de Evaluación**: [`EvaluationController.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/adapters/controllers/EvaluationController.java#L35-L65).
- **Componentes Visuales Frontend**: [`EvaluateBatchPage.tsx`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/frontend/src/pages/EvaluateBatchPage.tsx), [`UnitImageForm.tsx`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/frontend/src/components/UnitImageForm.tsx) y [`UnitResultsCard.tsx`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/frontend/src/components/UnitResultsCard.tsx).

---

### HU-05: Consultar Lotes Evaluados (`DC-HU5.png` y `DS-HU5.png`)

#### A. Objetivo del Módulo
Permitir al piscicultor consultar el historial completo de sus lotes que ya culminaron su ciclo de evaluación (estado `EVALUADO`), visualizando código, fecha de captura, peso, unidades de muestra, observaciones, número total de evaluaciones realizadas y la calificación final NTC 1443.

#### B. Evidencia y Cumplimiento del Diagrama de Clases (`DC-HU5.png`)
1. **Frontend**:
   - `EvaluatedBatchesPage.tsx`: Implementa `consultEvaluatedBatches()`, `showEvaluatedBatches(batches)` y `showEmptyResults()`.
   - `batchService.ts`: Expone la función `consultEvaluatedBatches(): Promise<BatchResponseDTO[]>`.
2. **Backend**:
   - `BatchController`: Expone `GET /api/batches/evaluated` (y homologación `GET /api/batches?estado=EVALUADO`).
   - `BatchService`: Método `listEvaluated(Integer ownerId): List<BatchResponseDTO>`.
   - `BatchRepository`: Consulta derivada `findByOwnerIdAndStatusCodeAndIsDeletedFalse(ownerId, "EVALUADO")`.
   - `EvaluationRepository`: Consulta agrupada de alto rendimiento `countGroupedByBatchIds(batchIds)`.

#### C. Flujo de Ejecución Paso a Paso (`DS-HU5.png`)
```mermaid
sequenceDiagram
    autonumber
    actor U as Piscicultor
    participant V as EvaluatedBatchesPage (React)
    participant C as BatchController
    participant S as BatchService
    participant BR as BatchRepository
    participant ER as EvaluationRepository
    participant L as LogService
    participant DB as Base de Datos

    U->>V: Ingresa a la opción "Lotes evaluados" (#/evaluados)
    V->>V: consultEvaluatedBatches()
    V->>C: GET /api/batches/evaluated (Bearer Token)
    C->>C: getAuthenticatedUserId()
    C->>S: listEvaluated(ownerId)
    S->>BR: findByOwnerIdAndStatusCodeAndIsDeletedFalse(ownerId, "EVALUADO")
    BR->>DB: SELECT * FROM lote WHERE usuario_id = ? AND estado = 'EVALUADO' AND is_deleted = false
    DB-->>BR: Lista de lotes evaluados
    alt No hay lotes evaluados
        S->>L: recordEvent("EVALUATED_BATCHES_VIEWED", ownerId, ...)
        S-->>C: Lista vacía []
        C-->>V: HTTP 200 OK []
        V->>V: showEmptyResults()
        V-->>U: Muestra contenedor accesible "Sin resultados"
    else Hay lotes evaluados
        S->>S: Extrae lista de batchIds
        S->>ER: countGroupedByBatchIds(batchIds)
        ER->>DB: SELECT lote_id, COUNT(*) FROM evaluacion WHERE lote_id IN (...) GROUP BY lote_id
        DB-->>ER: Conteo por cada lote (evita consulta N+1)
        S->>S: Mapea cada Batch a BatchResponseDTO con su evaluación
        S->>L: recordEvent("EVALUATED_BATCHES_VIEWED", ownerId, ...)
        S-->>C: List<BatchResponseDTO>
        C-->>V: HTTP 200 OK con arreglo JSON
        V->>V: showEvaluatedBatches(data)
        V-->>U: Renderiza tabla HTML5 con código, fecha, peso, unidades y Clasificación NTC
    end
```

#### D. Dónde se Evidencia en el Código
- **Consulta Agrupada (Optimización N+1, CB-11)**: [`EvaluationRepository.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/infrastructure/repositories/EvaluationRepository.java#L20-L30).
- **Lógica de Filtrado y Auditoría**: [`BatchService.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/services/BatchService.java#L108-L135).
- **Vista de Lotes Evaluados y Prevención XSS (`PQ-04`)**: [`EvaluatedBatchesPage.tsx`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/frontend/src/pages/EvaluatedBatchesPage.tsx#L35-L150).

---

### Módulo Transversal: Servicio de Auditoría (`DC-Log-transversal.png`)

#### A. Objetivo del Módulo
Registrar de forma inmutable cada evento significativo del sistema (registro de usuario, inicio de sesión exitoso o fallido, registro de lote, evaluación de unidad, cierre de lote y consulta de evaluados), enmascarando cualquier dato sensible o personal (`RNF-SEC-04`).

#### B. Evidencia y Cumplimiento
- **Entidades**: [`Log.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/entities/Log.java) y [`EventType.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/entities/EventType.java).
- **Servicio**: [`LogService.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/services/LogService.java#L35-L64) con método `recordEvent(eventCode, userId, batchId, evaluationId, description)` y `maskSensitiveData(description)` que enmascara correos (`***@***.***`) y teléfonos (`3***`).
- **Repositorios**: [`LogRepository.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/infrastructure/repositories/LogRepository.java) y [`EventTypeRepository.java`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/infrastructure/repositories/EventTypeRepository.java).

---

## 4. Estructura de Archivos y Responsabilidades

Para que te orientes rápidamente en el proyecto, este es el mapa físico de carpetas:

```
secct/
├── docs/
│   ├── Diagramas/                         <- Diagramas UML oficiales (DC y DS)
│   └── EXPLICACION_ARQUITECTURA_Y_DIAGRAMAS.md <- Este documento
├── frontend/
│   ├── src/
│   │   ├── components/                   <- Bloques visuales interactivos
│   │   │   ├── SideNav.tsx               <- Barra lateral izquierda con navegación y logout
│   │   │   ├── UserRegistrationForm.tsx  <- Formulario HU-01
│   │   │   ├── BatchRegistrationForm.tsx <- Formulario HU-03
│   │   │   ├── BatchSelector.tsx         <- Selector de lotes HU-04
│   │   │   ├── UnitImageForm.tsx         <- Arrastre y subida de imágenes HU-04
│   │   │   └── UnitResultsCard.tsx       <- Resultados y cierre HU-04
│   │   ├── pages/                        <- Vistas completas de la aplicación
│   │   │   ├── RegisterUserPage.tsx      <- Vista pública HU-01 (#/registro)
│   │   │   ├── LoginPage.tsx             <- Vista pública HU-02 (#/login)
│   │   │   ├── RegisterBatchPage.tsx     <- Vista privada HU-03 (#/register)
│   │   │   ├── EvaluateBatchPage.tsx     <- Vista privada HU-04 (#/evaluate)
│   │   │   ├── EvaluatedBatchesPage.tsx  <- Vista privada HU-05 (#/evaluados)
│   │   │   └── AdminPage.tsx             <- Vista protegida (#/admin, 403 para no admin)
│   │   ├── services/                     <- Clientes HTTP para hablar con el Backend
│   │   │   ├── apiClient.ts              <- Inyector de Bearer Token y captura 401
│   │   │   ├── authService.ts            <- Peticiones de login/logout/registro
│   │   │   ├── authStorage.ts            <- Almacenamiento local del token y nombre
│   │   │   ├── batchService.ts           <- Peticiones de lotes
│   │   │   └── evaluationService.ts      <- Peticiones de evaluación e inferencia
│   │   └── validation/                   <- Reglas de validación previa en cliente
└── backend/
    └── src/main/java/co/unillanos/secct/
        ├── adapters/
        │   ├── controllers/              <- Endpoints REST (Registration, Auth, Batch, Evaluation)
        │   └── security/                 <- Filtro JWT (JwtAuthenticationFilter)
        ├── entities/                     <- Mapeo JPA de tablas (User, Batch, Evaluation, etc.)
        ├── infrastructure/
        │   ├── classifier/               <- Cliente HTTP hacia modelo CNN en Python
        │   ├── config/                   <- Configuración de Spring Security y CORS
        │   ├── repositories/             <- Interfaces Spring Data JPA
        │   └── security/                 <- Generación y validación de tokens JWT
        └── usecases/
            ├── dto/                      <- Objetos inmutables de transferencia de datos
            ├── ports/                    <- Interfaces de abstracción (Classifier)
            └── services/                 <- Lógica pura de negocio (User, Auth, Batch, Evaluation, Log)
```

---

## 5. Resumen de Verificación y Calidad

1. **Cumplimiento de Diagramas**: Cada clase, atributo, método público y llamada secuencial documentada en los 14 diagramas de `docs/Diagramas/` cuenta con una correspondencia directa, verificable y testeable en el código.
2. **Cero Violaciones de Seguridad**:
   - Sin almacenamiento de contraseñas en texto plano (Salt criptográfico de 16 bytes + SHA-256).
   - Prevención de inyección SQL mediante consultas parametrizadas de Spring Data JPA.
   - Prevención de XSS almacenado mediante nodos de texto directo en JSX.
   - Enmascaramiento obligatorio de correos y teléfonos en logs de auditoría (`RNF-SEC-04`).
3. **Calidad de Compilación y Suite de Pruebas**:
   - **Frontend**: Compilación exitosa con Vite y TypeScript (`tsc -b && vite build`) con **0 errores**.
   - **Backend**: Ejecución de las 147 pruebas automatizadas (`./mvnw test`) con **100% de éxito (147 de 147 aprobadas)**.
