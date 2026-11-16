# HU-05: Consultar Lotes Evaluados (DC-HU5 y DS-HU5)

## 1. Resumen de Implementación
Se implementó la historia de usuario HU-05: **Consultar lotes evaluados** integrándola sobre el código existente de HU-01 a HU-04, dando cumplimiento estricto a los diagramas `DC-HU5.png`, `DS-HU5.png`, `Sprint 1_2.md` y al Plan de Pruebas `PP-001`.

## 2. Componentes Implementados

### 2.1 Repositorios JPA (`co.unillanos.secct.infrastructure.repositories`)
- [`BatchRepository`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/infrastructure/repositories/BatchRepository.java):
  - `List<Batch> findByOwnerIdAndStatusCodeAndIsDeletedFalse(Integer ownerId, String statusCode)`: consulta derivada que filtra por `ownerId`, estado `"EVALUADO"` y registros no eliminados lógicamente (`isDeleted = false`) (`PL-5.06`, `PQ-06`).
- [`EvaluationRepository`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/infrastructure/repositories/EvaluationRepository.java):
  - `List<BatchEvaluationCount> countGroupedByBatchIds(@Param("batchIds") List<Integer> batchIds)`: ejecuta una única consulta SQL agrupada (`SELECT lote_id, COUNT(*) ... GROUP BY lote_id`) para prevenir problemas N+1 (`CB-11`).

### 2.2 Servicio de Negocio (`co.unillanos.secct.usecases.services.BatchService`)
- Método `+ listEvaluated(Integer ownerId): List<BatchResponseDTO>` (pasos 8 al 21 de `DS-HU5`):
  1. Valida que `ownerId` no sea nulo.
  2. Consulta lotes del usuario con estado `"EVALUADO"` mediante `batchRepository.findByOwnerIdAndStatusCodeAndIsDeletedFalse(ownerId, "EVALUADO")`.
  3. Si la lista contiene lotes, extrae los `batchIds` y ejecuta una única consulta agrupada `evaluationRepository.countGroupedByBatchIds(batchIds)` (`CB-11`). Mapea cada `batchId` a su `evaluationCount` (0 por defecto si no tiene evaluaciones, `PL-5.09`).
  4. Itera cada `Batch` y construye su DTO con `BatchResponseDTO.from(batch, evaluationCount)` (`CB-02`: 0, 1 y N iteraciones).
  5. Registra siempre el evento de auditoría `logService.recordEvent("EVALUATED_BATCHES_VIEWED", ownerId, null, null, "Consulta de lotes evaluados")` (`PL-5.08`, `PI-13`).
  6. Retorna `List<BatchResponseDTO>`.

### 2.3 Controlador REST (`co.unillanos.secct.adapters.controllers.BatchController`)
- Endpoint `GET /api/batches/evaluated`:
  - Obtiene el `userId` autenticado desde el `SecurityContextHolder` (`PU-14`).
  - Protegido por `JwtAuthenticationFilter`: rechaza con 401 si no hay token o es inválido (`PL-5.07`, `CB-12`).
  - Delega a `batchService.listEvaluated(userId)` y responde `200 OK`.
- Parámetro opcional en `GET /api/batches?estado=EVALUADO`:
  - Si `estado` es `"EVALUADO"` (case-insensitive), delega a `batchService.listEvaluated(userId)` homologando `Infraestructura del proyecto web_2.md`.
  - Si es nulo o diferente, mantiene la consulta de lotes disponibles para evaluar (`ABIERTO` o `EN_EVALUACION`).

### 2.4 Frontend React 18 + TypeScript + Tailwind CSS (`frontend/src/`)
- **`src/services/batchService.ts`**:
  - Función `consultEvaluatedBatches(): Promise<BatchResponseDTO[]>` consumiendo `GET /api/batches/evaluated` con `apiGet`.
- **`src/pages/EvaluatedBatchesPage.tsx`**:
  - Métodos del diagrama `DC-HU5`: `consultEvaluatedBatches()`, `showEvaluatedBatches(batches)` y `showEmptyResults()`.
  - Muestra columnas: Código (`code`), Fecha de captura (`captureDate`), Peso (`weightKg`), Unidades de muestra (`sampleUnitCount`), Observaciones (`notes`), Número de evaluaciones (`evaluationCount`) y Clasificación final NTC 1443 (`finalClassification` con 2 decimales).
  - Bloqueo de XSS almacenado (`PQ-04`): observaciones renderizadas como nodos de texto directos en JSX.
  - Estado vacío (`PL-5.01`, `CN-08`): muestra `"Sin resultados"` sin generar alertas de error.
- **`src/components/SideNav.tsx`**:
  - Agrega enlace de navegación "Consultar lotes evaluados" (`#/evaluados`) en el menú del Piscicultor.
- **`src/App.tsx`**:
  - Registra y protege la ruta `#/evaluados` (redirige a `#/login` si no está autenticado, `PS-06`).

## 3. Matriz de Pruebas Unitarias y Cobertura (Plan PP-001)

| Caso de Prueba | Clase / Capa | Descripción | Resultado |
|---|---|---|---|
| **PU-34** | `BatchService` | `listEvaluated` consulta lotes, conteo agrupado y registra auditoría | **APROBADO** (100% líneas y ramas) |
| **CB-02** | `BatchService` | Loop boundary testing (0 iteraciones, 1 iteración, N iteraciones) | **APROBADO** |
| **CB-11** | `BatchService` | Única consulta agrupada con `countGroupedByBatchIds` (evita N+1) | **APROBADO** |
| **PL-5.01 / CN-08** | `BatchService` & UI | Lista vacía retorna 0 elementos y muestra "Sin resultados" sin error | **APROBADO** |
| **PL-5.02** | `BatchService` | 1 lote evaluado se mapea correctamente con sus métricas | **APROBADO** |
| **PL-5.03** | `BatchService` | N lotes evaluados se procesan en la lista de respuesta | **APROBADO** |
| **PL-5.06** | `BatchService` | Filtra por `ownerId`, `EVALUADO` y no eliminados (`isDeleted = false`) | **APROBADO** |
| **PL-5.07 / CB-12** | `JwtAuthenticationFilter` | Peticiones sin token o alterado responden 401 Unauthorized | **APROBADO** |
| **PL-5.08 / PI-13** | `BatchService` | Emisión del evento de auditoría `EVALUATED_BATCHES_VIEWED` | **APROBADO** |
| **PL-5.09** | `BatchService` | Lote sin evaluaciones en resultado agrupado asigna count = 0 | **APROBADO** |
| **PI-11 / PI-14** | `BatchController` | `GET /api/batches/evaluated` con usuario autenticado retorna 200 OK | **APROBADO** (100% cobertura) |
| **Homologación** | `BatchController` | `GET /api/batches?estado=EVALUADO` delega a `listEvaluated` | **APROBADO** |
| **PQ-04** | `EvaluatedBatchesPage` | Prevención de XSS almacenado en notas | **APROBADO** |
| **CB-03** | `BatchService` | Cobertura JaCoCo >= 80% (Alcanzado: 94% instrucciones, 87% ramas) | **APROBADO** |
