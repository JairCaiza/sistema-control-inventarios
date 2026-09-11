-- =====================================================================
-- CONSTRUCTSYS
-- 01_init_schema_v1.0.0.sql
--
-- Schema inicial estable
-- Versión: 1.0.0
-- PostgreSQL
--
-- IMPORTANTE:
-- Este archivo está diseñado para ejecutarse sobre una BASE DE DATOS
-- NUEVA / VACÍA.
--
-- NO ejecutar sobre la base actual de producción o desarrollo que
-- contenga información.
-- =====================================================================

BEGIN;

-- =====================================================================
-- 01. EXTENSIONES
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =====================================================================
-- 02. SEGURIDAD
-- =====================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(50) NOT NULL UNIQUE,

    descripcion TEXT,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    activo BOOLEAN NOT NULL DEFAULT TRUE
);


CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) NOT NULL,

    apellido VARCHAR(100) NOT NULL,

    correo VARCHAR(100) NOT NULL UNIQUE,

    contrasena VARCHAR(255) NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);


CREATE TABLE usuarios_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    rol_id UUID NOT NULL
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_usuarios_roles
        UNIQUE (
            usuario_id,
            rol_id
        )
);


-- =====================================================================
-- 03. CATÁLOGOS
-- =====================================================================

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) NOT NULL,

    tipo VARCHAR(50) NOT NULL,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_categorias_nombre_tipo
        UNIQUE (
            nombre,
            tipo
        ),

    CONSTRAINT chk_categorias_tipo
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


CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) NOT NULL UNIQUE,

    descripcion TEXT
);


-- =====================================================================
-- 04. CLIENTES
-- =====================================================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tipo_identificacion VARCHAR(20) NOT NULL,

    identificacion VARCHAR(20) NOT NULL UNIQUE,

    nombre VARCHAR(150) NOT NULL,

    telefono VARCHAR(20),

    direccion TEXT,

    correo VARCHAR(150),

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    apellido VARCHAR(150),

    tipo_cliente VARCHAR(20) NOT NULL,

    CONSTRAINT chk_clientes_tipo_cliente
        CHECK (
            tipo_cliente IN (
                'persona',
                'empresa'
            )
        ),

    CONSTRAINT chk_clientes_tipo_identificacion
        CHECK (
            tipo_identificacion IN (
                'cedula',
                'ruc',
                'pasaporte'
            )
        )
);


-- =====================================================================
-- 05. INVENTARIO
--
-- IMPORTANTE:
--
-- ubicacion_id, estado y cantidad_total permanecen temporalmente
-- en activos para mantener compatibilidad con servicios existentes.
--
-- La fuente operacional del inventario nuevo es:
--
-- activos
--      ↓
-- existencias_activos
--      ↓
-- movimientos_inventario
-- =====================================================================

CREATE TABLE activos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo VARCHAR(50) NOT NULL UNIQUE,

    nombre VARCHAR(150) NOT NULL,

    descripcion TEXT,

    categoria_id UUID NOT NULL
        REFERENCES categorias(id)
        ON DELETE RESTRICT,

    -- Compatibilidad temporal con módulos antiguos
    ubicacion_id UUID NOT NULL
        REFERENCES ubicaciones(id)
        ON DELETE RESTRICT,

    -- Compatibilidad temporal
    estado VARCHAR(50) NOT NULL,

    tipo_control VARCHAR(20) NOT NULL,

    -- Compatibilidad temporal
    cantidad_total INTEGER NOT NULL DEFAULT 0,

    valor_reposicion NUMERIC(12,2),

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    marca VARCHAR(100),

    color VARCHAR(50),

    responsable VARCHAR(150),

    observaciones TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_activos_cantidad_total
        CHECK (
            cantidad_total >= 0
        ),

    CONSTRAINT chk_activos_valor_reposicion
        CHECK (
            valor_reposicion IS NULL
            OR valor_reposicion >= 0
        ),

    CONSTRAINT chk_activos_tipo_control
        CHECK (
            tipo_control IN (
                'unidad',
                'cantidad'
            )
        ),

    CONSTRAINT chk_activos_estado
        CHECK (
            estado IN (
                'disponible',
                'alquilado',
                'mantenimiento',
                'danado',
                'perdido',
                'dado_baja'
            )
        )
);


CREATE TABLE existencias_activos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activo_id UUID NOT NULL
        REFERENCES activos(id)
        ON DELETE CASCADE,

    ubicacion_id UUID NOT NULL
        REFERENCES ubicaciones(id)
        ON DELETE RESTRICT,

    estado VARCHAR(30) NOT NULL,

    cantidad INTEGER NOT NULL DEFAULT 0,

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_existencias_activo_ubicacion_estado
        UNIQUE (
            activo_id,
            ubicacion_id,
            estado
        ),

    CONSTRAINT chk_existencias_cantidad
        CHECK (
            cantidad >= 0
        ),

    CONSTRAINT chk_existencias_estado
        CHECK (
            estado IN (
                'disponible',
                'alquilado',
                'mantenimiento',
                'danado',
                'perdido',
                'dado_baja'
            )
        )
);


CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activo_id UUID NOT NULL
        REFERENCES activos(id)
        ON DELETE RESTRICT,

    tipo_movimiento VARCHAR(30) NOT NULL,

    cantidad INTEGER NOT NULL,

    motivo TEXT,

    referencia VARCHAR(100),

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    ubicacion_origen_id UUID
        REFERENCES ubicaciones(id)
        ON DELETE RESTRICT,

    ubicacion_destino_id UUID
        REFERENCES ubicaciones(id)
        ON DELETE RESTRICT,

    estado_origen VARCHAR(30),

    estado_destino VARCHAR(30),

    referencia_id UUID,

    origen_modulo VARCHAR(50),

    CONSTRAINT chk_movimientos_inventario_cantidad
        CHECK (
            cantidad > 0
        ),

    CONSTRAINT chk_movimientos_inventario_tipo
        CHECK (
            tipo_movimiento IN (
                'entrada',
                'salida',
                'transferencia',
                'cambio_estado',
                'ajuste'
            )
        ),

    CONSTRAINT chk_movimientos_estado_origen
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

    CONSTRAINT chk_movimientos_estado_destino
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


-- =====================================================================
-- 06. CONTRATOS DE ALQUILER
-- =====================================================================

CREATE TABLE contratos_alquiler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero_contrato VARCHAR(50) NOT NULL UNIQUE,

    cliente_id UUID NOT NULL
        REFERENCES clientes(id)
        ON DELETE RESTRICT,

    fecha_inicio DATE NOT NULL,

    fecha_fin DATE NOT NULL,

    estado VARCHAR(30) NOT NULL,

    total NUMERIC(12,2) NOT NULL DEFAULT 0,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    observaciones TEXT,

    pagado NUMERIC(12,2) DEFAULT 0,

    saldo_pendiente NUMERIC(12,2) DEFAULT 0,

    CONSTRAINT chk_contratos_fechas
        CHECK (
            fecha_fin >= fecha_inicio
        ),

    CONSTRAINT chk_contratos_estado
        CHECK (
            estado IN (
                'activo',
                'finalizado',
                'cancelado'
            )
        ),

    CONSTRAINT chk_contratos_total
        CHECK (
            total >= 0
        ),

    CONSTRAINT chk_contratos_pagado
        CHECK (
            pagado IS NULL
            OR pagado >= 0
        ),

    CONSTRAINT chk_contratos_saldo_pendiente
        CHECK (
            saldo_pendiente IS NULL
            OR saldo_pendiente >= 0
        )
);


CREATE TABLE detalles_contrato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contrato_id UUID NOT NULL
        REFERENCES contratos_alquiler(id)
        ON DELETE CASCADE,

    activo_id UUID NOT NULL
        REFERENCES activos(id)
        ON DELETE RESTRICT,

    cantidad INTEGER NOT NULL,

    precio_diario NUMERIC(12,2) NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL,

    CONSTRAINT chk_detalles_contrato_cantidad
        CHECK (
            cantidad > 0
        ),

    CONSTRAINT chk_detalles_contrato_precio
        CHECK (
            precio_diario >= 0
        ),

    CONSTRAINT chk_detalles_contrato_subtotal
        CHECK (
            subtotal >= 0
        )
);


CREATE TABLE devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contrato_id UUID NOT NULL
        REFERENCES contratos_alquiler(id)
        ON DELETE RESTRICT,

    fecha_devolucion DATE NOT NULL,

    dias_retraso INTEGER DEFAULT 0,

    penalidad_total NUMERIC(12,2) DEFAULT 0,

    nota_id UUID,

    CONSTRAINT chk_devoluciones_dias_retraso
        CHECK (
            dias_retraso IS NULL
            OR dias_retraso >= 0
        ),

    CONSTRAINT chk_devoluciones_penalidad
        CHECK (
            penalidad_total IS NULL
            OR penalidad_total >= 0
        )
);


-- =====================================================================
-- 07. NOTAS DE VENTA
-- =====================================================================

CREATE TABLE notas_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero VARCHAR(50) NOT NULL UNIQUE,

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE SET NULL,

    fecha DATE NOT NULL,

    metodo_pago VARCHAR(30),

    total NUMERIC(12,2) NOT NULL,

    CONSTRAINT chk_notas_venta_total
        CHECK (
            total >= 0
        )
);


