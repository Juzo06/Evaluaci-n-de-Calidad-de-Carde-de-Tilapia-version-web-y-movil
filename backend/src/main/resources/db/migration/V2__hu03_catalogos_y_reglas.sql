-- =====================================================================
-- V2 - HU03 Registrar lote: catálogos mínimos y refuerzo de reglas
-- Es aditiva: no modifica columnas ni borra nada del esquema existente.
-- =====================================================================

-- Catálogos (estaban vacíos). ON CONFLICT: seguro si alguien ya los cargó.
INSERT INTO estado_lote (codigo) VALUES
    ('ABIERTO'), ('EN_EVALUACION'), ('EVALUADO'), ('REPORTADO')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol (codigo) VALUES ('PISCICULTOR')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tipo_evento (codigo, descripcion) VALUES
    ('REGISTRO_LOTE', 'Registro de un nuevo lote de tilapia')
ON CONFLICT (codigo) DO NOTHING;

-- Reglas de la HU03 que el esquema original no cubría (última línea de defensa;
-- el mensaje "por campo" lo produce el dominio).
ALTER TABLE lote ADD CONSTRAINT ck_lote_peso_max
    CHECK (peso <= 10000.00);
ALTER TABLE lote ADD CONSTRAINT ck_lote_unidades_max
    CHECK (numero_unidades_muestra <= 500);
ALTER TABLE estacion ADD CONSTRAINT ck_estacion_nombre_longitud
    CHECK (char_length(nombre) >= 3);

-- Evita "Estación Meta" y "estación meta" como estaciones distintas.
CREATE UNIQUE INDEX uq_estacion_nombre_lower ON estacion (lower(nombre));

-- "Cada piscicultor ve únicamente sus propios lotes" y conteo por fecha.
CREATE INDEX IF NOT EXISTS idx_lote_usuario_id    ON lote (usuario_id);
CREATE INDEX IF NOT EXISTS idx_lote_fecha_captura ON lote (fecha_captura);
