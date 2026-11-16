-- Migración V9: Creación de tabla reporte (HU-10 a HU-14) y registro de los 9 códigos nuevos en tipo_evento

CREATE TABLE IF NOT EXISTS reporte (
    id                  SERIAL        PRIMARY KEY,
    lote_id             INTEGER       NOT NULL,
    version             INTEGER       NOT NULL,
    vigente             BOOLEAN       NOT NULL DEFAULT TRUE,
    clasificacion_final NUMERIC(4,2)  NOT NULL,
    numero_evaluaciones INTEGER       NOT NULL,
    estadisticas        JSONB         NOT NULL,
    fecha_generacion    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    is_deleted          BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    deleted_by          INTEGER,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_reporte_lote FOREIGN KEY (lote_id) REFERENCES lote(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reporte_deleted_by FOREIGN KEY (deleted_by) REFERENCES usuario(id) ON DELETE RESTRICT,
    CONSTRAINT uq_reporte_lote_version UNIQUE (lote_id, version),
    CONSTRAINT ck_reporte_version CHECK (version >= 1),
    CONSTRAINT ck_reporte_clasificacion CHECK (clasificacion_final >= 1 AND clasificacion_final <= 5),
    CONSTRAINT ck_reporte_evaluaciones CHECK (numero_evaluaciones >= 1),
    CONSTRAINT ck_reporte_soft_delete CHECK (
        (is_deleted = (deleted_at IS NOT NULL))
        AND (is_deleted = (deleted_by IS NOT NULL))
        AND (NOT (is_deleted AND vigente))
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reporte_vigente
    ON reporte (lote_id)
    WHERE vigente = TRUE AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_reporte_lote_id
    ON reporte (lote_id);

-- Inserción idempotente de los 9 códigos de eventos de auditoría para HU-06 a HU-14
INSERT INTO tipo_evento (codigo, descripcion) VALUES
    ('REPORT_GENERATED', 'Generación de reporte de calidad de lote'),
    ('SYSTEM_INFO_VIEWED', 'Consulta de información global del sistema'),
    ('USER_DELETED', 'Eliminación lógica de cuenta de usuario'),
    ('BATCH_DELETED', 'Eliminación lógica de lote'),
    ('REPORT_SAVED', 'Guardado de versión de reporte de lote'),
    ('REPORT_VIEWED', 'Consulta de reporte guardado'),
    ('REPORT_EXPORTED', 'Exportación de reporte en formato PDF'),
    ('SAMPLE_EXPANDED', 'Ampliación de unidades de muestra de lote'),
    ('REPORT_DELETED', 'Eliminación lógica de reporte guardado')
ON CONFLICT (codigo) DO NOTHING;