CREATE TABLE detalles_nota_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nota_venta_id UUID NOT NULL
        REFERENCES notas_venta(id)
        ON DELETE CASCADE,

    descripcion VARCHAR(150) NOT NULL,

    cantidad INTEGER NOT NULL,

    precio_unitario NUMERIC(12,2) NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL,

    CONSTRAINT chk_detalles_nota_cantidad
        CHECK (
            cantidad > 0
        ),

    CONSTRAINT chk_detalles_nota_precio
        CHECK (
            precio_unitario >= 0
        ),

    CONSTRAINT chk_detalles_nota_subtotal
        CHECK (
            subtotal >= 0
        )
);


-- =====================================================================
-- 08. OBRAS
-- =====================================================================

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

    fecha_creacion TIMESTAMP DEFAULT NOW(),

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_obras_presupuesto
        CHECK (
            presupuesto IS NULL
            OR presupuesto >= 0
        ),

    CONSTRAINT chk_obras_fechas
        CHECK (
            fecha_fin IS NULL
            OR fecha_inicio IS NULL
            OR fecha_fin >= fecha_inicio
        ),

    CONSTRAINT chk_obras_estado
        CHECK (
            estado IN (
                'planificada',
                'en_proceso',
                'pausada',
                'finalizada',
                'cancelada'
            )
        )
);


-- =====================================================================
-- 09. EMPLEADOS
-- =====================================================================

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

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    observaciones TEXT,

    fecha_creacion TIMESTAMP DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_empleados_tipo_pago
        CHECK (
            tipo_pago IS NULL
            OR tipo_pago IN (
                'diario',
                'semanal',
                'quincenal',
                'mensual'
            )
        ),

    CONSTRAINT chk_empleados_salario
        CHECK (
            salario_base IS NULL
            OR salario_base >= 0
        )
);


CREATE TABLE empleados_obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    obra_id UUID NOT NULL
        REFERENCES obras(id)
        ON DELETE RESTRICT,

    empleado_id UUID NOT NULL
        REFERENCES empleados(id)
        ON DELETE RESTRICT,

    fecha_asignacion DATE DEFAULT CURRENT_DATE,

    activo BOOLEAN DEFAULT TRUE,

    cargo_obra VARCHAR(100),

    fecha_inicio DATE,

    fecha_fin DATE,

    salario_acordado NUMERIC(12,2),

    observaciones TEXT,

    motivo_salida VARCHAR(50),

    CONSTRAINT chk_empleados_obras_salario
        CHECK (
            salario_acordado IS NULL
            OR salario_acordado >= 0
        ),

    CONSTRAINT chk_empleados_obras_fechas
        CHECK (
            fecha_fin IS NULL
            OR fecha_inicio IS NULL
            OR fecha_fin >= fecha_inicio
        ),

    CONSTRAINT chk_empleados_obras_motivo_salida
        CHECK (
            motivo_salida IS NULL
            OR motivo_salida IN (
                'salud',
                'renuncia',
                'despido',
                'abandono',
                'fin_contrato',
                'traslado'
            )
        )
);


-- =====================================================================
-- 10. CONTROL DIARIO DE OBRAS
-- =====================================================================

CREATE TABLE controles_diarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    obra_id UUID NOT NULL
        REFERENCES obras(id)
        ON DELETE RESTRICT,

    fecha DATE NOT NULL,

    actividad TEXT NOT NULL,

    observaciones TEXT,

    clima VARCHAR(50),

    descripcion TEXT,

    hora_inicio TIME,

    hora_fin TIME,

    avance NUMERIC(5,2),

    CONSTRAINT chk_controles_avance
        CHECK (
            avance IS NULL
            OR (
                avance >= 0
                AND avance <= 100
            )
        )
);


CREATE TABLE control_operarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    control_id UUID NOT NULL
        REFERENCES controles_diarios(id)
        ON DELETE CASCADE,

    empleado_id UUID
        REFERENCES empleados(id)
        ON DELETE SET NULL,

    nombre_manual VARCHAR(150),

    clasificacion VARCHAR(30),

    horas_trabajadas NUMERIC(5,2) DEFAULT 0,

    pago NUMERIC(12,2) DEFAULT 0,

    CONSTRAINT chk_control_operarios_horas
        CHECK (
            horas_trabajadas IS NULL
            OR horas_trabajadas >= 0
        ),

    CONSTRAINT chk_control_operarios_pago
        CHECK (
            pago IS NULL
            OR pago >= 0
        )
);


-- =====================================================================
-- 11. CUENTAS FINANCIERAS
-- =====================================================================

CREATE TABLE cuentas_financieras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) NOT NULL UNIQUE,

    tipo VARCHAR(30) NOT NULL,

    saldo_actual NUMERIC(14,2) NOT NULL DEFAULT 0,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    observaciones VARCHAR(300),

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_cuentas_tipo
        CHECK (
            tipo IN (
                'caja',
                'banco',
                'efectivo'
            )
        ),

    CONSTRAINT chk_cuentas_saldo
        CHECK (
            saldo_actual >= 0
        )
);


-- =====================================================================
-- 12. TRANSACCIONES
-- =====================================================================

