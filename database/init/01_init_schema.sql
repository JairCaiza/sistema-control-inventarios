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
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    activo BOOLEAN DEFAULT true,
    UNIQUE (nombre, tipo),
    CHECK (tipo IN ('Herramienta', 'Equipo', 'Material', 'Consumible', 'Otro'))
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

CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activo_id UUID NOT NULL REFERENCES activos(id),
    tipo_movimiento VARCHAR(30) NOT NULL,
    cantidad INTEGER NOT NULL,
    motivo TEXT,
    referencia VARCHAR(100),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    CHECK (cantidad > 0),
    CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste'))
);

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

-- =====================================================
-- FINANZAS
-- =====================================================

CREATE TABLE cuentas_financieras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL,
    saldo_actual NUMERIC(14,2) NOT NULL DEFAULT 0,
    CHECK (saldo_actual >= 0),
    CHECK (tipo IN ('caja', 'banco', 'efectivo', 'transferencia'))
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

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
