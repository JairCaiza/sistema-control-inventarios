-- =====================================================
-- 01_init_schema.sql
-- SCRIPT ESTABLE DE BASE DE DATOS
-- Sistema de Gestión de Procesos Productivos
-- Proyecto DevOps - Microservicios
-- PostgreSQL
-- =====================================================

-- Extensión necesaria para usar gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- LIMPIEZA DE TABLAS
-- =====================================================
DROP TABLE IF EXISTS registros_auditoria CASCADE;
DROP TABLE IF EXISTS usuarios_roles CASCADE;
DROP TABLE IF EXISTS transacciones CASCADE;
DROP TABLE IF EXISTS pagos_contratos CASCADE;
DROP TABLE IF EXISTS cierres_caja CASCADE;
DROP TABLE IF EXISTS distribuciones_utilidades CASCADE;
DROP TABLE IF EXISTS aportes_socios CASCADE;
DROP TABLE IF EXISTS socios CASCADE;
DROP TABLE IF EXISTS gastos_obra CASCADE;
DROP TABLE IF EXISTS control_operarios CASCADE;
DROP TABLE IF EXISTS controles_diarios CASCADE;
DROP TABLE IF EXISTS empleados_obras CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;
DROP TABLE IF EXISTS obras CASCADE;
DROP TABLE IF EXISTS devoluciones CASCADE;
DROP TABLE IF EXISTS detalles_nota_venta CASCADE;
DROP TABLE IF EXISTS notas_venta CASCADE;
DROP TABLE IF EXISTS detalles_contrato CASCADE;
DROP TABLE IF EXISTS contratos_alquiler CASCADE;
DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS activos CASCADE;
DROP TABLE IF EXISTS cuentas_financieras CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =====================================================
-- SEGURIDAD
-- =====================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP
);
INSERT INTO roles (
    nombre,
    descripcion,
    activo
)
VALUES (
    'Socio',
    'Acceso al portal personal de socios',
    TRUE
)
ON CONFLICT (nombre)
DO NOTHING;
ALTER TABLE socios
ADD COLUMN IF NOT EXISTS usuario_id UUID;
ALTER TABLE socios
ADD CONSTRAINT fk_socios_usuario
FOREIGN KEY (usuario_id)
REFERENCES usuarios(id)
ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_socios_usuario
ON socios(usuario_id)
WHERE usuario_id IS NOT NULL;


CREATE TABLE usuarios_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE (usuario_id, rol_id)
);

-- =====================================================
-- CATÁLOGOS
-- =====================================================

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) NOT NULL,

    tipo VARCHAR(50) NOT NULL,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (nombre, tipo),

    CHECK (
        tipo IN (
            'herramienta',
            'equipo',
            'encofrado',
            'material',
            'consumible',
            'otro'
        )
    )
);
CREATE TABLE activos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo VARCHAR(50)
        NOT NULL
        UNIQUE,

    nombre VARCHAR(150)
        NOT NULL,

    descripcion TEXT,

    categoria_id UUID
        NOT NULL
        REFERENCES categorias(id),

    tipo_control VARCHAR(20)
        NOT NULL,

    valor_reposicion NUMERIC(12,2),

    marca VARCHAR(100),

    color VARCHAR(50),

    responsable VARCHAR(150),

    observaciones TEXT,

    activo BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP
        NOT NULL
        DEFAULT NOW(),

    CHECK (
        tipo_control IN (
            'unidad',
            'cantidad'
        )
    ),

    CHECK (
        valor_reposicion IS NULL
        OR valor_reposicion >= 0
    )
);

CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_identificacion VARCHAR(20),
    identificacion VARCHAR(20) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    correo VARCHAR(100),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    apellido VARCHAR(150),
    tipo_cliente VARCHAR(20),
    CHECK (tipo_cliente IS NULL OR tipo_cliente IN ('Natural', 'Empresa'))
);
/* =====================================================
   CORREGIR TABLA CLIENTES
===================================================== */

ALTER TABLE clientes
DROP CONSTRAINT IF EXISTS clientes_tipo_cliente_check;

/* Normalizar datos existentes */
UPDATE clientes
SET tipo_cliente =
    CASE
        WHEN LOWER(tipo_cliente) IN ('natural', 'persona')
            THEN 'persona'

        WHEN LOWER(tipo_cliente) = 'empresa'
            THEN 'empresa'

        ELSE tipo_cliente
    END
WHERE tipo_cliente IS NOT NULL;

/* Hacer campos importantes obligatorios */

ALTER TABLE clientes
ALTER COLUMN tipo_cliente SET NOT NULL;

ALTER TABLE clientes
ALTER COLUMN tipo_identificacion SET NOT NULL;

ALTER TABLE clientes
ALTER COLUMN identificacion SET NOT NULL;

/* CHECK tipo cliente */

ALTER TABLE clientes
ADD CONSTRAINT clientes_tipo_cliente_check
CHECK (
    tipo_cliente IN (
        'persona',
        'empresa'
    )
);