CREATE TABLE transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cuenta_id UUID NOT NULL
        REFERENCES cuentas_financieras(id)
        ON DELETE RESTRICT,

    tipo VARCHAR(30) NOT NULL,

    monto NUMERIC(14,2) NOT NULL,

    descripcion TEXT,

    fecha DATE NOT NULL,

    referencia_id UUID,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    obra_id UUID
        REFERENCES obras(id)
        ON DELETE SET NULL,

    control_diario_id UUID
        REFERENCES controles_diarios(id)
        ON DELETE SET NULL,

    origen_modulo VARCHAR(50),

    origen_id UUID,

    cuenta_destino_id UUID
        REFERENCES cuentas_financieras(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_transacciones_monto
        CHECK (
            monto > 0
        ),

    CONSTRAINT chk_transacciones_tipo
        CHECK (
            tipo IN (
                'ingreso',
                'egreso',
                'transferencia'
            )
        ),

    CONSTRAINT chk_transferencia_destino
        CHECK (
            (
                tipo = 'transferencia'
                AND cuenta_destino_id IS NOT NULL
                AND cuenta_destino_id <> cuenta_id
            )
            OR
            (
                tipo <> 'transferencia'
            )
        )
);


-- =====================================================================
-- 13. PAGOS DE CONTRATOS
-- =====================================================================

CREATE TABLE pagos_contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contrato_id UUID NOT NULL
        REFERENCES contratos_alquiler(id)
        ON DELETE RESTRICT,

    cuenta_id UUID NOT NULL
        REFERENCES cuentas_financieras(id)
        ON DELETE RESTRICT,

    monto NUMERIC(12,2) NOT NULL,

    fecha DATE NOT NULL DEFAULT CURRENT_DATE,

    metodo_pago VARCHAR(30),

    observaciones TEXT,

    fecha_creacion TIMESTAMP DEFAULT NOW(),

    concepto VARCHAR(50) DEFAULT 'alquiler',

    CONSTRAINT chk_pagos_contratos_monto
        CHECK (
            monto > 0
        ),

    CONSTRAINT chk_pagos_contratos_metodo
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN (
                'efectivo',
                'transferencia',
                'tarjeta',
                'cheque',
                'otro'
            )
        ),

    CONSTRAINT chk_pagos_contratos_concepto
        CHECK (
            concepto IS NULL
            OR concepto IN (
                'alquiler',
                'penalidad',
                'abono',
                'saldo'
            )
        )
);


-- =====================================================================
-- 14. CIERRES DE CAJA
-- =====================================================================

CREATE TABLE cierres_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cuenta_id UUID NOT NULL
        REFERENCES cuentas_financieras(id)
        ON DELETE RESTRICT,

    fecha DATE NOT NULL,

    saldo_inicial NUMERIC(14,2) NOT NULL,

    saldo_final NUMERIC(14,2) NOT NULL,

    cerrado_por UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_cierres_saldo_inicial
        CHECK (
            saldo_inicial >= 0
        ),

    CONSTRAINT chk_cierres_saldo_final
        CHECK (
            saldo_final >= 0
        ),

    CONSTRAINT uq_cierre_cuenta_fecha
        UNIQUE (
            cuenta_id,
            fecha
        )
);


-- =====================================================================
-- 15. GASTOS DE OBRA
-- =====================================================================

CREATE TABLE gastos_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    obra_id UUID NOT NULL
        REFERENCES obras(id)
        ON DELETE RESTRICT,

    control_diario_id UUID
        REFERENCES controles_diarios(id)
        ON DELETE SET NULL,

    tipo VARCHAR(50) NOT NULL,

    descripcion TEXT NOT NULL,

    monto NUMERIC(12,2) NOT NULL,

    fecha DATE NOT NULL,

    cuenta_id UUID
        REFERENCES cuentas_financieras(id)
        ON DELETE RESTRICT,

    transaccion_id UUID
        REFERENCES transacciones(id)
        ON DELETE RESTRICT,

    fecha_pago DATE,

    metodo_pago VARCHAR(30),

    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    referencia VARCHAR(100),

    observaciones TEXT,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_gastos_obra_monto
        CHECK (
            monto > 0
        ),

    CONSTRAINT chk_gastos_obra_estado
        CHECK (
            estado IN (
                'pendiente',
                'pagado',
                'anulado'
            )
        ),

    CONSTRAINT chk_gastos_obra_metodo_pago
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN (
                'efectivo',
                'transferencia',
                'deposito',
                'cheque'
            )
        )
);


CREATE UNIQUE INDEX uq_gastos_obra_transaccion
ON gastos_obra(transaccion_id)
WHERE transaccion_id IS NOT NULL;


-- =====================================================================
-- 16. PAGOS DE EMPLEADOS
-- =====================================================================

