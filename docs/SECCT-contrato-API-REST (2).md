# SECCT — Contrato de la API REST (HU-06 a HU-14)

Subtareas de Jira: EDCCT-187 (HU-06) a EDCCT-195 (HU-14).
Base: código de `main` (commit `1d9c3af`) y `SECCT-diagramas-final.md` (versión 09/11/2026). Cada endpoint coincide con su diagrama de clases (DC) y de secuencia (DS).

---

## 1. Cómo funciona el web service

SECCT expone **un solo web service REST** en el backend Spring Boot. El cliente web (React) y el cliente móvil usan exactamente el mismo contrato.

```
Cliente (React / móvil)
   │  HTTP + JSON   ·   Authorization: Bearer <JWT>
   ▼
JwtAuthenticationFilter ── valida el token y carga el rol (ROLE_PISCICULTOR / ROLE_ADMINISTRADOR)
   ▼
SecurityConfig ─────────── decide si la ruta es pública, autenticada o solo de administrador
   ▼
DispatcherServlet ──────── convierte el JSON en DTO y, si hay @Valid, ejecuta el Validator
   ▼
@RestController ────────── solo traduce HTTP ↔ DTO
   ▼
@Service ───────────────── reglas de negocio, @Transactional, log de auditoría
   ▼
JpaRepository ──────────── acceso a PostgreSQL (Supabase)

Errores: cualquier BusinessException o error de validación llega a GlobalExceptionHandler,
que responde siempre con ErrorResponseDTO.
Servicios externos: el backend consume el clasificador CNN (Python) por HTTP (HU-04)
y genera gráficas y PDF con JasperReports (HU-06, HU-11, HU-12).
```

Reglas de diseño:
- **Sin estado (stateless):** no hay sesión en el servidor. Cada petición trae su JWT (expira a los 30 minutos, `JWT_EXPIRATION_MINUTES`).
- **El dueño sale del token, nunca de la URL ni del cuerpo.** El controlador usa `getAuthenticatedUserId()`. Si el recurso es de otro usuario, se responde **404**, no 403, para no revelar que existe (igual que `findByCodeAndOwnerIdAndIsDeletedFalse` en HU-04).
- **Los DTO son el contrato.** Nunca se devuelve una entidad JPA.
- **Recursos en plural y en inglés:** `/api/batches`, `/api/reports`, `/api/users`, `/api/admin`. El lote se identifica por su `code` (`SECCT-AAAAMMDD-NNN`) y el reporte por su `id`.

---

## 2. Convenciones generales

| Tema | Regla |
|---|---|
| URL base | `{VITE_API_URL}/api` |
| Formato | JSON UTF-8 (`Content-Type: application/json`), salvo la exportación a PDF (`application/pdf`) y la subida de imágenes de HU-04 (`multipart/form-data`) |
| Autenticación | `Authorization: Bearer <JWT>` en todos los endpoints de este documento |
| Nombres de campos | camelCase en inglés, iguales a los atributos de los DTO |
| Fechas | `LocalDate` → `"2026-11-09"`; `OffsetDateTime` → ISO-8601 con zona, `"2026-11-09T14:32:10.123-05:00"` |
| Decimales | `BigDecimal` como número JSON (`3.75`). `finalClassification` usa 2 decimales |
| Valores nulos | Se envían como `null` (no se omiten), igual que hoy en `BatchResponseDTO` |
| Borrado | Siempre lógico (`is_deleted`). Un recurso borrado responde 404 |

### Formato de error (ya existe: `ErrorResponseDTO`)
```json
{
  "message": "Datos inválidos en: additionalUnits",
  "errors": [
    { "field": "additionalUnits", "message": "debe ser mayor o igual a 1" }
  ]
}
```
`errors` va vacío (`[]`) cuando el error no es de un campo.

