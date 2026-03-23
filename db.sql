-- =========================================================
-- SISTEMA INTEGRAL DE GESTIÓN - HNOS GUARACAS
-- PostgreSQL 14+
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1. SEGURIDAD
-- =========================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP
);

CREATE TABLE usuarios_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    rol_id UUID NOT NULL,
    UNIQUE(usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE registros_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =========================================================
-- 2. INVENTARIO
-- =========================================================

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('equipo','herramienta','encofrado')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(nombre, tipo)
);

CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE activos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_id UUID NOT NULL,
    ubicacion_id UUID NOT NULL,
    estado VARCHAR(50) NOT NULL CHECK (
        estado IN ('disponible','alquilado','mantenimiento','danado','perdido')
    ),
    tipo_control VARCHAR(20) NOT NULL CHECK (
        tipo_control IN ('unidad','cantidad')
    ),
    cantidad_total INTEGER NOT NULL CHECK (cantidad_total >= 0),
    valor_reposicion NUMERIC(12,2) CHECK (valor_reposicion >= 0),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
);

CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activo_id UUID NOT NULL,
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (
        tipo_movimiento IN ('entrada','salida','ajuste')
    ),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    motivo TEXT,
    referencia VARCHAR(100),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
);

CREATE INDEX idx_activos_categoria ON activos(categoria_id);
CREATE INDEX idx_movimientos_activo ON movimientos_inventario(activo_id);

-- =========================================================
-- 3. CLIENTES
-- =========================================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_cliente VARCHAR(20) NOT NULL,
    tipo_identificacion VARCHAR(20),
    identificacion VARCHAR(20) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    apellido VARCHAR(150),
    telefono VARCHAR(20),
    direccion TEXT,
    correo VARCHAR(100),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 4. ALQUILER
-- =========================================================

CREATE TABLE contratos_alquiler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_contrato VARCHAR(50) NOT NULL UNIQUE,
    cliente_id UUID NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(30) NOT NULL CHECK (
        estado IN ('activo','finalizado','cancelado')
    ),
    total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    observaciones TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE detalles_contrato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL,
    activo_id UUID NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_diario NUMERIC(12,2) NOT NULL CHECK (precio_diario >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (contrato_id) REFERENCES contratos_alquiler(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES activos(id)
);

CREATE TABLE devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL,
    fecha_devolucion DATE NOT NULL,
    dias_retraso INTEGER DEFAULT 0 CHECK (dias_retraso >= 0),
    penalidad_total NUMERIC(12,2) DEFAULT 0 CHECK (penalidad_total >= 0),
    FOREIGN KEY (contrato_id) REFERENCES contratos_alquiler(id)
);

CREATE INDEX idx_contrato_cliente ON contratos_alquiler(cliente_id);

-- =========================================================
-- 5. VENTAS INTERNAS
-- =========================================================

CREATE TABLE notas_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) NOT NULL UNIQUE,
    cliente_id UUID,
    fecha DATE NOT NULL,
    metodo_pago VARCHAR(30),
    total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE detalles_nota_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nota_venta_id UUID NOT NULL,
    descripcion VARCHAR(150) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (nota_venta_id) REFERENCES notas_venta(id) ON DELETE CASCADE
);

-- =========================================================
-- 6. FINANZAS
-- =========================================================

CREATE TABLE cuentas_financieras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('caja','banco')),
    saldo_actual NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (saldo_actual >= 0)
);

CREATE TABLE transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (
        tipo IN ('ingreso','egreso','transferencia')
    ),
    monto NUMERIC(14,2) NOT NULL CHECK (monto > 0),
    descripcion TEXT,
    fecha DATE NOT NULL,
    referencia_id UUID,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_financieras(id)
);

CREATE INDEX idx_transacciones_cuenta ON transacciones(cuenta_id);

CREATE TABLE cierres_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL,
    fecha DATE NOT NULL,
    saldo_inicial NUMERIC(14,2) NOT NULL,
    saldo_final NUMERIC(14,2) NOT NULL,
    cerrado_por UUID,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_financieras(id),
    FOREIGN KEY (cerrado_por) REFERENCES usuarios(id)
);

-- =========================================================
-- 7. PERSONAL
-- =========================================================

CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    tipo_pago VARCHAR(20) CHECK (
        tipo_pago IN ('diario','semanal','mensual')
    ),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pagos_empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL,
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    fecha DATE NOT NULL,
    descripcion TEXT,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- =========================================================
-- 8. SOCIOS
-- =========================================================

CREATE TABLE socios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    porcentaje_participacion NUMERIC(5,2) NOT NULL CHECK (
        porcentaje_participacion >= 0 AND porcentaje_participacion <= 100
    )
);

CREATE TABLE aportes_socios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    socio_id UUID NOT NULL,
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    fecha DATE NOT NULL,
    FOREIGN KEY (socio_id) REFERENCES socios(id)
);

CREATE TABLE distribuciones_utilidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    socio_id UUID NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
    fecha_pago DATE,
    FOREIGN KEY (socio_id) REFERENCES socios(id)
);