CREATE TABLE pagos_empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empleado_id UUID NOT NULL
        REFERENCES empleados(id)
        ON DELETE RESTRICT,

    obra_id UUID
        REFERENCES obras(id)
        ON DELETE SET NULL,

    asignacion_id UUID
        REFERENCES empleados_obras(id)
        ON DELETE SET NULL,

    cuenta_id UUID
        REFERENCES cuentas_financieras(id)
        ON DELETE RESTRICT,

    transaccion_id UUID
        REFERENCES transacciones(id)
        ON DELETE RESTRICT,

    tipo_pago VARCHAR(20) NOT NULL,

    periodo_descripcion VARCHAR(100) NOT NULL,

    fecha_inicio_periodo DATE,

    fecha_fin_periodo DATE,

    monto NUMERIC(12,2) NOT NULL,

    fecha_pago DATE,

    metodo_pago VARCHAR(30),

    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    referencia VARCHAR(100),

    observaciones TEXT,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_pagos_empleados_tipo_pago
        CHECK (
            tipo_pago IN (
                'diario',
                'semanal',
                'quincenal',
                'mensual',
                'otro'
            )
        ),

    CONSTRAINT chk_pagos_empleados_estado
        CHECK (
            estado IN (
                'pendiente',
                'pagado',
                'anulado'
            )
        ),

    CONSTRAINT chk_pagos_empleados_metodo_pago
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN (
                'efectivo',
                'transferencia',
                'deposito',
                'cheque'
            )
        ),

    CONSTRAINT chk_pagos_empleados_monto
        CHECK (
            monto > 0
        ),

    CONSTRAINT chk_pagos_empleados_periodo
        CHECK (
            fecha_fin_periodo IS NULL
            OR fecha_inicio_periodo IS NULL
            OR fecha_fin_periodo >= fecha_inicio_periodo
        )
);


-- =====================================================================
-- 17. SOCIOS
--
-- El porcentaje de participación NO se almacena.
-- Se calcula dinámicamente según capital neto confirmado.
-- =====================================================================

CREATE TABLE socios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(150) NOT NULL,

    identificacion VARCHAR(20) UNIQUE,

    contacto VARCHAR(30),

    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    usuario_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);


CREATE UNIQUE INDEX uq_socios_usuario
ON socios(usuario_id)
WHERE usuario_id IS NOT NULL;


-- =====================================================================
-- 18. APORTES DE SOCIOS
-- =====================================================================

CREATE TABLE aportes_socios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    socio_id UUID NOT NULL
        REFERENCES socios(id)
        ON DELETE RESTRICT,

    monto NUMERIC(12,2) NOT NULL,

    fecha DATE NOT NULL,

    tipo VARCHAR(20) NOT NULL DEFAULT 'aporte',

    cuenta_id UUID
        REFERENCES cuentas_financieras(id)
        ON DELETE RESTRICT,

    metodo_pago VARCHAR(30),

    referencia VARCHAR(100),

    estado VARCHAR(20) NOT NULL DEFAULT 'confirmado',

    observaciones TEXT,

    transaccion_id UUID
        REFERENCES transacciones(id)
        ON DELETE RESTRICT,

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_aportes_socios_monto
        CHECK (
            monto > 0
        ),

    CONSTRAINT chk_aportes_socios_tipo
        CHECK (
            tipo IN (
                'aporte',
                'retiro'
            )
        ),

    CONSTRAINT chk_aportes_socios_estado
        CHECK (
            estado IN (
                'pendiente',
                'confirmado',
                'anulado'
            )
        ),

    CONSTRAINT chk_aportes_socios_metodo_pago
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN (
                'efectivo',
                'transferencia',
                'deposito',
                'cheque'
            )
        )
);


-- =====================================================================
-- 19. DISTRIBUCIONES DE UTILIDADES
-- =====================================================================

CREATE TABLE distribuciones_utilidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    socio_id UUID NOT NULL
        REFERENCES socios(id)
        ON DELETE RESTRICT,

    periodo VARCHAR(20) NOT NULL,

    monto NUMERIC(12,2) NOT NULL,

    fecha_pago DATE,

    utilidad_base NUMERIC(14,2),

    porcentaje_aplicado NUMERIC(5,2),

    cuenta_id UUID
        REFERENCES cuentas_financieras(id)
        ON DELETE RESTRICT,

    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    metodo_pago VARCHAR(30),

    referencia VARCHAR(100),

    observaciones TEXT,

    transaccion_id UUID
        REFERENCES transacciones(id)
        ON DELETE RESTRICT,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    utilidad_periodo NUMERIC(14,2),

    CONSTRAINT uq_distribucion_socio_periodo
        UNIQUE (
            socio_id,
            periodo
        ),

    CONSTRAINT chk_distribuciones_monto
        CHECK (
            monto >= 0
        ),

    CONSTRAINT chk_distribuciones_utilidad_base
        CHECK (
            utilidad_base IS NULL
            OR utilidad_base >= 0
        ),

    CONSTRAINT chk_distribuciones_utilidad_periodo
        CHECK (
            utilidad_periodo IS NULL
            OR utilidad_periodo >= 0
        ),

    CONSTRAINT chk_distribuciones_porcentaje
        CHECK (
            porcentaje_aplicado IS NULL
            OR (
                porcentaje_aplicado >= 0
                AND porcentaje_aplicado <= 100
            )
        ),

    CONSTRAINT chk_distribuciones_estado
        CHECK (
            estado IN (
                'pendiente',
                'pagado',
                'anulado'
            )
        ),

    CONSTRAINT chk_distribuciones_metodo_pago
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN (
                'efectivo',
                'transferencia',
                'deposito',
                'cheque'
            )
        )
);


