# Registro de Dudas y Decisiones Técnicas de Implementación — SECCT

> **Convención de estados:**
> - **APROBADA:** Decisión cerrada por el equipo e integrada en la implementación del proyecto.
> - **ABIERTA / PENDIENTE DE DECISIÓN:** Sin aprobación del equipo; prohibido improvisar o modificar archivos asociados hasta confirmación explícita.

## Resumen de Estado

| Categoría | ID | Tema | Estado |
| :--- | :--- | :--- | :--- |
| **Aprobada** | **B.1** | Propiedades `CNN_URL` y `GEMINI_API_KEY` (cabecera `x-goog-api-key`) en `HttpCnnClassifier` | **APROBADA** |
| **Aprobada** | **B.2** | Detección de `mimeType` por magic bytes (`image/png` / `image/jpeg`) en `HttpCnnClassifier` | **APROBADA** |
| **Aprobada** | **B.3** | Desempaquetado dual de JSON de Gemini y JSON directo `{"partes": [...]}` en `parseResults` | **APROBADA** |
| **Aprobada** | **B.4** | Prompt NTC 1443 / GTC 157 y respuesta `{"partes": []}` ante imágenes no válidas (`503`) | **APROBADA** |
| **Aprobada** | **C.1** | Hoja `A4` vertical (`595 x 842` pt, márgenes `40` pt, 1 página) y `chart.jrxml` (`515 x 220` pt, `barChart` `515 x 200` pt, `SansSerif`) | **APROBADA** |
| **Aprobada** | **C.2** | Parámetros desde `Report` + `ReportStatistics.fromJson` (sin `EvaluationRepository`), gráfica PNG y tabla NTC 1..5 | **APROBADA** |
| **Aprobada** | **D.1 (Opción 2)** | Cliente móvil con **Capacitor** (`co.unillanos.secct`) con subconjunto Piscicultor (HU-02 a HU-06) | **APROBADA** |
| **Aprobada** | **D.2** | `AccessibilityWidget.tsx` con persistencia híbrida sincronizada (`localStorage` + `@capacitor/preferences`) | **APROBADA** |
| **Aprobada** | **D.3** | Minificación y ofuscación en `vite.config.ts` solo en modo `build` (`compact: true`, `controlFlowFlattening: false`, `renameGlobals: false`) | **APROBADA** |
| **Aprobada** | **D.4** | Internacionalización (i18n) implementada estrictamente al final del proyecto | **APROBADA** |
| **Aprobada** | **D.5** | Doble ruta actual de lotes evaluados en `BatchController` | **APROBADA** |
| **Aprobada** | **A.1** | Estrategia de migraciones `V1`–`V7` inmutables + `V8` alineación y `V9` tabla `reporte` y eventos | **APROBADA** |
| **Aprobada** | **A.2** | Constraint `ck_lote_estado_clasificacion` en tabla `lote` (`EVALUADO` y `REPORTADO`) | **APROBADA** |

---

## Decisiones Aprobadas por el Equipo

