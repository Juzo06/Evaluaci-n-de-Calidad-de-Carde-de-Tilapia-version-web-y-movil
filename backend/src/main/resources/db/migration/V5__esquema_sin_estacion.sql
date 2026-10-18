-- =====================================================================
-- V5 - Alinea el esquema con el de Supabase actual (decisión del equipo):
--      * se elimina la estación (tabla estacion y lote.estacion_id)
--      * lote gana auditoría y borrado lógico
--      * el código del lote debe llevar la fecha de captura
-- Es idempotente: en Supabase (donde ya está así) no cambia nada; en una
-- base nueva (Testcontainers, otro compañero) la deja igual.
-- =====================================================================

ALTER TABLE lote DROP CONSTRAINT IF EXISTS lote_estacion_id_fkey;
ALTER TABLE lote DROP COLUMN IF EXISTS estacion_id;
DROP TABLE IF EXISTS estacion CASCADE;

ALTER TABLE lote ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE lote ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE lote ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE lote ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE lote ADD COLUMN IF NOT EXISTS deleted_by INT4 NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lote_deleted_by') THEN
        ALTER TABLE lote ADD CONSTRAINT fk_lote_deleted_by
            FOREIGN KEY (deleted_by) REFERENCES usuario (id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_lote_soft_delete') THEN
        ALTER TABLE lote ADD CONSTRAINT ck_lote_soft_delete
            CHECK (is_deleted = (deleted_at IS NOT NULL) AND is_deleted = (deleted_by IS NOT NULL));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_lote_codigo_fecha') THEN
        ALTER TABLE lote ADD CONSTRAINT ck_lote_codigo_fecha
            CHECK (SUBSTRING(codigo FROM 7 FOR 8) = to_char(fecha_captura::timestamptz, 'YYYYMMDD'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_lote_estado_clasificacion') THEN
        ALTER TABLE lote ADD CONSTRAINT ck_lote_estado_clasificacion
            CHECK ((estado_lote_id = ANY (ARRAY[3, 4])) = (clasificacion_final IS NOT NULL));
    END IF;
END $$;

-- Contador del código de lote (V4), por si no existiera.
CREATE TABLE IF NOT EXISTS secuencia_codigo_lote (
    fecha   DATE NOT NULL,
    ultimo  INT4 NOT NULL,
    CONSTRAINT secuencia_codigo_lote_pkey PRIMARY KEY (fecha),
    CONSTRAINT ck_secuencia_ultimo CHECK (ultimo >= 1)
);