/* CHECK tipo identificación */

ALTER TABLE clientes
ADD CONSTRAINT clientes_tipo_identificacion_check
CHECK (
    tipo_identificacion IN (
        'cedula',
        'ruc',
        'pasaporte'
    )
);
ALTER TABLE clientes
ALTER COLUMN correo TYPE VARCHAR(150);
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tipo_cliente VARCHAR(20) NOT NULL
        CHECK (
            tipo_cliente IN (
                'persona',
                'empresa'
            )
        ),

    tipo_identificacion VARCHAR(20) NOT NULL
        CHECK (
            tipo_identificacion IN (
                'cedula',
                'ruc',
                'pasaporte'
            )
        ),

    identificacion VARCHAR(20)
        NOT NULL
        UNIQUE,

    nombre VARCHAR(150)
        NOT NULL,

    apellido VARCHAR(150),

    telefono VARCHAR(20),

    direccion TEXT,

    correo VARCHAR(150),

    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT NOW()
);
-- =====================================================
-- INVENTARIO
-- =====================================================

CREATE TABLE activos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    ubicacion_id UUID NOT NULL REFERENCES ubicaciones(id),
    estado VARCHAR(50) NOT NULL,
    tipo_control VARCHAR(20) NOT NULL,
    cantidad_total INTEGER NOT NULL,
    valor_reposicion NUMERIC(12,2),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP,
    marca VARCHAR(100),
    color VARCHAR(50),
    responsable VARCHAR(150),
    observaciones TEXT,
    CHECK (cantidad_total >= 0),
    CHECK (valor_reposicion IS NULL OR valor_reposicion >= 0),
    CHECK (estado IN ('Disponible', 'Alquilado', 'Mantenimiento', 'Dado de baja')),
    CHECK (tipo_control IN ('unidad', 'cantidad'))
);
CREATE TABLE existencias_activos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activo_id UUID NOT NULL
        REFERENCES activos(id)
        ON DELETE CASCADE,

    ubicacion_id UUID NOT NULL
        REFERENCES ubicaciones(id),

    estado VARCHAR(30) NOT NULL
        CHECK (
            estado IN (
                'disponible',
                'alquilado',
                'mantenimiento',
                'danado',
                'perdido'
            )
        ),

    cantidad INTEGER NOT NULL DEFAULT 0
        CHECK (cantidad >= 0),

    fecha_actualizacion TIMESTAMP
        NOT NULL DEFAULT NOW(),

    UNIQUE (
        activo_id,
        ubicacion_id,
        estado
    )
);

CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activo_id UUID
        NOT NULL
        REFERENCES activos(id),

    tipo_movimiento VARCHAR(30)
        NOT NULL,

    cantidad INTEGER
        NOT NULL,

    ubicacion_origen_id UUID
        REFERENCES ubicaciones(id),

    ubicacion_destino_id UUID
        REFERENCES ubicaciones(id),

    estado_origen VARCHAR(30),

    estado_destino VARCHAR(30),

    motivo TEXT,

    referencia VARCHAR(100),

    referencia_id UUID,

    origen_modulo VARCHAR(50),

    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT NOW(),

    CHECK (
        cantidad > 0
    ),

    CHECK (
        tipo_movimiento IN (
            'entrada',
            'salida',
            'transferencia',
            'cambio_estado',
            'ajuste'
        )
    ),

    CHECK (
        estado_origen IS NULL
        OR estado_origen IN (
            'disponible',
            'alquilado',
            'mantenimiento',
            'danado',
            'perdido',
            'dado_baja'
        )
    ),

    CHECK (
        estado_destino IS NULL
        OR estado_destino IN (
            'disponible',
            'alquilado',
            'mantenimiento',
            'danado',
            'perdido',
            'dado_baja'
        )
    )
);

CREATE INDEX idx_activos_categoria
ON activos(categoria_id);


CREATE INDEX idx_existencias_activo
ON existencias_activos(activo_id);


CREATE INDEX idx_existencias_ubicacion
ON existencias_activos(ubicacion_id);


CREATE INDEX idx_existencias_estado
ON existencias_activos(estado);


CREATE INDEX idx_existencias_activo_estado
ON existencias_activos(
    activo_id,
    estado
);


CREATE INDEX idx_movimientos_activo
ON movimientos_inventario(activo_id);


CREATE INDEX idx_movimientos_fecha
ON movimientos_inventario(fecha_creacion);


CREATE INDEX idx_movimientos_origen
ON movimientos_inventario(ubicacion_origen_id);


CREATE INDEX idx_movimientos_destino
ON movimientos_inventario(ubicacion_destino_id);

-- =====================================================
-- CONTRATOS DE ALQUILER
-- =====================================================