### Códigos de estado
| Código | Cuándo | Quién lo genera |
|---|---|---|
| 200 OK | Consulta o acción que devuelve datos | Controlador |
| 201 Created | Se creó un recurso (reporte guardado) | Controlador |
| 204 No Content | Borrado correcto, sin cuerpo | Controlador |
| 400 Bad Request | Falla `@Valid`, JSON mal formado o regla de datos | `GlobalExceptionHandler` |
| 401 Unauthorized | Sin token, token vencido o inválido. Cuerpo fijo: `{"message":"Tu sesión no es válida o expiró. Inicia sesión de nuevo.","errors":[]}`. El frontend borra el token y manda al login | `JwtAuthenticationFilter.writeUnauthorizedResponse()` |
| 403 Forbidden | Token válido pero sin permiso (rol o contraseña de confirmación) | `SecurityConfig` / `BusinessException(403)` |
| 404 Not Found | No existe, está borrado o es de otro usuario | `BusinessException(404)` |
| 409 Conflict | El estado del lote no permite la acción | `BusinessException(409)` |
| 500 | Error inesperado (por ejemplo, falla JasperReports) | `GlobalExceptionHandler` |
| 503 Service Unavailable | El clasificador CNN no respondió bien (solo HU-04) | `HttpCnnClassifier` → `BusinessException(503)` |

---

## 3. Endpoints que ya existen (HU-01 a HU-05, para referencia)

| HU | Método y ruta | Acceso | Respuesta |
|---|---|---|---|
| HU-01 | `POST /api/users` (alias `/api/auth/registro`) | Público | 201 `RegisterUserResponseDTO` |
| HU-02 | `POST /api/auth/login` | Público | 200 `LoginResponseDTO` |
| HU-02 | `POST /api/auth/logout` | Autenticado | 204 |
| HU-03 | `POST /api/batches` | Autenticado | 201 `BatchResponseDTO` |
| HU-04 | `GET /api/batches/available` (el mismo método atiende `GET /api/batches`) | Autenticado | 200 `BatchResponseDTO[]` |
| HU-04 | `GET /api/batches/{code}` | Autenticado | 200 `BatchResponseDTO` |
| HU-04 | `POST /api/evaluations/batches/{code}/units` (multipart `image`) | Autenticado | 201 `EvaluationResponseDTO` |
| HU-04 | `POST /api/evaluations/batches/{code}/close` | Autenticado | 200 `BatchResponseDTO` |
| HU-05 | `GET /api/batches/evaluated` | Autenticado | 200 `BatchResponseDTO[]` (EVALUADO y REPORTADO, con el ajuste pendiente) |

---

## 4. Resumen de HU-06 a HU-14

| HU | Jira | Método y ruta | Rol | Respuesta OK | Evento de log |
|---|---|---|---|---|---|
| HU-06 Generar reporte | EDCCT-187 | `GET /api/reports/batches/{code}` | Autenticado | 200 `ReportResponseDTO` | `REPORT_GENERATED` |
| HU-07 Monitorear sistema | EDCCT-188 | `GET /api/admin/system-info` | ADMINISTRADOR | 200 `SystemInfoResponseDTO` | `SYSTEM_INFO_VIEWED` |
| HU-08 Eliminar cuenta | EDCCT-189 | `POST /api/users/me/delete` | Autenticado | 204 | `USER_DELETED` |
| HU-09 Eliminar lote | EDCCT-190 | `DELETE /api/batches/{code}` | Autenticado | 204 | `BATCH_DELETED` |
| HU-10 Guardar reporte | EDCCT-191 | `POST /api/reports/batches/{code}` | Autenticado | 201 `ReportSummaryDTO` | `REPORT_SAVED` |
| HU-11 Consultar reportes | EDCCT-192 | `GET /api/reports` | Autenticado | 200 `ReportSummaryDTO[]` | — |
| HU-11 Ver un reporte | EDCCT-192 | `GET /api/reports/{id}` | Autenticado | 200 `ReportResponseDTO` | `REPORT_VIEWED` |
| HU-12 Exportar PDF | EDCCT-193 | `GET /api/reports/{id}/pdf` | Autenticado | 200 `application/pdf` | `REPORT_EXPORTED` |
| HU-13 Ampliar muestra | EDCCT-194 | `POST /api/batches/{code}/expand` | Autenticado | 200 `BatchResponseDTO` | `SAMPLE_EXPANDED` |
| HU-14 Eliminar reporte | EDCCT-195 | `DELETE /api/reports/{id}` | Autenticado | 204 | `REPORT_DELETED` |

"Autenticado" = cualquier usuario con JWT válido (en la práctica, el piscicultor dueño del recurso).

---

## 5. Detalle por endpoint

