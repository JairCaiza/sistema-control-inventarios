
-- =====================================================
-- CONSTRUCTSYS
-- MIGRACIÓN V1.0.1
-- Jornadas de alquiler y control de pagos
--
-- Para bases existentes con esquema v1.0.0
-- No elimina información existente.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. JORNADAS DE ALQUILER
-- =====================================================

CREATE TABLE IF NOT EXISTS jornadas_alquiler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    detalle_contrato_id UUID NOT NULL
        REFERENCES detalles_contrato(id)
        ON DELETE RESTRICT,

    fecha DATE NOT NULL,

    estado VARCHAR(30) NOT NULL,

    cantidad_efectiva INTEGER NOT NULL DEFAULT 0,

    precio_diario NUMERIC(14,2) NOT NULL DEFAULT 0,

    cobrable BOOLEAN NOT NULL DEFAULT FALSE,

    total_dia NUMERIC(14,2) NOT NULL DEFAULT 0,

    motivo VARCHAR(150),

    observaciones TEXT,

    usuario_registro_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_jornadas_alquiler_detalle_fecha
        UNIQUE (detalle_contrato_id, fecha),

    CONSTRAINT chk_jornadas_alquiler_estado
        CHECK (
            estado IN (
                'trabajado',
                'no_laborable',
                'suspendido',
                'cancelado'
            )
        ),

    CONSTRAINT chk_jornadas_alquiler_cantidad
        CHECK (cantidad_efectiva >= 0),

    CONSTRAINT chk_jornadas_alquiler_precio
        CHECK (precio_diario >= 0),

    CONSTRAINT chk_jornadas_alquiler_total
        CHECK (total_dia >= 0)
);

CREATE INDEX IF NOT EXISTS
idx_jornadas_alquiler_detalle
ON jornadas_alquiler(detalle_contrato_id);

CREATE INDEX IF NOT EXISTS
idx_jornadas_alquiler_fecha
ON jornadas_alquiler(fecha);

CREATE INDEX IF NOT EXISTS
idx_jornadas_alquiler_estado
ON jornadas_alquiler(estado);

-- =====================================================
-- 2. MÉTODOS DE PAGO
-- =====================================================

ALTER TABLE pagos_contratos
DROP CONSTRAINT IF EXISTS chk_pagos_contratos_metodo;

ALTER TABLE pagos_contratos
DROP CONSTRAINT IF EXISTS pagos_contratos_metodo_pago_check;

ALTER TABLE pagos_contratos
ADD CONSTRAINT chk_pagos_contratos_metodo
CHECK (
    metodo_pago IS NULL
    OR metodo_pago IN (
        'efectivo',
        'transferencia',
        'tarjeta',
        'deposito',
        'cheque',
        'otro'
    )
);

-- =====================================================
-- 3. CONCEPTOS DE PAGO
-- =====================================================

ALTER TABLE pagos_contratos
DROP CONSTRAINT IF EXISTS chk_pagos_contratos_concepto;

ALTER TABLE pagos_contratos
DROP CONSTRAINT IF EXISTS pagos_contratos_concepto_check;

ALTER TABLE pagos_contratos
ADD CONSTRAINT chk_pagos_contratos_concepto
CHECK (
    concepto IS NULL
    OR concepto IN (
        'alquiler',
        'penalidad',
        'abono',
        'saldo',
        'anticipo'
    )
);

-- =====================================================
-- 4. ANULACIONES DE PAGOS
-- =====================================================

ALTER TABLE pagos_contratos
ADD COLUMN IF NOT EXISTS
estado VARCHAR(20) NOT NULL DEFAULT 'registrado';

ALTER TABLE pagos_contratos
ADD COLUMN IF NOT EXISTS
motivo_anulacion TEXT;

ALTER TABLE pagos_contratos
ADD COLUMN IF NOT EXISTS
fecha_anulacion TIMESTAMP;

ALTER TABLE pagos_contratos
ADD COLUMN IF NOT EXISTS
anulado_por UUID;

ALTER TABLE pagos_contratos
ADD COLUMN IF NOT EXISTS
transaccion_reversion_id UUID;

ALTER TABLE pagos_contratos
DROP CONSTRAINT IF EXISTS pagos_contratos_estado_check;

ALTER TABLE pagos_contratos
ADD CONSTRAINT pagos_contratos_estado_check
CHECK (
    estado IN ('registrado', 'anulado')
);

ALTER TABLE pagos_contratos
DROP CONSTRAINT IF EXISTS pagos_contratos_anulacion_motivo_check;

ALTER TABLE pagos_contratos
ADD CONSTRAINT pagos_contratos_anulacion_motivo_check
CHECK (
    estado = 'registrado'
    OR (
        motivo_anulacion IS NOT NULL
        AND LENGTH(TRIM(motivo_anulacion)) >= 10
        AND fecha_anulacion IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS
idx_pagos_contratos_contrato_estado
ON pagos_contratos(contrato_id, estado);

-- =====================================================
-- 5. CORRECCIONES DE PAGOS
-- =====================================================

ALTER TABLE pagos_contratos
ADD COLUMN IF NOT EXISTS
pago_original_id UUID;

ALTER TABLE pagos_contratos
ADD COLUMN IF NOT EXISTS
motivo_correccion TEXT;

ALTER TABLE pagos_contratos
ADD COLUMN IF NOT EXISTS
corregido_por UUID;

-- Evitar duplicar la clave foránea.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_pagos_contratos_pago_original'
          AND conrelid = 'pagos_contratos'::regclass
    ) THEN
        ALTER TABLE pagos_contratos
        ADD CONSTRAINT fk_pagos_contratos_pago_original
        FOREIGN KEY (pago_original_id)
        REFERENCES pagos_contratos(id);
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS
ux_pagos_contratos_pago_original
ON pagos_contratos(pago_original_id)
WHERE pago_original_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
idx_pagos_contratos_corregido_por
ON pagos_contratos(corregido_por);

COMMIT;