CREATE TABLE contratos_alquiler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_contrato VARCHAR(50) NOT NULL UNIQUE,
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(30) NOT NULL,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    observaciones TEXT,
    pagado NUMERIC(12,2) DEFAULT 0,
    saldo_pendiente NUMERIC(12,2) DEFAULT 0,
    CHECK (estado IN ('activo', 'finalizado', 'cancelado', 'pendiente')),
    CHECK (total >= 0),
    CHECK (pagado IS NULL OR pagado >= 0),
    CHECK (saldo_pendiente IS NULL OR saldo_pendiente >= 0)
);

CREATE TABLE detalles_contrato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos_alquiler(id) ON DELETE CASCADE,
    activo_id UUID NOT NULL REFERENCES activos(id),
    cantidad INTEGER NOT NULL,
    precio_diario NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    CHECK (cantidad > 0),
    CHECK (precio_diario >= 0),
    CHECK (subtotal >= 0)
);

CREATE TABLE devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos_alquiler(id),
    fecha_devolucion DATE NOT NULL,
    dias_retraso INTEGER DEFAULT 0,
    penalidad_total NUMERIC(12,2) DEFAULT 0,
    nota_id UUID,
    CHECK (dias_retraso IS NULL OR dias_retraso >= 0),
    CHECK (penalidad_total IS NULL OR penalidad_total >= 0)
);

-- =====================================================
-- NOTAS DE VENTA
-- =====================================================

CREATE TABLE notas_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) NOT NULL UNIQUE,
    cliente_id UUID REFERENCES clientes(id),
    fecha DATE NOT NULL,
    metodo_pago VARCHAR(30),
    total NUMERIC(12,2) NOT NULL,
    CHECK (total >= 0)
);

CREATE TABLE detalles_nota_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nota_venta_id UUID NOT NULL REFERENCES notas_venta(id) ON DELETE CASCADE,
    descripcion VARCHAR(150) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    CHECK (cantidad > 0),
    CHECK (precio_unitario >= 0),
    CHECK (subtotal >= 0)
);

-- =====================================================
-- OBRAS Y PERSONAL
-- =====================================================

CREATE TABLE obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    ubicacion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    presupuesto NUMERIC(14,2) DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'planificada',
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT now(),
    cliente_id UUID REFERENCES clientes(id),
    CHECK (estado IN ('planificada', 'en_progreso', 'finalizada', 'cancelada')),
    CHECK (presupuesto IS NULL OR presupuesto >= 0)
);

CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    correo VARCHAR(100),
    direccion TEXT,
    fecha_nacimiento DATE,
    cargo VARCHAR(100),
    tipo_pago VARCHAR(20),
    salario_base NUMERIC(12,2),
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN NOT NULL DEFAULT true,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT now(),
    CHECK (tipo_pago IS NULL OR tipo_pago IN ('diario', 'semanal', 'quincenal', 'mensual')),
    CHECK (salario_base IS NULL OR salario_base >= 0)
);

CREATE TABLE empleados_obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES obras(id),
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT true,
    cargo_obra VARCHAR(100),
    fecha_inicio DATE,
    fecha_fin DATE,
    salario_acordado NUMERIC(12,2),
    observaciones TEXT,
    motivo_salida VARCHAR(50),
    CHECK (salario_acordado IS NULL OR salario_acordado >= 0),
    CHECK (
        motivo_salida IS NULL OR 
        motivo_salida IN ('renuncia', 'despido', 'fin_contrato', 'cambio_obra', 'otro')
    )
);

CREATE TABLE controles_diarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES obras(id),
    fecha DATE NOT NULL,
    actividad TEXT NOT NULL,
    observaciones TEXT,
    clima VARCHAR(50),
    descripcion TEXT,
    hora_inicio TIME,
    hora_fin TIME,
    avance NUMERIC(5,2),
    CHECK (avance IS NULL OR (avance >= 0 AND avance <= 100))
);

CREATE TABLE control_operarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_id UUID NOT NULL REFERENCES controles_diarios(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id),
    nombre_manual VARCHAR(150),
    clasificacion VARCHAR(30),
    horas_trabajadas NUMERIC(5,2) DEFAULT 0,
    pago NUMERIC(12,2) DEFAULT 0,
    CHECK (horas_trabajadas IS NULL OR horas_trabajadas >= 0),
    CHECK (pago IS NULL OR pago >= 0)
);

CREATE TABLE gastos_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES obras(id),
    control_diario_id UUID REFERENCES controles_diarios(id),
    tipo VARCHAR(50),
    descripcion TEXT NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    fecha DATE NOT NULL,
    CHECK (monto >= 0)
);
BEGIN;

-- =====================================================
-- GASTOS DE OBRA
-- EVOLUCIÓN PARA INTEGRACIÓN FINANCIERA
-- =====================================================


-- =====================================================
-- 1. CUENTA FINANCIERA
-- =====================================================

ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS cuenta_id UUID;


-- =====================================================
-- 2. TRANSACCIÓN FINANCIERA ASOCIADA
-- =====================================================

ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS transaccion_id UUID;


