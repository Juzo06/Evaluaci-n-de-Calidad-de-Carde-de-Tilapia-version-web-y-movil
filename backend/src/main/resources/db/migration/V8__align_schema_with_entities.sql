-- Migración V8: Alineación idempotente del esquema PostgreSQL con las entidades JPA actuales
-- No altera nada cuando se ejecuta sobre el esquema ya alineado en Supabase;
-- sobre una base de datos creada con V1-V7 del repositorio, aplica condicionalmente renombres, tipos, NOT NULL y constraints.

DO $v8$
DECLARE
    v_col RECORD;
    v_has_nulls BOOLEAN;
BEGIN
    -- =========================================================================
    -- 1. TABLA usuario
    -- =========================================================================
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'usuario'
          AND column_name = 'email'
    ) THEN
        UPDATE usuario SET correo = email WHERE correo IS NULL;
        ALTER TABLE usuario DROP COLUMN email;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'usuario'
          AND column_name = 'correo'
          AND (character_maximum_length IS NULL OR character_maximum_length <> 100)
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM usuario WHERE char_length(correo) > 100) THEN
            ALTER TABLE usuario ALTER COLUMN correo TYPE VARCHAR(100);
        END IF;
    END IF;

    FOR v_col IN
        SELECT c.column_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'usuario'
          AND c.column_name IN ('nombres', 'apellidos', 'correo', 'telefono', 'contrasena_hash', 'rol_id', 'salt')
          AND c.is_nullable = 'YES'
    LOOP
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM usuario WHERE %I IS NULL)', v_col.column_name)
            INTO v_has_nulls;
        IF NOT v_has_nulls THEN
            EXECUTE format('ALTER TABLE usuario ALTER COLUMN %I SET NOT NULL', v_col.column_name);
        END IF;
    END LOOP;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'usuario_correo_key'
    ) THEN
        ALTER TABLE usuario ADD CONSTRAINT usuario_correo_key UNIQUE (correo);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'fk_usuario_rol'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES rol(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'fk_usuario_deleted_by'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT fk_usuario_deleted_by FOREIGN KEY (deleted_by) REFERENCES usuario(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'ck_usuario_nombres'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT ck_usuario_nombres
                CHECK (((nombres)::text ~ '^[[:alpha:] ]{2,50}$'::text) AND (btrim((nombres)::text) <> ''::text));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'ck_usuario_apellidos'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT ck_usuario_apellidos
                CHECK (((apellidos)::text ~ '^[[:alpha:] ]{2,50}$'::text) AND (btrim((apellidos)::text) <> ''::text));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'ck_usuario_correo_formato'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT ck_usuario_correo_formato
                CHECK ((correo)::text ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'ck_usuario_correo_largo'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT ck_usuario_correo_largo
                CHECK (char_length((correo)::text) >= 6);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'ck_usuario_correo_minusculas'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT ck_usuario_correo_minusculas
                CHECK ((correo)::text = lower((correo)::text));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'ck_usuario_telefono'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT ck_usuario_telefono
                CHECK ((telefono)::text ~ '^3[0-9]{9}$'::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.usuario'::regclass
          AND c.conname = 'ck_usuario_soft_delete'
    ) THEN
        ALTER TABLE usuario
            ADD CONSTRAINT ck_usuario_soft_delete
                CHECK ((is_deleted = (deleted_at IS NOT NULL)) AND (is_deleted = (deleted_by IS NOT NULL)));
    END IF;

    -- =========================================================================
    -- 2. TABLA lote
    -- =========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'peso_kg'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'peso'
    ) THEN
        ALTER TABLE lote RENAME COLUMN peso_kg TO peso;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'id_usuario'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'usuario_id'
    ) THEN
        ALTER TABLE lote RENAME COLUMN id_usuario TO usuario_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'id_estado_lote'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'estado_lote_id'
    ) THEN
        ALTER TABLE lote RENAME COLUMN id_estado_lote TO estado_lote_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'eliminado'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE lote RENAME COLUMN eliminado TO is_deleted;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'eliminado_en'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE lote RENAME COLUMN eliminado_en TO deleted_at;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'eliminado_por'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'deleted_by'
    ) THEN
        ALTER TABLE lote RENAME COLUMN eliminado_por TO deleted_by;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'creado_en'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE lote RENAME COLUMN creado_en TO created_at;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'actualizado_en'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lote' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE lote RENAME COLUMN actualizado_en TO updated_at;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.lote'::regclass
          AND c.conname = 'ck_lote_clasificacion'
    ) THEN
        ALTER TABLE lote
            ADD CONSTRAINT ck_lote_clasificacion
                CHECK ((clasificacion_final IS NULL) OR ((clasificacion_final >= (1)::numeric) AND (clasificacion_final <= (5)::numeric)));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.lote'::regclass
          AND c.conname = 'ck_lote_codigo'
    ) THEN
        ALTER TABLE lote
            ADD CONSTRAINT ck_lote_codigo
                CHECK ((codigo)::text ~ '^SECCT-[0-9]{8}-[0-9]{3}$'::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.lote'::regclass
          AND c.conname = 'ck_lote_codigo_fecha'
    ) THEN
        ALTER TABLE lote
            ADD CONSTRAINT ck_lote_codigo_fecha
                CHECK (SUBSTRING(codigo FROM 7 FOR 8) = to_char((fecha_captura)::timestamp with time zone, 'YYYYMMDD'::text));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.lote'::regclass
          AND c.conname = 'ck_lote_estado_clasificacion'
    ) THEN
        ALTER TABLE lote
            ADD CONSTRAINT ck_lote_estado_clasificacion
                CHECK ((estado_lote_id = ANY (ARRAY[3, 4])) = (clasificacion_final IS NOT NULL));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.lote'::regclass
          AND c.conname = 'ck_lote_peso'
    ) THEN
        ALTER TABLE lote
            ADD CONSTRAINT ck_lote_peso
                CHECK ((peso >= 0.01) AND (peso <= 10000.00));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.lote'::regclass
          AND c.conname = 'ck_lote_unidades'
    ) THEN
        ALTER TABLE lote
            ADD CONSTRAINT ck_lote_unidades
                CHECK ((numero_unidades_muestra >= 1) AND (numero_unidades_muestra <= 500));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.lote'::regclass
          AND c.conname = 'ck_lote_soft_delete'
    ) THEN
        ALTER TABLE lote
            ADD CONSTRAINT ck_lote_soft_delete
                CHECK ((is_deleted = (deleted_at IS NOT NULL)) AND (is_deleted = (deleted_by IS NOT NULL)));
    END IF;

    -- =========================================================================
    -- 3. TABLA evaluacion
    -- =========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluacion' AND column_name = 'id_lote'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluacion' AND column_name = 'lote_id'
    ) THEN
        ALTER TABLE evaluacion RENAME COLUMN id_lote TO lote_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluacion' AND column_name = 'referencia_imagen'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluacion' AND column_name = 'id_imagen'
    ) THEN
        ALTER TABLE evaluacion RENAME COLUMN referencia_imagen TO id_imagen;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluacion' AND column_name = 'evaluado_en'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluacion' AND column_name = 'fecha_evaluacion'
    ) THEN
        ALTER TABLE evaluacion RENAME COLUMN evaluado_en TO fecha_evaluacion;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'evaluacion'
          AND column_name = 'id_imagen'
          AND (character_maximum_length IS NULL OR character_maximum_length <> 255)
    ) THEN
        ALTER TABLE evaluacion ALTER COLUMN id_imagen TYPE VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.evaluacion'::regclass
          AND c.conname = 'uq_evaluacion_lote_id'
    ) THEN
        ALTER TABLE evaluacion ADD CONSTRAINT uq_evaluacion_lote_id UNIQUE (lote_id, id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.evaluacion'::regclass
          AND c.conname = 'uq_evaluacion_imagen'
    ) THEN
        ALTER TABLE evaluacion ADD CONSTRAINT uq_evaluacion_imagen UNIQUE (id_imagen);
    END IF;

    -- =========================================================================
    -- 4. TABLA punto_evaluacion
    -- =========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'punto_evaluacion' AND column_name = 'id_evaluacion'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'punto_evaluacion' AND column_name = 'evaluacion_id'
    ) THEN
        ALTER TABLE punto_evaluacion RENAME COLUMN id_evaluacion TO evaluacion_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'punto_evaluacion' AND column_name = 'id_parte_pez'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'punto_evaluacion' AND column_name = 'parte_pez_id'
    ) THEN
        ALTER TABLE punto_evaluacion RENAME COLUMN id_parte_pez TO parte_pez_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.punto_evaluacion'::regclass
          AND c.conname = 'ck_punto_categoria'
    ) THEN
        ALTER TABLE punto_evaluacion
            ADD CONSTRAINT ck_punto_categoria CHECK ((categoria_ntc >= 1) AND (categoria_ntc <= 5));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.punto_evaluacion'::regclass
          AND c.conname = 'ck_punto_confianza'
    ) THEN
        ALTER TABLE punto_evaluacion
            ADD CONSTRAINT ck_punto_confianza CHECK ((confianza >= (0)::numeric) AND (confianza <= (1)::numeric));
    END IF;

    -- =========================================================================
    -- 5. TABLA log
    -- =========================================================================
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.log'::regclass
          AND c.conname = 'ck_log_evaluacion_requiere_lote'
    ) THEN
        ALTER TABLE log
            ADD CONSTRAINT ck_log_evaluacion_requiere_lote
                CHECK ((evaluacion_id IS NULL) OR (lote_id IS NOT NULL));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.log'::regclass
          AND c.conname = 'fk_log_evaluacion_lote'
    ) THEN
        ALTER TABLE log
            ADD CONSTRAINT fk_log_evaluacion_lote
                FOREIGN KEY (lote_id, evaluacion_id) REFERENCES evaluacion(lote_id, id) ON DELETE RESTRICT;
    END IF;
END $v8$;

-- Índices en lote alineados con Supabase
CREATE INDEX IF NOT EXISTS idx_lote_fecha_captura ON lote (fecha_captura);
CREATE INDEX IF NOT EXISTS idx_lote_usuario_id ON lote (usuario_id);
CREATE INDEX IF NOT EXISTS ix_lote_usuario_estado ON lote (usuario_id, estado_lote_id);

-- Tabla de secuencia diaria de códigos de lote
CREATE TABLE IF NOT EXISTS secuencia_codigo_lote (
    fecha  DATE    PRIMARY KEY,
    ultimo INTEGER NOT NULL,
    CONSTRAINT ck_secuencia_ultimo CHECK (ultimo >= 1)
);