-- =====================================================================
-- 20. ASISTENCIAS
-- =====================================================================

CREATE TABLE asistencias_empleados (
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

    estado VARCHAR(20) NOT NULL DEFAULT 'presente',

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
        ),

    CONSTRAINT chk_asistencias_estado
        CHECK (
            estado IN (
                'presente',
                'atraso',
                'ausente',
                'permiso',
                'justificado'
            )
        )
);


CREATE TABLE marcaciones_asistencia (
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

    tipo VARCHAR(20) NOT NULL,

    origen_registro VARCHAR(20) NOT NULL DEFAULT 'manual',

    dispositivo_id VARCHAR(100),

    referencia_externa VARCHAR(150),

    observaciones TEXT,

    usuario_registro_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_marcaciones_tipo
        CHECK (
            tipo IN (
                'entrada',
                'salida'
            )
        ),

    CONSTRAINT chk_marcaciones_origen
        CHECK (
            origen_registro IN (
                'manual',
                'biometrico',
                'sistema'
            )
        )
);


CREATE UNIQUE INDEX uq_marcacion_referencia_externa
ON marcaciones_asistencia(referencia_externa)
WHERE referencia_externa IS NOT NULL;


-- =====================================================================
-- 21. AUDITORÍA
-- =====================================================================

CREATE TABLE registros_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    modulo VARCHAR(50) NOT NULL,

    accion VARCHAR(50) NOT NULL,

    registro_id UUID,

    datos_anteriores JSONB,

    datos_nuevos JSONB,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);


-- =====================================================================
-- 22. FUNCIÓN GENÉRICA fecha_actualizacion
-- =====================================================================

CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.fecha_actualizacion = NOW();

    RETURN NEW;

END;
$$;


-- =====================================================================
-- 23. TRIGGERS DE ACTUALIZACIÓN
-- =====================================================================

CREATE TRIGGER trg_usuarios_fecha_actualizacion
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_activos_fecha_actualizacion
BEFORE UPDATE ON activos
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_existencias_fecha_actualizacion
BEFORE UPDATE ON existencias_activos
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_cuentas_fecha_actualizacion
BEFORE UPDATE ON cuentas_financieras
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_empleados_fecha_actualizacion
BEFORE UPDATE ON empleados
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_gastos_obra_fecha_actualizacion
BEFORE UPDATE ON gastos_obra
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_pagos_empleados_fecha_actualizacion
BEFORE UPDATE ON pagos_empleados
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_socios_fecha_actualizacion
BEFORE UPDATE ON socios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_aportes_socios_fecha_actualizacion
BEFORE UPDATE ON aportes_socios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_distribuciones_fecha_actualizacion
BEFORE UPDATE ON distribuciones_utilidades
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_asistencias_fecha_actualizacion
BEFORE UPDATE ON asistencias_empleados
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


CREATE TRIGGER trg_marcaciones_fecha_actualizacion
BEFORE UPDATE ON marcaciones_asistencia
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


-- =====================================================================
-- 24. ÍNDICES
-- =====================================================================

-- ---------------------------------------------------------------------
-- Seguridad
-- ---------------------------------------------------------------------

CREATE INDEX idx_usuarios_roles_usuario
ON usuarios_roles(usuario_id);

CREATE INDEX idx_usuarios_roles_rol
ON usuarios_roles(rol_id);

CREATE INDEX idx_usuarios_activo
ON usuarios(activo);


-- ---------------------------------------------------------------------
-- Inventario
-- ---------------------------------------------------------------------

CREATE INDEX idx_activos_categoria
ON activos(categoria_id);

CREATE INDEX idx_activos_ubicacion
ON activos(ubicacion_id);

CREATE INDEX idx_activos_activo
ON activos(activo);

CREATE INDEX idx_activos_tipo_control
ON activos(tipo_control);

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

CREATE INDEX idx_movimientos_tipo
ON movimientos_inventario(tipo_movimiento);

CREATE INDEX idx_movimientos_origen_ubicacion
ON movimientos_inventario(ubicacion_origen_id);

CREATE INDEX idx_movimientos_destino_ubicacion
ON movimientos_inventario(ubicacion_destino_id);