-- =====================================================
-- 3. FECHA REAL EN QUE SE EFECTÚA EL PAGO
--
-- fecha = fecha del gasto
-- fecha_pago = fecha en que salió el dinero
-- =====================================================

ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS fecha_pago DATE;


-- =====================================================
-- 4. MÉTODO DE PAGO
-- =====================================================

ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(30);


-- =====================================================
-- 5. ESTADO
--
-- pendiente = todavía no afecta finanzas
-- pagado    = ya generó egreso
-- anulado   = cancelado / revertido
-- =====================================================

ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS estado VARCHAR(20)
NOT NULL DEFAULT 'pendiente';


-- =====================================================
-- 6. REFERENCIA
--
-- Ejemplo:
-- factura
-- transferencia
-- número de comprobante
-- etc.
-- =====================================================

ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS referencia VARCHAR(100);


-- =====================================================
-- 7. OBSERVACIONES
-- =====================================================

ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS observaciones TEXT;


-- =====================================================
-- 8. AUDITORÍA DE FECHAS
-- =====================================================

ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP
NOT NULL DEFAULT NOW();


ALTER TABLE gastos_obra
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP
NOT NULL DEFAULT NOW();


-- =====================================================
-- 9. TIPO DE GASTO OBLIGATORIO
--
-- Como actualmente la tabla está vacía,
-- podemos exigirlo desde ahora.
-- =====================================================

ALTER TABLE gastos_obra
ALTER COLUMN tipo SET NOT NULL;


-- =====================================================
-- 10. MONTO DEBE SER MAYOR A CERO
-- =====================================================

ALTER TABLE gastos_obra
DROP CONSTRAINT IF EXISTS gastos_obra_monto_check;


ALTER TABLE gastos_obra
ADD CONSTRAINT chk_gastos_obra_monto
CHECK (monto > 0);


-- =====================================================
-- 11. ESTADO VÁLIDO
-- =====================================================

ALTER TABLE gastos_obra
DROP CONSTRAINT IF EXISTS chk_gastos_obra_estado;


ALTER TABLE gastos_obra
ADD CONSTRAINT chk_gastos_obra_estado
CHECK (
    estado IN (
        'pendiente',
        'pagado',
        'anulado'
    )
);


-- =====================================================
-- 12. MÉTODO DE PAGO VÁLIDO
-- =====================================================

ALTER TABLE gastos_obra
DROP CONSTRAINT IF EXISTS chk_gastos_obra_metodo_pago;


ALTER TABLE gastos_obra
ADD CONSTRAINT chk_gastos_obra_metodo_pago
CHECK (
    metodo_pago IS NULL
    OR metodo_pago IN (
        'efectivo',
        'transferencia',
        'deposito',
        'cheque'
    )
);


-- =====================================================
-- 13. FK CUENTA FINANCIERA
-- =====================================================

ALTER TABLE gastos_obra
DROP CONSTRAINT IF EXISTS fk_gastos_obra_cuenta;


ALTER TABLE gastos_obra
ADD CONSTRAINT fk_gastos_obra_cuenta
FOREIGN KEY (cuenta_id)
REFERENCES cuentas_financieras(id);


-- =====================================================
-- 14. FK TRANSACCIÓN FINANCIERA
-- =====================================================

ALTER TABLE gastos_obra
DROP CONSTRAINT IF EXISTS fk_gastos_obra_transaccion;


ALTER TABLE gastos_obra
ADD CONSTRAINT fk_gastos_obra_transaccion
FOREIGN KEY (transaccion_id)
REFERENCES transacciones(id);


-- =====================================================
-- 15. MEJORAR FK DE OBRA
--
-- Actualmente tienes ON DELETE CASCADE.
--
-- Eso no es conveniente para información financiera,
-- porque borrar una obra podría borrar sus gastos.
--
-- Lo cambiamos a RESTRICT.
-- =====================================================

ALTER TABLE gastos_obra
DROP CONSTRAINT IF EXISTS gastos_obra_obra_id_fkey;


ALTER TABLE gastos_obra
ADD CONSTRAINT gastos_obra_obra_id_fkey
FOREIGN KEY (obra_id)
REFERENCES obras(id)
ON DELETE RESTRICT;


-- =====================================================
-- 16. CONTROL DIARIO
--
-- Puede desaparecer un control diario sin borrar
-- el gasto financiero.
-- =====================================================

ALTER TABLE gastos_obra
DROP CONSTRAINT IF EXISTS gastos_obra_control_diario_id_fkey;


ALTER TABLE gastos_obra
ADD CONSTRAINT gastos_obra_control_diario_id_fkey
FOREIGN KEY (control_diario_id)
REFERENCES controles_diarios(id)
ON DELETE SET NULL;


-- =====================================================
-- 17. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_gastos_obra_obra
ON gastos_obra(obra_id);


CREATE INDEX IF NOT EXISTS idx_gastos_obra_control
ON gastos_obra(control_diario_id);


