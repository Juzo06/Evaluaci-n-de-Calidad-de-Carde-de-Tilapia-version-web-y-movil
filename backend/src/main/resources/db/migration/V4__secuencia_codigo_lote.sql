-- =====================================================================
-- V4 - HU03: contador diario para generar el código del lote
--      SECCT-AAAAMMDD-NNN. Una fila por día; el secuencial se incrementa
--      de forma atómica, así que el código es único aunque la aplicación
--      se reinicie o haya varias instancias. Es aditiva.
-- =====================================================================
CREATE TABLE IF NOT EXISTS secuencia_codigo_lote (
    fecha   DATE NOT NULL,
    ultimo  INT4 NOT NULL,
    CONSTRAINT secuencia_codigo_lote_pkey PRIMARY KEY (fecha),
    CONSTRAINT ck_secuencia_ultimo CHECK (ultimo >= 1)
);