### HU-06 · Generar reporte de un lote — EDCCT-187
Diagramas: DC-HU6, DS-HU6.

`GET /api/reports/batches/{code}`

| Parte | Valor |
|---|---|
| Controlador | `ReportController.generate(code)` → `ReportService.generate(code, ownerId)` |
| Parámetro de ruta | `code`: código del lote, por ejemplo `SECCT-20261020-001` |
| Cuerpo | Ninguno |
| Regla | El lote debe ser del usuario, no estar borrado y estar en EVALUADO o REPORTADO (`isEvaluated()`). **No guarda nada**: calcula las estadísticas en el momento |

**200 · `ReportResponseDTO`**
```json
{
  "reportId": null,
  "version": null,
  "batchCode": "SECCT-20261020-001",
  "captureDate": "2026-10-20",
  "weightKg": 12.50,
  "sampleUnitCount": 3,
  "notes": "Estanque 2",
  "statistics": {
    "evaluationCount": 3,
    "finalClassification": 3.67,
    "eyeAverage": 4.00,
    "skinAverage": 3.33,
    "countByCategory": { "1": 0, "2": 0, "3": 1, "4": 2, "5": 0 }
  },
  "units": [
    {
      "id": 41,
      "evaluatedAt": "2026-10-20T10:15:00-05:00",
      "results": [
        { "fishPartCode": "OJO",  "ntcCategory": 4, "confidence": 0.93 },
        { "fishPartCode": "PIEL", "ntcCategory": 3, "confidence": 0.88 }
      ]
    }
  ],
  "chartImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```
- `reportId` y `version` van en `null` porque el reporte todavía no se ha guardado (eso es HU-10).
- `countByCategory` es `Map<Short, Long>`: JSON siempre escribe las llaves como texto (`"1"`…`"5"`).
- `chartImage` es la gráfica PNG en Base64 como *data URL*. El frontend la muestra con `<img src={report.chartImage} />`.

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 404 | El lote no existe, está borrado o es de otro usuario | `Lote no encontrado` |
| 409 | El lote está ABIERTO o EN_EVALUACION | `El lote aún no está evaluado` |
| 500 | Falla JasperReports al generar la gráfica | `No se pudo generar el reporte` |

---

### HU-07 · Monitorear el sistema — EDCCT-188
Diagramas: DC-HU7, DS-HU7.

`GET /api/admin/system-info`

| Parte | Valor |
|---|---|
| Controlador | `AdminController.getSystemInfo()` → `SystemInfoService.getSystemInfo(adminId)` |
| Rol | Solo `ROLE_ADMINISTRADOR`. Regla nueva en `SecurityConfig`: `.requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")`, **antes** de `/api/**` |
| Cuerpo | Ninguno |

**200 · `SystemInfoResponseDTO`**
```json
{ "totalUsers": 18, "totalBatches": 42, "totalEvaluations": 310 }
```
Cuenta solo registros no borrados (`countByIsDeletedFalse`; para evaluaciones, las de lotes no borrados).

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 403 | El usuario es PISCICULTOR | Hoy sin cuerpo (ver sección 6, punto 2) |

---

### HU-08 · Eliminar la cuenta propia — EDCCT-189
Diagramas: DC-HU8, DS-HU8.

`POST /api/users/me/delete`

Se usa `POST` y no `DELETE` porque la petición lleva la contraseña en el cuerpo, y HTTP no define el significado de un cuerpo en `DELETE` (algunos proxies lo descartan).

| Parte | Valor |
|---|---|
| Controlador | `UserController.deleteAccount(@Valid request)` → `UserService.deleteAccount(userId, request)` |
| Cuerpo | `DeleteAccountRequestDTO` |
| Regla | Verifica la contraseña con `PasswordService.verifyPassword(...)`. En una transacción hace borrado lógico de los reportes, los lotes y la cuenta (`deleted_by` = el mismo usuario) |

**Petición**
```json
{ "password": "MiClave2026" }
```
| Campo | Tipo | Validación |
|---|---|---|
| `password` | String | `@NotBlank` |