CREATE INDEX IF NOT EXISTS idx_gastos_obra_cuenta
ON gastos_obra(cuenta_id);


CREATE INDEX IF NOT EXISTS idx_gastos_obra_transaccion
ON gastos_obra(transaccion_id);


CREATE INDEX IF NOT EXISTS idx_gastos_obra_estado
ON gastos_obra(estado);


CREATE INDEX IF NOT EXISTS idx_gastos_obra_fecha
ON gastos_obra(fecha);


CREATE INDEX IF NOT EXISTS idx_gastos_obra_tipo
ON gastos_obra(tipo);


-- =====================================================
-- 18. EVITAR QUE DOS GASTOS UTILICEN
-- LA MISMA TRANSACCIÓN
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_gastos_obra_transaccion
ON gastos_obra(transaccion_id)
WHERE transaccion_id IS NOT NULL;


COMMIT;
-- =====================================================
-- FINANZAS
-- =====================================================

CREATE TABLE cuentas_financieras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) NOT NULL UNIQUE,

    tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('caja', 'banco', 'efectivo')),

    saldo_actual NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (saldo_actual >= 0),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    observaciones VARCHAR(300),

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE pagos_contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos_alquiler(id),
    cuenta_id UUID NOT NULL REFERENCES cuentas_financieras(id),
    monto NUMERIC(12,2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(30),
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT now(),
    concepto VARCHAR(50) DEFAULT 'alquiler',
    CHECK (monto > 0),
    CHECK (metodo_pago IS NULL OR metodo_pago IN ('efectivo', 'transferencia', 'deposito', 'tarjeta')),
    CHECK (concepto IS NULL OR concepto IN ('alquiler', 'penalidad', 'abono'))
);

CREATE TABLE transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES cuentas_financieras(id),
    tipo VARCHAR(30) NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    referencia_id UUID,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    obra_id UUID REFERENCES obras(id),
    control_diario_id UUID REFERENCES controles_diarios(id),
    origen_modulo VARCHAR(50),
    origen_id UUID,
    CHECK (monto > 0),
    CHECK (tipo IN ('ingreso', 'egreso', 'transferencia'))
);

CREATE TABLE cierres_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES cuentas_financieras(id),
    fecha DATE NOT NULL,
    saldo_inicial NUMERIC(14,2) NOT NULL,
    saldo_final NUMERIC(14,2) NOT NULL,
    cerrado_por UUID REFERENCES usuarios(id),
    CHECK (saldo_inicial >= 0),
    CHECK (saldo_final >= 0)
);

-- =====================================================
-- SOCIOS Y UTILIDADES
-- =====================================================

CREATE TABLE socios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    porcentaje_participacion NUMERIC(5,2) NOT NULL,
    CHECK (porcentaje_participacion >= 0 AND porcentaje_participacion <= 100)
);

CREATE TABLE aportes_socios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    socio_id UUID NOT NULL REFERENCES socios(id),
    monto NUMERIC(12,2) NOT NULL,
    fecha DATE NOT NULL,
    CHECK (monto > 0)
);

CREATE TABLE distribuciones_utilidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    socio_id UUID NOT NULL REFERENCES socios(id),
    periodo VARCHAR(20) NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    fecha_pago DATE,
    CHECK (monto >= 0)
);

ALTER TABLE distribuciones_utilidades
ADD COLUMN IF NOT EXISTS utilidad_base NUMERIC(14,2),
ADD COLUMN IF NOT EXISTS porcentaje_aplicado NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS cuenta_id UUID,
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(30),
ADD COLUMN IF NOT EXISTS referencia VARCHAR(100),
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS transaccion_id UUID,
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE distribuciones_utilidades
ADD CONSTRAINT fk_distribuciones_utilidades_cuenta
FOREIGN KEY (cuenta_id)
REFERENCES cuentas_financieras(id);

ALTER TABLE distribuciones_utilidades
ADD CONSTRAINT fk_distribuciones_utilidades_transaccion
FOREIGN KEY (transaccion_id)
REFERENCES transacciones(id);
ALTER TABLE distribuciones_utilidades
ADD CONSTRAINT chk_distribuciones_utilidades_utilidad_base
CHECK (
    utilidad_base IS NULL
    OR utilidad_base >= 0
);

ALTER TABLE distribuciones_utilidades
ADD CONSTRAINT chk_distribuciones_utilidades_porcentaje
CHECK (
    porcentaje_aplicado IS NULL
    OR (
        porcentaje_aplicado >= 0
        AND porcentaje_aplicado <= 100
    )
);

ALTER TABLE distribuciones_utilidades
ADD CONSTRAINT chk_distribuciones_utilidades_estado
CHECK (
    estado IN (
        'pendiente',
        'aprobado',
        'pagado',
        'anulado'
    )
);