CREATE INDEX idx_movimientos_origen_modulo
ON movimientos_inventario(
    origen_modulo,
    referencia_id
);


-- ---------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------

CREATE INDEX idx_clientes_tipo
ON clientes(tipo_cliente);

CREATE INDEX idx_clientes_nombre
ON clientes(nombre);


-- ---------------------------------------------------------------------
-- Contratos
-- ---------------------------------------------------------------------

CREATE INDEX idx_contratos_cliente
ON contratos_alquiler(cliente_id);

CREATE INDEX idx_contratos_estado
ON contratos_alquiler(estado);

CREATE INDEX idx_contratos_fechas
ON contratos_alquiler(
    fecha_inicio,
    fecha_fin
);

CREATE INDEX idx_detalles_contrato_contrato
ON detalles_contrato(contrato_id);

CREATE INDEX idx_detalles_contrato_activo
ON detalles_contrato(activo_id);

CREATE INDEX idx_devoluciones_contrato
ON devoluciones(contrato_id);

CREATE INDEX idx_devoluciones_fecha
ON devoluciones(fecha_devolucion);


-- ---------------------------------------------------------------------
-- Ventas
-- ---------------------------------------------------------------------

CREATE INDEX idx_notas_venta_cliente
ON notas_venta(cliente_id);

CREATE INDEX idx_notas_venta_fecha
ON notas_venta(fecha);

CREATE INDEX idx_detalles_nota_venta
ON detalles_nota_venta(nota_venta_id);


-- ---------------------------------------------------------------------
-- Obras
-- ---------------------------------------------------------------------

CREATE INDEX idx_obras_cliente
ON obras(cliente_id);

CREATE INDEX idx_obras_estado
ON obras(estado);

CREATE INDEX idx_obras_fecha_inicio
ON obras(fecha_inicio);


-- ---------------------------------------------------------------------
-- Empleados
-- ---------------------------------------------------------------------

CREATE INDEX idx_empleados_activo
ON empleados(activo);

CREATE INDEX idx_empleados_cargo
ON empleados(cargo);

CREATE INDEX idx_empleados_obras_obra
ON empleados_obras(obra_id);

CREATE INDEX idx_empleados_obras_empleado
ON empleados_obras(empleado_id);

CREATE INDEX idx_empleados_obras_activo
ON empleados_obras(activo);

CREATE INDEX idx_empleados_obras_obra_activo
ON empleados_obras(
    obra_id,
    activo
);

CREATE INDEX idx_controles_diarios_obra
ON controles_diarios(obra_id);

CREATE INDEX idx_controles_diarios_fecha
ON controles_diarios(fecha);

CREATE INDEX idx_controles_diarios_obra_fecha
ON controles_diarios(
    obra_id,
    fecha
);

CREATE INDEX idx_control_operarios_control
ON control_operarios(control_id);

CREATE INDEX idx_control_operarios_empleado
ON control_operarios(empleado_id);


-- ---------------------------------------------------------------------
-- Finanzas
-- ---------------------------------------------------------------------

CREATE INDEX idx_cuentas_tipo
ON cuentas_financieras(tipo);

CREATE INDEX idx_cuentas_activo
ON cuentas_financieras(activo);

CREATE INDEX idx_transacciones_cuenta
ON transacciones(cuenta_id);

CREATE INDEX idx_transacciones_cuenta_destino
ON transacciones(cuenta_destino_id);

CREATE INDEX idx_transacciones_tipo
ON transacciones(tipo);

CREATE INDEX idx_transacciones_fecha
ON transacciones(fecha);

CREATE INDEX idx_transacciones_obra
ON transacciones(obra_id);

CREATE INDEX idx_transacciones_control
ON transacciones(control_diario_id);

CREATE INDEX idx_transacciones_origen
ON transacciones(
    origen_modulo,
    origen_id
);

CREATE INDEX idx_transacciones_referencia
ON transacciones(referencia_id);

CREATE INDEX idx_pagos_contratos_contrato
ON pagos_contratos(contrato_id);

CREATE INDEX idx_pagos_contratos_cuenta
ON pagos_contratos(cuenta_id);

CREATE INDEX idx_pagos_contratos_fecha
ON pagos_contratos(fecha);

CREATE INDEX idx_cierres_caja_cuenta
ON cierres_caja(cuenta_id);

CREATE INDEX idx_cierres_caja_fecha
ON cierres_caja(fecha);


-- ---------------------------------------------------------------------
-- Gastos obra
-- ---------------------------------------------------------------------

CREATE INDEX idx_gastos_obra_obra
ON gastos_obra(obra_id);

CREATE INDEX idx_gastos_obra_control
ON gastos_obra(control_diario_id);

CREATE INDEX idx_gastos_obra_cuenta
ON gastos_obra(cuenta_id);

CREATE INDEX idx_gastos_obra_estado
ON gastos_obra(estado);