1. **B.1 — Contrato de configuración de Gemini API (`CNN_URL` y `GEMINI_API_KEY`) — [APROBADA]:**
   - `secct.cnn.url` (`CNN_URL`) apunta por defecto al endpoint `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.
   - `secct.cnn.api-key` (`GEMINI_API_KEY`) se envía exclusivamente en la cabecera HTTP `x-goog-api-key` (nunca concatenada en la URL `?key=`).

2. **B.2 — Detección de `mimeType` para `inlineData` en `HttpCnnClassifier` — [APROBADA]:**
   - `HttpCnnClassifier.detectMimeType(byte[] image)` deduce `"image/png"` si los primeros 4 bytes coinciden con `89 50 4E 47` y `"image/jpeg"` por defecto, conservando intacta la firma `Classifier.classify(byte[] image)`.

3. **B.3 — Desempaquetado dual en `HttpCnnClassifier.parseResults(String body)` — [APROBADA]:**
   - `HttpCnnClassifier.parseResults(String body)` acepta tanto el sobre JSON de Google Gemini API (`candidates[0].content.parts[0].text`) como el JSON directo `{"partes": [...]}`.

4. **B.4 — Prompt NTC 1443 / GTC 157 y manejo de imágenes no correspondientes a tilapia — [APROBADA]:**
   - `HttpCnnClassifier` envía instrucciones estrictas bajo **NTC 1443 y GTC 157** para evaluar `"OJO"` y `"PIEL"` en escala entera `1..5` usando `responseMimeType: "application/json"` y `responseSchema`.
   - Si la imagen no corresponde a una tilapia o no permite evaluar ojo y piel, el modelo retorna `{"partes": []}`, ante lo cual `HttpCnnClassifier` lanza `BusinessException` con estado `503`.

5. **C.1 — Especificación visual de `batch-report.jrxml` y `chart.jrxml` — [APROBADA]:**
   - `batch-report.jrxml` usa página **A4 vertical** (`595 x 842` pt a `72` dpi) con márgenes de `40` pt (ancho útil `515` pt) en **una sola página**.
   - `chart.jrxml` usa dimensiones `515 x 220` pt con un `<barChart>` de `515 x 200` pt y fuente `SansSerif`.

6. **C.2 — Parámetros y origen de datos de `batch-report.jrxml` (`JasperReportGenerator.exportPdf`) — [APROBADA]:**
   - `JasperReportGenerator.exportPdf(Report)` construye el mapa de parámetros exclusivamente a partir de `Report`, `Batch` y `ReportStatistics.fromJson(report.getStatistics())`, sin consultar `EvaluationRepository`.
   - La plantilla de una sola página presenta encabezado, datos del lote y resumen estadístico congelado, gráfica PNG embebida (`renderChartPng`) y desglose por categoría NTC (`1` a `5`).

7. **D.1 (Opción 2) — Arquitectura y alcance del Cliente Móvil con Capacitor — [APROBADA]:**
   - Se configura **Capacitor** (`appId: "co.unillanos.secct"`, `appName: "SECCT"`, `webDir: "dist"`) con soporte Android (`@capacitor/android`).
   - En modo móvil nativo (`isMobileApp()`), el rol Piscicultor expone exclusivamente el subconjunto operativo aprobado: **HU-02** (Login/Logout), **HU-03** (Registrar lote), **HU-04** (Evaluar lote) y **HU-05 / HU-06** (Lotes evaluados y Ver/Generar reporte), manteniendo las 14 HUs completas en la versión Web.

8. **D.2 — Complemento de Accesibilidad (`AccessibilityWidget.tsx`) — [APROBADA]:**
   - Persistencia híbrida sincronizada entre `localStorage` (web) y `@capacitor/preferences` (APK) con 5 controles (`tamaño de fuente`, `alto contraste`, `escala de grises`, `subrayado de enlaces`, `reducir animaciones`) y HTML semántico WCAG AA.

9. **D.3 — Ofuscación y Minificación en Vite (`vite.config.ts`) — [APROBADA]:**
   - Aplicada exclusivamente en modo `build` (`compact: true`, `controlFlowFlattening: false`, `renameGlobals: false`).

10. **D.4 — Internacionalización (i18n) — [APROBADA]:**
    - Se implementará estrictamente al final del proyecto.

11. **D.5 — Doble ruta para listar lotes evaluados (`DS-HU4-listar` vs `DS-HU5`) — [APROBADA]:**
    - Se mantiene sin cambios la doble ruta actual en `BatchController` (`GET /api/batches?estado=EVALUADO` y `GET /api/batches/evaluated`).

12. **A.1 — Estrategia de reconciliación en Supabase y migraciones incrementales — [APROBADA]:**
    - Las migraciones ya aplicadas `V1`–`V7` se mantienen intactas e inmutables en el repositorio (protegiendo el `flyway_schema_history` en Supabase).
    - Se divide la evolución en dos scripts idempotentes: `V8__align_schema_with_entities.sql` (reconciliación condicional no-op en Supabase y alineación completa sobre bases creadas con `V1`–`V7`) y `V9__create_reporte_and_event_types.sql` (creación de la tabla `reporte` con sus restricciones e índices, más la inserción idempotente de los 9 nuevos códigos de auditoría en `tipo_evento`).

13. **A.2 — Constraint `ck_lote_estado_clasificacion` en tabla `lote` — [APROBADA]:**
    - Confirmado contra el catálogo `pg_constraint` de Supabase: `ck_lote_estado_clasificacion` exige `CHECK (((estado_lote_id = ANY (ARRAY[3, 4])) = (clasificacion_final IS NOT NULL)))`, contemplando explícitamente `EVALUADO (3)` y `REPORTADO (4)`. `V8__align_schema_with_entities.sql` asegura condicionalmente esta definición exacta.

---

## Decisiones Pendientes de Confirmación

No quedan decisiones pendientes (**0 decisiones abiertas**). Todas las definiciones técnicas del sistema (Bloques **A**, **B**, **C** y **D**) se encuentran aprobadas e implementadas.