ALTER TABLE distribuciones_utilidades
ADD CONSTRAINT chk_distribuciones_utilidades_metodo_pago
CHECK (
    metodo_pago IS NULL
    OR metodo_pago IN (
        'efectivo',
        'transferencia',
        'deposito',
        'cheque'
    )
);

ALTER TABLE distribuciones_utilidades
ADD CONSTRAINT uq_distribucion_socio_periodo
UNIQUE (
    socio_id,
    periodo
);
ALTER TABLE distribuciones_utilidades

ADD COLUMN IF NOT EXISTS utilidad_base NUMERIC(14,2),

ADD COLUMN IF NOT EXISTS porcentaje_aplicado NUMERIC(5,2),

ADD COLUMN IF NOT EXISTS cuenta_id UUID
REFERENCES cuentas_financieras(id),

ADD COLUMN IF NOT EXISTS estado VARCHAR(20)
NOT NULL DEFAULT 'pendiente',

ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(30),

ADD COLUMN IF NOT EXISTS referencia VARCHAR(100),

ADD COLUMN IF NOT EXISTS observaciones TEXT,

ADD COLUMN IF NOT EXISTS transaccion_id UUID
REFERENCES transacciones(id),

ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP
NOT NULL DEFAULT NOW(),

ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP
NOT NULL DEFAULT NOW();
ALTER TABLE distribuciones_utilidades

ADD CONSTRAINT chk_distribucion_utilidad_base
CHECK (
    utilidad_base IS NULL
    OR utilidad_base >= 0
);
ALTER TABLE distribuciones_utilidades

ADD CONSTRAINT chk_distribucion_porcentaje
CHECK (
    porcentaje_aplicado IS NULL
    OR (
        porcentaje_aplicado >= 0
        AND porcentaje_aplicado <= 100
    )
);
ALTER TABLE distribuciones_utilidades

ADD CONSTRAINT chk_distribucion_estado
CHECK (
    estado IN (
        'pendiente',
        'pagado',
        'anulado'
    )
);
ALTER TABLE distribuciones_utilidades

ADD CONSTRAINT chk_distribucion_metodo_pago
CHECK (
    metodo_pago IS NULL
    OR metodo_pago IN (
        'efectivo',
        'transferencia',
        'deposito',
        'cheque'
    )
);
ALTER TABLE distribuciones_utilidades

ADD CONSTRAINT uq_distribucion_socio_periodo
UNIQUE (
    socio_id,
    periodo
);
ALTER TABLE distribuciones_utilidades
ADD COLUMN IF NOT EXISTS utilidad_periodo NUMERIC(14,2);
CREATE INDEX IF NOT EXISTS idx_distribuciones_utilidades_periodo
ON distribuciones_utilidades(periodo);

CREATE INDEX IF NOT EXISTS idx_distribuciones_utilidades_estado
ON distribuciones_utilidades(estado);

CREATE INDEX IF NOT EXISTS idx_distribuciones_utilidades_cuenta
ON distribuciones_utilidades(cuenta_id);


ALTER TABLE socios
ADD COLUMN IF NOT EXISTS identificacion VARCHAR(20);

ALTER TABLE socios
ADD COLUMN IF NOT EXISTS contacto VARCHAR(30);

ALTER TABLE socios
ADD COLUMN IF NOT EXISTS fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE socios
ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE socios
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE socios
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE socios
ADD CONSTRAINT uq_socios_identificacion
UNIQUE (identificacion);


ALTER TABLE aportes_socios
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'aporte',
ADD COLUMN IF NOT EXISTS cuenta_id UUID,
ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(30),
ADD COLUMN IF NOT EXISTS referencia VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'confirmado',
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS transaccion_id UUID,
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE aportes_socios
ADD CONSTRAINT chk_aportes_socios_tipo
CHECK (tipo IN ('aporte', 'retiro'));

ALTER TABLE aportes_socios
ADD CONSTRAINT chk_aportes_socios_estado
CHECK (estado IN ('pendiente', 'confirmado', 'anulado'));

ALTER TABLE aportes_socios
ADD CONSTRAINT chk_aportes_socios_monto
CHECK (monto > 0);

ALTER TABLE aportes_socios
ADD CONSTRAINT fk_aportes_socios_cuenta
FOREIGN KEY (cuenta_id)
REFERENCES cuentas_financieras(id);
ALTER TABLE aportes_socios
ADD CONSTRAINT fk_aportes_socios_transaccion
FOREIGN KEY (transaccion_id)
REFERENCES transacciones(id);

-- =====================================================
-- AUDITORÍA
-- =====================================================

CREATE TABLE registros_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES ADICIONALES
-- =====================================================

CREATE INDEX idx_activos_categoria ON activos(categoria_id);
CREATE INDEX idx_contrato_cliente ON contratos_alquiler(cliente_id);
CREATE INDEX idx_movimientos_activo ON movimientos_inventario(activo_id);
CREATE INDEX idx_transacciones_cuenta ON transacciones(cuenta_id);
CREATE INDEX idx_transacciones_origen ON transacciones(origen_modulo, origen_id);