CREATE INDEX idx_gastos_obra_fecha
ON gastos_obra(fecha);

CREATE INDEX idx_gastos_obra_tipo
ON gastos_obra(tipo);


-- ---------------------------------------------------------------------
-- Pagos empleados
-- ---------------------------------------------------------------------

CREATE INDEX idx_pagos_empleados_empleado
ON pagos_empleados(empleado_id);

CREATE INDEX idx_pagos_empleados_obra
ON pagos_empleados(obra_id);

CREATE INDEX idx_pagos_empleados_asignacion
ON pagos_empleados(asignacion_id);

CREATE INDEX idx_pagos_empleados_cuenta
ON pagos_empleados(cuenta_id);

CREATE INDEX idx_pagos_empleados_transaccion
ON pagos_empleados(transaccion_id);

CREATE INDEX idx_pagos_empleados_estado
ON pagos_empleados(estado);

CREATE INDEX idx_pagos_empleados_fecha
ON pagos_empleados(fecha_pago);


-- ---------------------------------------------------------------------
-- Socios
-- ---------------------------------------------------------------------

CREATE INDEX idx_socios_activo
ON socios(activo);

CREATE INDEX idx_socios_usuario
ON socios(usuario_id);

CREATE INDEX idx_aportes_socios_socio
ON aportes_socios(socio_id);

CREATE INDEX idx_aportes_socios_cuenta
ON aportes_socios(cuenta_id);

CREATE INDEX idx_aportes_socios_estado
ON aportes_socios(estado);

CREATE INDEX idx_aportes_socios_fecha
ON aportes_socios(fecha);

CREATE INDEX idx_aportes_socios_tipo
ON aportes_socios(tipo);

CREATE INDEX idx_aportes_socios_transaccion
ON aportes_socios(transaccion_id);

CREATE INDEX idx_distribuciones_utilidades_socio
ON distribuciones_utilidades(socio_id);

CREATE INDEX idx_distribuciones_utilidades_periodo
ON distribuciones_utilidades(periodo);

CREATE INDEX idx_distribuciones_utilidades_estado
ON distribuciones_utilidades(estado);

CREATE INDEX idx_distribuciones_utilidades_cuenta
ON distribuciones_utilidades(cuenta_id);

CREATE INDEX idx_distribuciones_utilidades_transaccion
ON distribuciones_utilidades(transaccion_id);


-- ---------------------------------------------------------------------
-- Asistencia
-- ---------------------------------------------------------------------

CREATE INDEX idx_asistencias_empleado
ON asistencias_empleados(empleado_id);

CREATE INDEX idx_asistencias_obra
ON asistencias_empleados(obra_id);

CREATE INDEX idx_asistencias_asignacion
ON asistencias_empleados(asignacion_id);

CREATE INDEX idx_asistencias_fecha
ON asistencias_empleados(fecha);

CREATE INDEX idx_asistencias_estado
ON asistencias_empleados(estado);

CREATE INDEX idx_asistencias_empleado_fecha
ON asistencias_empleados(
    empleado_id,
    fecha
);

CREATE INDEX idx_asistencias_obra_fecha
ON asistencias_empleados(
    obra_id,
    fecha
);

CREATE INDEX idx_marcaciones_asistencia
ON marcaciones_asistencia(asistencia_id);

CREATE INDEX idx_marcaciones_empleado
ON marcaciones_asistencia(empleado_id);

CREATE INDEX idx_marcaciones_obra
ON marcaciones_asistencia(obra_id);

CREATE INDEX idx_marcaciones_asignacion
ON marcaciones_asistencia(asignacion_id);

CREATE INDEX idx_marcaciones_fecha_hora
ON marcaciones_asistencia(fecha_hora);

CREATE INDEX idx_marcaciones_tipo
ON marcaciones_asistencia(tipo);

CREATE INDEX idx_marcaciones_origen
ON marcaciones_asistencia(origen_registro);

CREATE INDEX idx_marcaciones_empleado_fecha_hora
ON marcaciones_asistencia(
    empleado_id,
    fecha_hora
);

CREATE INDEX idx_marcaciones_obra_fecha_hora
ON marcaciones_asistencia(
    obra_id,
    fecha_hora
);


-- ---------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------

CREATE INDEX idx_registros_auditoria_usuario
ON registros_auditoria(usuario_id);

CREATE INDEX idx_registros_auditoria_modulo
ON registros_auditoria(modulo);

CREATE INDEX idx_registros_auditoria_registro
ON registros_auditoria(registro_id);

CREATE INDEX idx_registros_auditoria_fecha
ON registros_auditoria(fecha_creacion);


-- =====================================================================
-- FIN DE TRANSACCIÓN
-- =====================================================================

COMMIT;


-- =====================================================================
-- FIN
-- ConstructSys Database Schema
-- v1.0.0
-- =====================================================================