**204 No Content.** Después, el frontend ejecuta `removeLocalToken()` y lleva al login. Un nuevo login responde 401, porque `AuthService` rechaza usuarios borrados. Ojo: el JWT ya emitido sigue siendo válido hasta que vence (ver sección 6, punto 5).

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 400 | `password` vacío | `Datos inválidos en: password` + `errors[password]` |
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 403 | La contraseña no coincide. **No es 401**, porque `apiClient.ts` cierra la sesión ante cualquier 401 | `La contraseña no es correcta` |
| 404 | El usuario ya estaba borrado | `Usuario no encontrado` |

---

### HU-09 · Eliminar un lote — EDCCT-190
Diagramas: DC-HU9, DS-HU9.

`DELETE /api/batches/{code}`

| Parte | Valor |
|---|---|
| Controlador | `BatchController.delete(code)` → `BatchService.delete(code, ownerId)` |
| Cuerpo | Ninguno |
| Regla | Borrado lógico **en cualquier estado**, junto con sus reportes. Las evaluaciones se conservan |

**204 No Content.**

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 404 | No existe, ya está borrado o es de otro usuario | `Lote no encontrado` |

---

### HU-10 · Guardar el reporte — EDCCT-191
Diagramas: DC-HU10, DS-HU10.

`POST /api/reports/batches/{code}`

| Parte | Valor |
|---|---|
| Controlador | `ReportController.save(code)` → `ReportService.save(code, ownerId)` |
| Cuerpo | Ninguno: el backend vuelve a calcular las estadísticas; no se confía en lo que muestre el cliente |
| Regla | Solo con el lote en EVALUADO (`canBeReported()`). Crea la versión `MAX(version) + 1` con `current = true`, congela las estadísticas en JSON y pasa el lote a REPORTADO |

**201 Created · `ReportSummaryDTO`**
```json
{
  "id": 7,
  "batchCode": "SECCT-20261020-001",
  "version": 1,
  "current": true,
  "finalClassification": 3.67,
  "generatedAt": "2026-11-09T14:32:10.123-05:00"
}
```
Opcional: cabecera `Location: /api/reports/7`.

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 404 | Lote inexistente, borrado o ajeno | `Lote no encontrado` |
| 409 | El lote no está EVALUADO (si está REPORTADO ya tiene versión vigente: hay que ampliar la muestra o eliminar el reporte) | `El lote no se puede reportar en su estado actual` |
| 409 | Dos guardados al mismo tiempo chocan con `uq_reporte_vigente` o `uq_reporte_lote_version` | Lo responde `handleConflict` (ya existe; ver sección 6, punto 4) |

---

### HU-11 · Consultar reportes guardados — EDCCT-192
Diagramas: DC-HU11, DS-HU11.

**a) Lista** · `GET /api/reports`

`ReportController.list()` → `ReportService.list(ownerId)`. Devuelve todas las versiones no borradas de los lotes del usuario. `current = true` marca la vigente. No registra log: es navegación pasiva.

**200 · `ReportSummaryDTO[]`**
```json
[
  { "id": 9, "batchCode": "SECCT-20261020-001", "version": 2, "current": true,
    "finalClassification": 3.80, "generatedAt": "2026-11-12T09:00:00-05:00" },
  { "id": 7, "batchCode": "SECCT-20261020-001", "version": 1, "current": false,
    "finalClassification": 3.67, "generatedAt": "2026-11-09T14:32:10-05:00" }
]
```
Lista vacía → `[]` con 200, no 404.

**b) Detalle** · `GET /api/reports/{id}`

`ReportController.getById(id)` → `ReportService.getById(id, ownerId)`. Lee las estadísticas congeladas (`ReportStatistics.fromJson`) y vuelve a dibujar la gráfica.

**200 · `ReportResponseDTO`**, con la misma forma de HU-06, con estas diferencias:
- `reportId` y `version` tienen valor.
- `statistics` es la copia congelada de esa versión.
- `sampleUnitCount` = `numero_evaluaciones` del reporte (`report.getEvaluationCount()`), así una versión anterior no muestra el tamaño de una muestra ampliada después.
- `units` va vacío (`[]`).

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 400 | `id` no es número | Lo responde Spring (ver sección 6) |
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 404 | Reporte inexistente, borrado o de un lote ajeno | `Reporte no encontrado` |

---

### HU-12 · Exportar reporte a PDF — EDCCT-193
Diagramas: DC-HU12, DS-HU12.

`GET /api/reports/{id}/pdf`