-- Índices recomendados para relaciones frecuentes
CREATE INDEX idx_activos_ubicacion ON activos(ubicacion_id);
CREATE INDEX idx_detalles_contrato_contrato ON detalles_contrato(contrato_id);
CREATE INDEX idx_detalles_contrato_activo ON detalles_contrato(activo_id);
CREATE INDEX idx_devoluciones_contrato ON devoluciones(contrato_id);
CREATE INDEX idx_notas_venta_cliente ON notas_venta(cliente_id);
CREATE INDEX idx_detalles_nota_venta_nota ON detalles_nota_venta(nota_venta_id);
CREATE INDEX idx_obras_cliente ON obras(cliente_id);
CREATE INDEX idx_empleados_obras_obra ON empleados_obras(obra_id);
CREATE INDEX idx_empleados_obras_empleado ON empleados_obras(empleado_id);
CREATE INDEX idx_controles_diarios_obra ON controles_diarios(obra_id);
CREATE INDEX idx_control_operarios_control ON control_operarios(control_id);
CREATE INDEX idx_control_operarios_empleado ON control_operarios(empleado_id);
CREATE INDEX idx_gastos_obra_obra ON gastos_obra(obra_id);
CREATE INDEX idx_gastos_obra_control ON gastos_obra(control_diario_id);
CREATE INDEX idx_pagos_contratos_contrato ON pagos_contratos(contrato_id);
CREATE INDEX idx_pagos_contratos_cuenta ON pagos_contratos(cuenta_id);
CREATE INDEX idx_cierres_caja_cuenta ON cierres_caja(cuenta_id);
CREATE INDEX idx_aportes_socios_socio ON aportes_socios(socio_id);
CREATE INDEX idx_distribuciones_utilidades_socio ON distribuciones_utilidades(socio_id);
CREATE INDEX idx_registros_auditoria_usuario ON registros_auditoria(usuario_id);

-- =====================================================
-- DATOS BASE OPCIONALES
-- =====================================================

INSERT INTO roles (nombre, descripcion)
VALUES 
('Administrador', 'Usuario con acceso completo al sistema'),
('Operador', 'Usuario con acceso operativo limitado')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cuentas_financieras (nombre, tipo, saldo_actual)
VALUES
('Caja General', 'caja', 0),
('Banco Principal', 'banco', 0)
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE pagos_empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empleado_id UUID NOT NULL
        REFERENCES empleados(id),

    obra_id UUID
        REFERENCES obras(id),

    asignacion_id UUID
        REFERENCES empleados_obras(id),

    cuenta_id UUID
        REFERENCES cuentas_financieras(id),

    transaccion_id UUID
        REFERENCES transacciones(id),

    tipo_pago VARCHAR(20) NOT NULL,

    periodo_descripcion VARCHAR(100) NOT NULL,

    fecha_inicio_periodo DATE,

    fecha_fin_periodo DATE,

    monto NUMERIC(12,2) NOT NULL,

    fecha_pago DATE,

    metodo_pago VARCHAR(30),

    estado VARCHAR(20)
        NOT NULL
        DEFAULT 'pendiente',

    referencia VARCHAR(100),

    observaciones TEXT,

    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP
        NOT NULL
        DEFAULT NOW(),

    CHECK (
        tipo_pago IN (
            'diario',
            'semanal',
            'quincenal',
            'mensual',
            'otro'
        )
    ),

    CHECK (
        estado IN (
            'pendiente',
            'pagado',
            'anulado'
        )
    ),

    CHECK (
        metodo_pago IS NULL
        OR metodo_pago IN (
            'efectivo',
            'transferencia',
            'deposito',
            'cheque'
        )
    ),

    CHECK (monto > 0),

    CHECK (
        fecha_fin_periodo IS NULL
        OR fecha_inicio_periodo IS NULL
        OR fecha_fin_periodo >= fecha_inicio_periodo
    )
);
CREATE INDEX idx_pagos_empleados_empleado
ON pagos_empleados(empleado_id);

CREATE INDEX idx_pagos_empleados_obra
ON pagos_empleados(obra_id);

CREATE INDEX idx_pagos_empleados_cuenta
ON pagos_empleados(cuenta_id);

CREATE INDEX idx_pagos_empleados_estado
ON pagos_empleados(estado);

CREATE INDEX idx_pagos_empleados_fecha
ON pagos_empleados(fecha_pago);

CREATE INDEX idx_pagos_empleados_transaccion
ON pagos_empleados(transaccion_id);


-- =====================================================
-- MÓDULO DE ASISTENCIA
-- ConstructSys
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ASISTENCIA DIARIA DEL EMPLEADO
-- =====================================================