| Parte | Valor |
|---|---|
| Controlador | `ReportController.exportPdf(id)` → `ReportService.exportPdf(id, ownerId)` → `ResponseEntity<byte[]>` |
| Cabecera de petición | `Accept: application/pdf` |
| Regla | Solo reportes guardados. JasperReports llena `batch-report.jrxml` con `buildParameters(report, statistics)` |

**200**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="reporte-SECCT-20261020-001-v2.pdf"
Content-Length: 84213
<bytes del PDF>
```
El frontend lo recibe con `response.blob()` y lo descarga con `saveFile(blob, nombre)`.

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 404 | Reporte inexistente, borrado o ajeno | `Reporte no encontrado` (en JSON, no en PDF) |
| 500 | Falla JasperReports | `No se pudo generar el PDF` |

---

### HU-13 · Ampliar la muestra de un lote — EDCCT-194
Diagramas: DC-HU13, DS-HU13.

`POST /api/batches/{code}/expand`

| Parte | Valor |
|---|---|
| Controlador | `BatchController.expandSample(code, @Valid request)` → `BatchService.expandSample(code, ownerId, request)` |
| Cuerpo | `ExpandSampleRequestDTO` |
| Regla | El lote debe estar EVALUADO o REPORTADO. Suma `additionalUnits` a `sampleUnitCount` (máximo 500 en total), lo pasa a EN_EVALUACION y deja `finalClassification = null`. Si estaba REPORTADO, la versión vigente pasa a `current = false` |

**Petición**
```json
{ "additionalUnits": 2 }
```
| Campo | Tipo | Validación |
|---|---|---|
| `additionalUnits` | Integer | `@NotNull`, `@Min(1)`, `@Max(499)` |

**200 · `BatchResponseDTO`** (el mismo de HU-03 a HU-05)
```json
{
  "id": 12, "code": "SECCT-20261020-001", "captureDate": "2026-10-20",
  "weightKg": 12.50, "sampleUnitCount": 5, "notes": "Estanque 2",
  "evaluationCount": 3, "finalClassification": null, "statusCode": "EN_EVALUACION"
}
```
Después, las 2 unidades nuevas se evalúan con `POST /api/evaluations/batches/{code}/units` y el lote se cierra con `.../close` (HU-04), que recalcula el promedio.

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 400 | Falla `@Valid` | `Datos inválidos en: additionalUnits` + `errors[additionalUnits]` |
| 400 | `sampleUnitCount + additionalUnits > 500` | `La muestra no puede superar 500 unidades` |
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 404 | Lote inexistente, borrado o ajeno | `Lote no encontrado` |
| 409 | El lote está ABIERTO o EN_EVALUACION | `Solo se puede ampliar un lote evaluado` |

---

### HU-14 · Eliminar un reporte — EDCCT-195
Diagramas: DC-HU14, DS-HU14.

`DELETE /api/reports/{id}`

| Parte | Valor |
|---|---|
| Controlador | `ReportController.delete(id)` → `ReportService.delete(id, ownerId)` |
| Cuerpo | Ninguno |
| Regla | Borrado lógico (`current = false`). Si era la versión vigente, el lote vuelve a EVALUADO. Las versiones anteriores no cambian |

**204 No Content.**

| Error | Cuándo | `message` sugerido |
|---|---|---|
| 401 | Token ausente o vencido | Mensaje fijo del filtro JWT |
| 404 | Reporte inexistente, ya borrado o ajeno | `Reporte no encontrado` |

---

## 6. Lo que hay que agregar en el código para cumplir el contrato

**Backend**
1. `SecurityConfig`: regla `/api/admin/**` → `hasRole("ADMINISTRADOR")`, antes de `/api/**`.
2. `SecurityConfig`: un `accessDeniedHandler` que responda 403 con `ErrorResponseDTO` (hoy un 403 de seguridad sale sin cuerpo).
3. CORS: `configuration.setExposedHeaders(List.of("Content-Disposition"))`, para que el navegador deje leer el nombre del PDF. El método `DELETE` ya está permitido.
4. `GlobalExceptionHandler`:
   - Manejar `MethodArgumentTypeMismatchException` (por ejemplo, `/api/reports/abc`) con 400. Hoy cae en el manejador general y responde 500.
   - `handleConflict` responde siempre "No se pudo guardar el lote por un conflicto de datos". Con reportes ese texto es engañoso: conviene un mensaje general.
5. **Token de un usuario borrado.** `JwtAuthenticationFilter` solo valida firma y vencimiento, no consulta la base. Tras HU-08 (o un logout), el JWT ya emitido funciona hasta 30 minutos, y `BatchService.register` busca al dueño con `findById`, que no mira `isDeleted`: un usuario borrado podría crear un lote en ese tiempo. Lo mínimo es que los servicios busquen al usuario con `findByIdAndIsDeletedFalse` y respondan 401.
6. `ReportController.save` devuelve `ResponseEntity.status(201)`, y los `DELETE` y `POST /api/users/me/delete` devuelven `ResponseEntity.noContent()`.
7. Documentación automática (recomendado): dependencia `org.springdoc:springdoc-openapi-starter-webmvc-ui`. Genera `/v3/api-docs` y Swagger UI a partir de los controladores, para que el contrato y el código no se separen. Si se agrega, hay que permitir `/v3/api-docs/**` y `/swagger-ui/**` en `SecurityConfig`, solo en desarrollo.

**Frontend (`apiClient.ts`)**
1. `apiDelete(path)`: hoy solo existen `apiPost`, `apiGet` y `apiPostForm`.
2. `apiGetBlob(path)`: devuelve `response.blob()` para el PDF. `apiGet` siempre hace `response.json()` y fallaría con un PDF.
3. `apiGet` no contempla 204; no afecta a estos endpoints, pero conviene igualarlo a `apiPost`.
4. Tipos nuevos en `types/`: `ReportResponseDTO`, `ReportSummaryDTO`, `ReportStatistics`, `SystemInfoResponseDTO`, `ExpandSampleRequestDTO`, `DeleteAccountRequestDTO`, con los mismos nombres de campo de este documento.

**Cliente móvil**: usa las mismas rutas y el mismo JSON. CORS no aplica a una app nativa, pero el token se debe guardar en almacenamiento seguro y no en texto plano. Si el código del cliente se minifica u ofusca, hay que conservar los nombres de los campos JSON.

---

## 6.1 Servicio externo que consume el backend: clasificador CNN

SECCT también es **cliente** de un web service: el clasificador CNN en Python (FastAPI). El frontend nunca lo llama directamente. Solo lo usa el backend, desde `HttpCnnClassifier`, en `POST /api/evaluations/batches/{code}/units` (HU-04).

| Parte | Valor |
|---|---|
| Ruta | `POST {CNN_URL}/evaluar` (`secct.cnn.url`) |
| Petición | `{ "imagen_base64": "<bytes de la imagen en Base64>" }` |
| Respuesta 200 | `{ "partes": [ { "parte": "OJO", "categoria_ntc": 4, "confianza": 0.93 }, { "parte": "PIEL", "categoria_ntc": 3, "confianza": 0.88 } ] }` |
| Errores del servicio | 400 (Base64 inválido o vacío), 500 (falla la inferencia) |
| Lo que ve el cliente de SECCT | Cualquier falla (sin conexión, timeout de 5 s / 60 s, estado distinto de 200 o JSON inesperado) → **503** con `{"message": "El servicio de clasificación no está disponible. Intenta de nuevo más tarde", "errors": []}` |
| Seguridad | Hoy sin autenticación y con CORS `*`: dejarlo accesible solo desde el backend |

---

## 7. Decisiones sobre reportes guardados

1. **Datos del lote en un reporte guardado (HU-11 y HU-12):** `fromSaved(report, chartPng)` toma `sampleUnitCount` de `report.getEvaluationCount()` (columna `numero_evaluaciones`). Al guardar, el lote está EVALUADO con todas sus unidades evaluadas, así que ese número congela el tamaño de la muestra de esa versión. `captureDate`, `weightKg` y `notes` vienen del lote, porque ninguna HU los modifica.
2. **`units` en un reporte guardado:** se devuelve vacío (`[]`). El detalle de las unidades está en la evaluación del lote (HU-04 y HU-05).
3. **Tabla de endpoints del documento "Infraestructura del proyecto web":** si lista rutas para HU-06 a HU-14, hay que alinearla con este contrato, para que no se repita el conflicto que ya pasó con HU-04 y HU-05 (`dudas.md`, H-03).