CREATE TABLE IF NOT EXISTS asistencias_empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empleado_id UUID NOT NULL
        REFERENCES empleados(id)
        ON DELETE RESTRICT,

    obra_id UUID NOT NULL
        REFERENCES obras(id)
        ON DELETE RESTRICT,

    asignacion_id UUID NOT NULL
        REFERENCES empleados_obras(id)
        ON DELETE RESTRICT,

    fecha DATE NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'presente'
        CHECK (
            estado IN (
                'presente',
                'atraso',
                'ausente',
                'permiso',
                'justificado'
            )
        ),

    observaciones TEXT,

    usuario_registro_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_asistencia_empleado_obra_fecha
        UNIQUE (
            empleado_id,
            obra_id,
            fecha
        )
);


-- =====================================================
-- 2. MARCACIONES DE ASISTENCIA
-- =====================================================

CREATE TABLE IF NOT EXISTS marcaciones_asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    asistencia_id UUID NOT NULL
        REFERENCES asistencias_empleados(id)
        ON DELETE CASCADE,

    empleado_id UUID NOT NULL
        REFERENCES empleados(id)
        ON DELETE RESTRICT,

    obra_id UUID NOT NULL
        REFERENCES obras(id)
        ON DELETE RESTRICT,

    asignacion_id UUID NOT NULL
        REFERENCES empleados_obras(id)
        ON DELETE RESTRICT,

    fecha_hora TIMESTAMP NOT NULL,

    tipo VARCHAR(20) NOT NULL
        CHECK (
            tipo IN (
                'entrada',
                'salida'
            )
        ),

    origen_registro VARCHAR(20) NOT NULL DEFAULT 'manual'
        CHECK (
            origen_registro IN (
                'manual',
                'biometrico',
                'sistema'
            )
        ),

    dispositivo_id VARCHAR(100),

    referencia_externa VARCHAR(150),

    observaciones TEXT,

    usuario_registro_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);


-- =====================================================
-- 3. ÍNDICES ASISTENCIAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_asistencias_empleado
ON asistencias_empleados(empleado_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_obra
ON asistencias_empleados(obra_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_asignacion
ON asistencias_empleados(asignacion_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_fecha
ON asistencias_empleados(fecha);

CREATE INDEX IF NOT EXISTS idx_asistencias_estado
ON asistencias_empleados(estado);

CREATE INDEX IF NOT EXISTS idx_asistencias_empleado_fecha
ON asistencias_empleados(
    empleado_id,
    fecha
);

CREATE INDEX IF NOT EXISTS idx_asistencias_obra_fecha
ON asistencias_empleados(
    obra_id,
    fecha
);


-- =====================================================
-- 4. ÍNDICES MARCACIONES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_marcaciones_asistencia
ON marcaciones_asistencia(asistencia_id);

CREATE INDEX IF NOT EXISTS idx_marcaciones_empleado
ON marcaciones_asistencia(empleado_id);

CREATE INDEX IF NOT EXISTS idx_marcaciones_obra
ON marcaciones_asistencia(obra_id);

CREATE INDEX IF NOT EXISTS idx_marcaciones_asignacion
ON marcaciones_asistencia(asignacion_id);

CREATE INDEX IF NOT EXISTS idx_marcaciones_fecha_hora
ON marcaciones_asistencia(fecha_hora);

CREATE INDEX IF NOT EXISTS idx_marcaciones_tipo
ON marcaciones_asistencia(tipo);

CREATE INDEX IF NOT EXISTS idx_marcaciones_origen
ON marcaciones_asistencia(origen_registro);

CREATE INDEX IF NOT EXISTS idx_marcaciones_empleado_fecha_hora
ON marcaciones_asistencia(
    empleado_id,
    fecha_hora
);

CREATE INDEX IF NOT EXISTS idx_marcaciones_obra_fecha_hora
ON marcaciones_asistencia(
    obra_id,
    fecha_hora
);


-- =====================================================
-- 5. EVITAR DUPLICADO DE MARCACIÓN BIOMÉTRICA
--
-- Permite que un dispositivo biométrico mande
-- una referencia externa única.
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_marcacion_referencia_externa
ON marcaciones_asistencia(
    referencia_externa
)
WHERE referencia_externa IS NOT NULL;


-- =====================================================
-- 6. FUNCIÓN PARA ACTUALIZAR fecha_actualizacion
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion_asistencia()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();

    RETURN NEW;
END;
$$;


-- =====================================================
-- 7. TRIGGER ASISTENCIAS
-- =====================================================

DROP TRIGGER IF EXISTS trg_asistencias_fecha_actualizacion
ON asistencias_empleados;

CREATE TRIGGER trg_asistencias_fecha_actualizacion
BEFORE UPDATE
ON asistencias_empleados
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion_asistencia();


-- =====================================================
-- 8. TRIGGER MARCACIONES
-- =====================================================

DROP TRIGGER IF EXISTS trg_marcaciones_fecha_actualizacion
ON marcaciones_asistencia;

CREATE TRIGGER trg_marcaciones_fecha_actualizacion
BEFORE UPDATE
ON marcaciones_asistencia
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion_asistencia();


COMMIT;
-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
