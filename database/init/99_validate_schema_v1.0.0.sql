-- =====================================================================
-- CONSTRUCTSYS
-- 99_validate_schema_v1.0.0.sql
--
-- Validación automática del schema estable
-- Versión: 1.0.0
--
-- Ejecutar DESPUÉS de:
--
-- 01_init_schema_v1.0.0.sql
-- 02_seed_base_v1.0.0.sql
--
-- Debe ejecutarse sobre:
-- constructsys_test_v100
-- =====================================================================


BEGIN;


-- =====================================================================
-- 01. TABLA TEMPORAL DE RESULTADOS
-- =====================================================================

CREATE TEMP TABLE validacion_constructsys (
    orden INTEGER NOT NULL,
    grupo VARCHAR(80) NOT NULL,
    prueba VARCHAR(200) NOT NULL,
    esperado TEXT,
    obtenido TEXT,
    estado VARCHAR(10) NOT NULL,
    detalle TEXT
)
ON COMMIT DROP;


-- =====================================================================
-- 02. EXTENSIÓN PGCRYPTO
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    10,
    'EXTENSIONES',
    'Extensión pgcrypto instalada',
    '1',
    COUNT(*)::TEXT,
    CASE
        WHEN COUNT(*) = 1 THEN 'OK'
        ELSE 'ERROR'
    END,
    'Necesaria para gen_random_uuid()'
FROM pg_extension
WHERE extname = 'pgcrypto';


-- =====================================================================
-- 03. CANTIDAD DE TABLAS FUNCIONALES
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    20,
    'TABLAS',
    'Cantidad total de tablas de ConstructSys',
    '31',
    COUNT(*)::TEXT,
    CASE
        WHEN COUNT(*) = 31 THEN 'OK'
        ELSE 'ERROR'
    END,
    'No deben existir tablas temporales, backup o históricas en una instalación limpia'
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';


-- =====================================================================
-- 04. VALIDAR LAS 31 TABLAS ESPERADAS
-- =====================================================================

WITH tablas_esperadas(tabla) AS (
    VALUES
        ('roles'),
        ('usuarios'),
        ('usuarios_roles'),

        ('categorias'),
        ('ubicaciones'),
        ('clientes'),

        ('activos'),
        ('existencias_activos'),
        ('movimientos_inventario'),

        ('contratos_alquiler'),
        ('detalles_contrato'),
        ('devoluciones'),

        ('notas_venta'),
        ('detalles_nota_venta'),

        ('obras'),
        ('empleados'),
        ('empleados_obras'),
        ('controles_diarios'),
        ('control_operarios'),

        ('cuentas_financieras'),
        ('transacciones'),
        ('pagos_contratos'),
        ('cierres_caja'),

        ('gastos_obra'),
        ('pagos_empleados'),

        ('socios'),
        ('aportes_socios'),
        ('distribuciones_utilidades'),

        ('asistencias_empleados'),
        ('marcaciones_asistencia'),

        ('registros_auditoria')
)

INSERT INTO validacion_constructsys
SELECT
    30,
    'TABLAS',
    'Tabla ' || te.tabla,
    'EXISTE',
    CASE
        WHEN t.table_name IS NOT NULL
            THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END,
    CASE
        WHEN t.table_name IS NOT NULL
            THEN 'OK'
        ELSE 'ERROR'
    END,
    NULL
FROM tablas_esperadas te
LEFT JOIN information_schema.tables t
    ON t.table_schema = 'public'
   AND t.table_type = 'BASE TABLE'
   AND t.table_name = te.tabla;


-- =====================================================================
-- 05. DETECTAR TABLAS NO ESPERADAS
-- =====================================================================

WITH tablas_esperadas(tabla) AS (
    VALUES
        ('roles'),
        ('usuarios'),
        ('usuarios_roles'),
        ('categorias'),
        ('ubicaciones'),
        ('clientes'),
        ('activos'),
        ('existencias_activos'),
        ('movimientos_inventario'),
        ('contratos_alquiler'),
        ('detalles_contrato'),
        ('devoluciones'),
        ('notas_venta'),
        ('detalles_nota_venta'),
        ('obras'),
        ('empleados'),
        ('empleados_obras'),
        ('controles_diarios'),
        ('control_operarios'),
        ('cuentas_financieras'),
        ('transacciones'),
        ('pagos_contratos'),
        ('cierres_caja'),
        ('gastos_obra'),
        ('pagos_empleados'),
        ('socios'),
        ('aportes_socios'),
        ('distribuciones_utilidades'),
        ('asistencias_empleados'),
        ('marcaciones_asistencia'),
        ('registros_auditoria')
),
inesperadas AS (
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND NOT EXISTS (
          SELECT 1
          FROM tablas_esperadas e
          WHERE e.tabla = t.table_name
      )
)

INSERT INTO validacion_constructsys
SELECT
    40,
    'TABLAS',
    'Tablas adicionales no pertenecientes a v1.0.0',
    '0',
    COUNT(*)::TEXT,
    CASE
        WHEN COUNT(*) = 0 THEN 'OK'
        ELSE 'ERROR'
    END,
    COALESCE(
        STRING_AGG(table_name, ', '),
        'Ninguna'
    )
FROM inesperadas;


-- =====================================================================
-- 06. VALIDAR AUSENCIA DE TABLA BACKUP HISTÓRICA
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    50,
    'LIMPIEZA',
    'Tabla backup_devoluciones_ct_j_5238 ausente',
    'NO EXISTE',
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'backup_devoluciones_ct_j_5238'
        )
            THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'backup_devoluciones_ct_j_5238'
        )
            THEN 'ERROR'
        ELSE 'OK'
    END,
    'La tabla backup histórica no debe existir en una instalación nueva';


-- =====================================================================
-- 07. PRIMARY KEYS
-- Todas las tablas principales deben tener PK.
-- =====================================================================

WITH tablas_esperadas(tabla) AS (
    VALUES
        ('roles'),
        ('usuarios'),
        ('usuarios_roles'),
        ('categorias'),
        ('ubicaciones'),
        ('clientes'),
        ('activos'),
        ('existencias_activos'),
        ('movimientos_inventario'),
        ('contratos_alquiler'),
        ('detalles_contrato'),
        ('devoluciones'),
        ('notas_venta'),
        ('detalles_nota_venta'),
        ('obras'),
        ('empleados'),
        ('empleados_obras'),
        ('controles_diarios'),
        ('control_operarios'),
        ('cuentas_financieras'),
        ('transacciones'),
        ('pagos_contratos'),
        ('cierres_caja'),
        ('gastos_obra'),
        ('pagos_empleados'),
        ('socios'),
        ('aportes_socios'),
        ('distribuciones_utilidades'),
        ('asistencias_empleados'),
        ('marcaciones_asistencia'),
        ('registros_auditoria')
),
pk AS (
    SELECT DISTINCT tc.table_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'PRIMARY KEY'
)

INSERT INTO validacion_constructsys
SELECT
    60,
    'PRIMARY KEYS',
    'PK de ' || e.tabla,
    'EXISTE',
    CASE
        WHEN pk.table_name IS NULL
            THEN 'NO EXISTE'
        ELSE 'EXISTE'
    END,
    CASE
        WHEN pk.table_name IS NULL
            THEN 'ERROR'
        ELSE 'OK'
    END,
    NULL
FROM tablas_esperadas e
LEFT JOIN pk
    ON pk.table_name = e.tabla;


-- =====================================================================
-- 08. COLUMNAS CRÍTICAS
-- =====================================================================

WITH columnas_esperadas(tabla, columna) AS (
    VALUES

        -- Usuarios
        ('usuarios', 'id'),
        ('usuarios', 'nombre'),
        ('usuarios', 'apellido'),
        ('usuarios', 'correo'),
        ('usuarios', 'contrasena'),
        ('usuarios', 'activo'),

        -- Activos
        ('activos', 'codigo'),
        ('activos', 'categoria_id'),
        ('activos', 'ubicacion_id'),
        ('activos', 'estado'),
        ('activos', 'tipo_control'),
        ('activos', 'cantidad_total'),
        ('activos', 'valor_reposicion'),
        ('activos', 'activo'),

        -- Existencias
        ('existencias_activos', 'activo_id'),
        ('existencias_activos', 'ubicacion_id'),
        ('existencias_activos', 'estado'),
        ('existencias_activos', 'cantidad'),

        -- Movimientos
        ('movimientos_inventario', 'activo_id'),
        ('movimientos_inventario', 'tipo_movimiento'),
        ('movimientos_inventario', 'ubicacion_origen_id'),
        ('movimientos_inventario', 'ubicacion_destino_id'),
        ('movimientos_inventario', 'estado_origen'),
        ('movimientos_inventario', 'estado_destino'),
        ('movimientos_inventario', 'referencia_id'),
        ('movimientos_inventario', 'origen_modulo'),

        -- Contratos
        ('contratos_alquiler', 'numero_contrato'),
        ('contratos_alquiler', 'cliente_id'),
        ('contratos_alquiler', 'estado'),
        ('contratos_alquiler', 'pagado'),
        ('contratos_alquiler', 'saldo_pendiente'),

        -- Obras
        ('obras', 'codigo'),
        ('obras', 'estado'),
        ('obras', 'cliente_id'),

        -- Personal
        ('empleados', 'cedula'),
        ('empleados', 'tipo_pago'),
        ('empleados', 'activo'),

        ('empleados_obras', 'obra_id'),
        ('empleados_obras', 'empleado_id'),
        ('empleados_obras', 'activo'),
        ('empleados_obras', 'motivo_salida'),

        -- Finanzas
        ('cuentas_financieras', 'saldo_actual'),
        ('cuentas_financieras', 'activo'),

        ('transacciones', 'cuenta_id'),
        ('transacciones', 'cuenta_destino_id'),
        ('transacciones', 'tipo'),
        ('transacciones', 'monto'),
        ('transacciones', 'obra_id'),
        ('transacciones', 'control_diario_id'),
        ('transacciones', 'origen_modulo'),
        ('transacciones', 'origen_id'),

        -- Gastos
        ('gastos_obra', 'cuenta_id'),
        ('gastos_obra', 'transaccion_id'),
        ('gastos_obra', 'estado'),

        -- Pagos empleados
        ('pagos_empleados', 'empleado_id'),
        ('pagos_empleados', 'obra_id'),
        ('pagos_empleados', 'asignacion_id'),
        ('pagos_empleados', 'cuenta_id'),
        ('pagos_empleados', 'transaccion_id'),
        ('pagos_empleados', 'estado'),

        -- Socios
        ('socios', 'identificacion'),
        ('socios', 'usuario_id'),
        ('socios', 'activo'),

        ('aportes_socios', 'tipo'),
        ('aportes_socios', 'estado'),
        ('aportes_socios', 'cuenta_id'),
        ('aportes_socios', 'transaccion_id'),

        ('distribuciones_utilidades', 'utilidad_base'),
        ('distribuciones_utilidades', 'utilidad_periodo'),
        ('distribuciones_utilidades', 'porcentaje_aplicado'),
        ('distribuciones_utilidades', 'estado'),
        ('distribuciones_utilidades', 'cuenta_id'),
        ('distribuciones_utilidades', 'transaccion_id'),

        -- Asistencia
        ('asistencias_empleados', 'empleado_id'),
        ('asistencias_empleados', 'obra_id'),
        ('asistencias_empleados', 'asignacion_id'),
        ('asistencias_empleados', 'estado'),

        ('marcaciones_asistencia', 'asistencia_id'),
        ('marcaciones_asistencia', 'fecha_hora'),
        ('marcaciones_asistencia', 'tipo'),
        ('marcaciones_asistencia', 'origen_registro'),
        ('marcaciones_asistencia', 'referencia_externa')
)

INSERT INTO validacion_constructsys
SELECT
    70,
    'COLUMNAS',
    e.tabla || '.' || e.columna,
    'EXISTE',
    CASE
        WHEN c.column_name IS NULL
            THEN 'NO EXISTE'
        ELSE 'EXISTE'
    END,
    CASE
        WHEN c.column_name IS NULL
            THEN 'ERROR'
        ELSE 'OK'
    END,
    NULL
FROM columnas_esperadas e
LEFT JOIN information_schema.columns c
    ON c.table_schema = 'public'
   AND c.table_name = e.tabla
   AND c.column_name = e.columna;


-- =====================================================================
-- 09. REGLAS IMPORTANTES - OBRAS
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    80,
    'CHECKS',
    'Estados válidos de obras',
    'planificada,en_proceso,pausada,finalizada,cancelada',
    pg_get_constraintdef(c.oid),
    CASE
        WHEN
            pg_get_constraintdef(c.oid) ILIKE '%planificada%'
        AND pg_get_constraintdef(c.oid) ILIKE '%en_proceso%'
        AND pg_get_constraintdef(c.oid) ILIKE '%pausada%'
        AND pg_get_constraintdef(c.oid) ILIKE '%finalizada%'
        AND pg_get_constraintdef(c.oid) ILIKE '%cancelada%'
        AND pg_get_constraintdef(c.oid) NOT ILIKE '%en_progreso%'
            THEN 'OK'
        ELSE 'ERROR'
    END,
    'El backend utiliza en_proceso y contempla pausada'
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'obras'
  AND c.conname = 'chk_obras_estado';


-- =====================================================================
-- 10. REGLAS IMPORTANTES - INVENTARIO
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    90,
    'CHECKS',
    'Estado dado_baja permitido en existencias',
    'dado_baja permitido',
    pg_get_constraintdef(c.oid),
    CASE
        WHEN pg_get_constraintdef(c.oid) ILIKE '%dado_baja%'
            THEN 'OK'
        ELSE 'ERROR'
    END,
    'El backend de inventario actual utiliza dado_baja'
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'existencias_activos'
  AND c.conname = 'chk_existencias_estado';


-- =====================================================================
-- 11. REGLAS IMPORTANTES - TRANSACCIONES
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    100,
    'CHECKS',
    'Tipos de transacción financiera',
    'ingreso,egreso,transferencia',
    pg_get_constraintdef(c.oid),
    CASE
        WHEN
            pg_get_constraintdef(c.oid) ILIKE '%ingreso%'
        AND pg_get_constraintdef(c.oid) ILIKE '%egreso%'
        AND pg_get_constraintdef(c.oid) ILIKE '%transferencia%'
            THEN 'OK'
        ELSE 'ERROR'
    END,
    NULL
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'transacciones'
  AND c.conname = 'chk_transacciones_tipo';


-- =====================================================================
-- 12. REGLA DE SALDO NO NEGATIVO
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    110,
    'CHECKS',
    'Saldo de cuentas financieras no negativo',
    'saldo_actual >= 0',
    pg_get_constraintdef(c.oid),
    CASE
        WHEN pg_get_constraintdef(c.oid) ILIKE '%saldo_actual >=%'
            THEN 'OK'
        ELSE 'ERROR'
    END,
    'El backend valida fondos suficientes antes de egresos y transferencias'
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'cuentas_financieras'
  AND c.conname = 'chk_cuentas_saldo';


-- =====================================================================
-- 13. ASISTENCIA
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    120,
    'CHECKS',
    'Estados de asistencia',
    'presente,atraso,ausente,permiso,justificado',
    pg_get_constraintdef(c.oid),
    CASE
        WHEN
            pg_get_constraintdef(c.oid) ILIKE '%presente%'
        AND pg_get_constraintdef(c.oid) ILIKE '%atraso%'
        AND pg_get_constraintdef(c.oid) ILIKE '%ausente%'
        AND pg_get_constraintdef(c.oid) ILIKE '%permiso%'
        AND pg_get_constraintdef(c.oid) ILIKE '%justificado%'
            THEN 'OK'
        ELSE 'ERROR'
    END,
    NULL
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'asistencias_empleados'
  AND c.conname = 'chk_asistencias_estado';


INSERT INTO validacion_constructsys
SELECT
    130,
    'CHECKS',
    'Tipos de marcación',
    'entrada,salida',
    pg_get_constraintdef(c.oid),
    CASE
        WHEN
            pg_get_constraintdef(c.oid) ILIKE '%entrada%'
        AND pg_get_constraintdef(c.oid) ILIKE '%salida%'
            THEN 'OK'
        ELSE 'ERROR'
    END,
    NULL
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'marcaciones_asistencia'
  AND c.conname = 'chk_marcaciones_tipo';


INSERT INTO validacion_constructsys
SELECT
    140,
    'CHECKS',
    'Orígenes de marcación',
    'manual,biometrico,sistema',
    pg_get_constraintdef(c.oid),
    CASE
        WHEN
            pg_get_constraintdef(c.oid) ILIKE '%manual%'
        AND pg_get_constraintdef(c.oid) ILIKE '%biometrico%'
        AND pg_get_constraintdef(c.oid) ILIKE '%sistema%'
            THEN 'OK'
        ELSE 'ERROR'
    END,
    NULL
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'marcaciones_asistencia'
  AND c.conname = 'chk_marcaciones_origen';


-- =====================================================================
-- 14. DISTRIBUCIONES DE UTILIDADES
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    150,
    'CHECKS',
    'Estados consolidados de distribuciones de utilidades',
    'pendiente,pagado,anulado',
    pg_get_constraintdef(c.oid),
    CASE
        WHEN
            pg_get_constraintdef(c.oid) ILIKE '%pendiente%'
        AND pg_get_constraintdef(c.oid) ILIKE '%pagado%'
        AND pg_get_constraintdef(c.oid) ILIKE '%anulado%'
        AND pg_get_constraintdef(c.oid) NOT ILIKE '%aprobado%'
            THEN 'OK'
        ELSE 'ERROR'
    END,
    'No debe permanecer el CHECK histórico duplicado con estado aprobado'
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'distribuciones_utilidades'
  AND c.conname = 'chk_distribuciones_estado';


-- =====================================================================
-- 15. DETECTAR CHECKS DUPLICADOS EN DISTRIBUCIONES
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    160,
    'LIMPIEZA',
    'Cantidad de CHECK de estado en distribuciones_utilidades',
    '1',
    COUNT(*)::TEXT,
    CASE
        WHEN COUNT(*) = 1 THEN 'OK'
        ELSE 'ERROR'
    END,
    'La versión histórica tenía checks de estado duplicados'
FROM pg_constraint c
JOIN pg_class t
    ON t.oid = c.conrelid
JOIN pg_namespace n
    ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'distribuciones_utilidades'
  AND c.contype = 'c'
  AND pg_get_constraintdef(c.oid) ILIKE '%estado%';


-- =====================================================================
-- 16. FOREIGN KEYS CRÍTICAS
-- =====================================================================

WITH fk_esperadas(tabla, columna, referenciada) AS (
    VALUES
        ('usuarios_roles', 'usuario_id', 'usuarios'),
        ('usuarios_roles', 'rol_id', 'roles'),

        ('activos', 'categoria_id', 'categorias'),
        ('activos', 'ubicacion_id', 'ubicaciones'),

        ('existencias_activos', 'activo_id', 'activos'),
        ('existencias_activos', 'ubicacion_id', 'ubicaciones'),

        ('contratos_alquiler', 'cliente_id', 'clientes'),
        ('detalles_contrato', 'contrato_id', 'contratos_alquiler'),
        ('detalles_contrato', 'activo_id', 'activos'),

        ('obras', 'cliente_id', 'clientes'),

        ('empleados_obras', 'empleado_id', 'empleados'),
        ('empleados_obras', 'obra_id', 'obras'),

        ('controles_diarios', 'obra_id', 'obras'),

        ('transacciones', 'cuenta_id', 'cuentas_financieras'),
        ('transacciones', 'cuenta_destino_id', 'cuentas_financieras'),
        ('transacciones', 'obra_id', 'obras'),

        ('gastos_obra', 'obra_id', 'obras'),
        ('gastos_obra', 'cuenta_id', 'cuentas_financieras'),
        ('gastos_obra', 'transaccion_id', 'transacciones'),

        ('pagos_empleados', 'empleado_id', 'empleados'),
        ('pagos_empleados', 'obra_id', 'obras'),
        ('pagos_empleados', 'asignacion_id', 'empleados_obras'),
        ('pagos_empleados', 'cuenta_id', 'cuentas_financieras'),
        ('pagos_empleados', 'transaccion_id', 'transacciones'),

        ('socios', 'usuario_id', 'usuarios'),

        ('aportes_socios', 'socio_id', 'socios'),
        ('aportes_socios', 'cuenta_id', 'cuentas_financieras'),
        ('aportes_socios', 'transaccion_id', 'transacciones'),

        ('distribuciones_utilidades', 'socio_id', 'socios'),
        ('distribuciones_utilidades', 'cuenta_id', 'cuentas_financieras'),
        ('distribuciones_utilidades', 'transaccion_id', 'transacciones'),

        ('asistencias_empleados', 'empleado_id', 'empleados'),
        ('asistencias_empleados', 'obra_id', 'obras'),
        ('asistencias_empleados', 'asignacion_id', 'empleados_obras'),

        ('marcaciones_asistencia', 'asistencia_id', 'asistencias_empleados'),
        ('marcaciones_asistencia', 'empleado_id', 'empleados'),
        ('marcaciones_asistencia', 'obra_id', 'obras'),
        ('marcaciones_asistencia', 'asignacion_id', 'empleados_obras')
),
fk_reales AS (
    SELECT
        tc.table_name AS tabla,
        kcu.column_name AS columna,
        ccu.table_name AS referenciada
    FROM information_schema.table_constraints tc

    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.constraint_schema = kcu.constraint_schema

    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.constraint_schema = tc.constraint_schema

    WHERE tc.constraint_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
)

INSERT INTO validacion_constructsys
SELECT
    170,
    'FOREIGN KEYS',
    e.tabla || '.' || e.columna || ' -> ' || e.referenciada,
    'EXISTE',
    CASE
        WHEN r.tabla IS NULL
            THEN 'NO EXISTE'
        ELSE 'EXISTE'
    END,
    CASE
        WHEN r.tabla IS NULL
            THEN 'ERROR'
        ELSE 'OK'
    END,
    NULL
FROM fk_esperadas e
LEFT JOIN fk_reales r
    ON r.tabla = e.tabla
   AND r.columna = e.columna
   AND r.referenciada = e.referenciada;


-- =====================================================================
-- 17. UNIQUE IMPORTANTES
-- =====================================================================

WITH uniques_esperados(nombre) AS (
    VALUES
        ('uq_usuarios_roles'),
        ('uq_categorias_nombre_tipo'),
        ('uq_existencias_activo_ubicacion_estado'),
        ('uq_cierre_cuenta_fecha'),
        ('uq_asistencia_empleado_obra_fecha'),
        ('uq_distribucion_socio_periodo')
)

INSERT INTO validacion_constructsys
SELECT
    180,
    'UNIQUE',
    e.nombre,
    'EXISTE',
    CASE
        WHEN c.conname IS NULL
            THEN 'NO EXISTE'
        ELSE 'EXISTE'
    END,
    CASE
        WHEN c.conname IS NULL
            THEN 'ERROR'
        ELSE 'OK'
    END,
    NULL
FROM uniques_esperados e
LEFT JOIN pg_constraint c
    ON c.conname = e.nombre
   AND c.connamespace = 'public'::regnamespace;


-- =====================================================================
-- 18. ÍNDICES ÚNICOS PARCIALES
-- =====================================================================

WITH indices_esperados(nombre) AS (
    VALUES
        ('uq_gastos_obra_transaccion'),
        ('uq_socios_usuario'),
        ('uq_marcacion_referencia_externa')
)

INSERT INTO validacion_constructsys
SELECT
    190,
    'INDICES',
    e.nombre,
    'EXISTE',
    CASE
        WHEN i.indexname IS NULL
            THEN 'NO EXISTE'
        ELSE 'EXISTE'
    END,
    CASE
        WHEN i.indexname IS NULL
            THEN 'ERROR'
        ELSE 'OK'
    END,
    i.indexdef
FROM indices_esperados e
LEFT JOIN pg_indexes i
    ON i.schemaname = 'public'
   AND i.indexname = e.nombre;


-- =====================================================================
-- 19. ÍNDICES CRÍTICOS
-- =====================================================================

WITH indices_esperados(nombre) AS (
    VALUES
        ('idx_activos_categoria'),
        ('idx_activos_ubicacion'),

        ('idx_existencias_activo'),
        ('idx_existencias_ubicacion'),
        ('idx_existencias_estado'),

        ('idx_movimientos_activo'),
        ('idx_movimientos_fecha'),

        ('idx_contratos_cliente'),
        ('idx_contratos_estado'),

        ('idx_obras_estado'),

        ('idx_empleados_obras_obra'),
        ('idx_empleados_obras_empleado'),

        ('idx_transacciones_cuenta'),
        ('idx_transacciones_cuenta_destino'),
        ('idx_transacciones_fecha'),
        ('idx_transacciones_origen'),

        ('idx_gastos_obra_obra'),
        ('idx_gastos_obra_cuenta'),
        ('idx_gastos_obra_estado'),

        ('idx_pagos_empleados_empleado'),
        ('idx_pagos_empleados_estado'),

        ('idx_aportes_socios_socio'),
        ('idx_aportes_socios_estado'),

        ('idx_distribuciones_utilidades_periodo'),

        ('idx_asistencias_empleado_fecha'),
        ('idx_asistencias_obra_fecha'),

        ('idx_marcaciones_empleado_fecha_hora'),
        ('idx_marcaciones_obra_fecha_hora'),

        ('idx_registros_auditoria_usuario'),
        ('idx_registros_auditoria_fecha')
)

INSERT INTO validacion_constructsys
SELECT
    200,
    'INDICES',
    e.nombre,
    'EXISTE',
    CASE
        WHEN i.indexname IS NULL
            THEN 'NO EXISTE'
        ELSE 'EXISTE'
    END,
    CASE
        WHEN i.indexname IS NULL
            THEN 'ERROR'
        ELSE 'OK'
    END,
    NULL
FROM indices_esperados e
LEFT JOIN pg_indexes i
    ON i.schemaname = 'public'
   AND i.indexname = e.nombre;


-- =====================================================================
-- 20. FUNCIÓN DE fecha_actualizacion
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    210,
    'FUNCIONES',
    'actualizar_fecha_actualizacion()',
    'EXISTE',
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_proc p
            JOIN pg_namespace n
                ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND p.proname = 'actualizar_fecha_actualizacion'
        )
            THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_proc p
            JOIN pg_namespace n
                ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND p.proname = 'actualizar_fecha_actualizacion'
        )
            THEN 'OK'
        ELSE 'ERROR'
    END,
    NULL;


-- =====================================================================
-- 21. TRIGGERS
-- =====================================================================

WITH triggers_esperados(nombre) AS (
    VALUES
        ('trg_usuarios_fecha_actualizacion'),
        ('trg_activos_fecha_actualizacion'),
        ('trg_existencias_fecha_actualizacion'),
        ('trg_cuentas_fecha_actualizacion'),
        ('trg_empleados_fecha_actualizacion'),
        ('trg_gastos_obra_fecha_actualizacion'),
        ('trg_pagos_empleados_fecha_actualizacion'),
        ('trg_socios_fecha_actualizacion'),
        ('trg_aportes_socios_fecha_actualizacion'),
        ('trg_distribuciones_fecha_actualizacion'),
        ('trg_asistencias_fecha_actualizacion'),
        ('trg_marcaciones_fecha_actualizacion')
),
triggers_reales AS (
    SELECT DISTINCT trigger_name
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
)

INSERT INTO validacion_constructsys
SELECT
    220,
    'TRIGGERS',
    e.nombre,
    'EXISTE',
    CASE
        WHEN r.trigger_name IS NULL
            THEN 'NO EXISTE'
        ELSE 'EXISTE'
    END,
    CASE
        WHEN r.trigger_name IS NULL
            THEN 'ERROR'
        ELSE 'OK'
    END,
    NULL
FROM triggers_esperados e
LEFT JOIN triggers_reales r
    ON r.trigger_name = e.nombre;


-- =====================================================================
-- 22. ROLES DEL SEED
-- =====================================================================

WITH roles_esperados(nombre) AS (
    VALUES
        ('Administrador'),
        ('Operador'),
        ('Contador'),
        ('Supervisor'),
        ('Socio')
)

INSERT INTO validacion_constructsys
SELECT
    230,
    'SEED',
    'Rol ' || e.nombre,
    'ACTIVO',
    CASE
        WHEN r.id IS NULL
            THEN 'NO EXISTE'
        WHEN r.activo = TRUE
            THEN 'ACTIVO'
        ELSE 'INACTIVO'
    END,
    CASE
        WHEN r.id IS NOT NULL
         AND r.activo = TRUE
            THEN 'OK'
        ELSE 'ERROR'
    END,
    NULL
FROM roles_esperados e
LEFT JOIN roles r
    ON r.nombre = e.nombre;


-- =====================================================================
-- 23. EXACTAMENTE 5 ROLES BASE
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    240,
    'SEED',
    'Cantidad de roles base',
    '5',
    COUNT(*)::TEXT,
    CASE
        WHEN COUNT(*) = 5 THEN 'OK'
        ELSE 'ERROR'
    END,
    STRING_AGG(nombre, ', ' ORDER BY nombre)
FROM roles
WHERE nombre IN (
    'Administrador',
    'Operador',
    'Contador',
    'Supervisor',
    'Socio'
)
AND activo = TRUE;


-- =====================================================================
-- 24. NO DEBE EXISTIR EL ROL MAL ESCRITO
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    250,
    'LIMPIEZA',
    'Rol histórico "Secrecretario" ausente',
    '0',
    COUNT(*)::TEXT,
    CASE
        WHEN COUNT(*) = 0 THEN 'OK'
        ELSE 'ERROR'
    END,
    'El error tipográfico no debe llegar a la versión estable'
FROM roles
WHERE nombre = 'Secrecretario';


-- =====================================================================
-- 25. VALIDAR QUE SOCIOS NO GUARDE PORCENTAJE FIJO
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    260,
    'MODELO',
    'socios.porcentaje_participacion no almacenado',
    'NO EXISTE',
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'socios'
              AND column_name = 'porcentaje_participacion'
        )
            THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'socios'
              AND column_name = 'porcentaje_participacion'
        )
            THEN 'ERROR'
        ELSE 'OK'
    END,
    'La participación se calcula a partir del capital neto';


-- =====================================================================
-- 26. COLUMNAS LEGACY DE INVENTARIO
--
-- Por ahora SON obligatorias por compatibilidad con backend.
-- =====================================================================

WITH legacy(columna) AS (
    VALUES
        ('ubicacion_id'),
        ('estado'),
        ('cantidad_total')
)

INSERT INTO validacion_constructsys
SELECT
    270,
    'COMPATIBILIDAD',
    'activos.' || l.columna,
    'EXISTE TEMPORALMENTE',
    CASE
        WHEN c.column_name IS NULL
            THEN 'NO EXISTE'
        ELSE 'EXISTE'
    END,
    CASE
        WHEN c.column_name IS NULL
            THEN 'ERROR'
        ELSE 'OK'
    END,
    'Se retirará en una migración futura cuando el backend deje de depender de estas columnas'
FROM legacy l
LEFT JOIN information_schema.columns c
    ON c.table_schema = 'public'
   AND c.table_name = 'activos'
   AND c.column_name = l.columna;


-- =====================================================================
-- 27. VALIDAR BASE VACÍA PARA PRUEBAS
--
-- En esta fase aún no deberían existir datos operativos.
-- Los roles sí existen por seed.
-- =====================================================================

WITH conteos AS (

    SELECT
        'usuarios' AS tabla,
        COUNT(*) AS cantidad
    FROM usuarios

    UNION ALL

    SELECT
        'clientes',
        COUNT(*)
    FROM clientes

    UNION ALL

    SELECT
        'activos',
        COUNT(*)
    FROM activos

    UNION ALL

    SELECT
        'contratos_alquiler',
        COUNT(*)
    FROM contratos_alquiler

    UNION ALL

    SELECT
        'obras',
        COUNT(*)
    FROM obras

    UNION ALL

    SELECT
        'empleados',
        COUNT(*)
    FROM empleados

    UNION ALL

    SELECT
        'transacciones',
        COUNT(*)
    FROM transacciones

    UNION ALL

    SELECT
        'socios',
        COUNT(*)
    FROM socios

    UNION ALL

    SELECT
        'asistencias_empleados',
        COUNT(*)
    FROM asistencias_empleados
)

INSERT INTO validacion_constructsys
SELECT
    280,
    'BASE LIMPIA',
    'Registros operativos en ' || tabla,
    '0',
    cantidad::TEXT,
    CASE
        WHEN cantidad = 0 THEN 'OK'
        ELSE 'ADVERTENCIA'
    END,
    'En constructsys_test_v100 se espera una instalación inicialmente limpia'
FROM conteos;


-- =====================================================================
-- 28. RESUMEN GLOBAL
-- =====================================================================

INSERT INTO validacion_constructsys
SELECT
    900,
    'RESUMEN',
    'Pruebas con ERROR',
    '0',
    COUNT(*) FILTER (
        WHERE estado = 'ERROR'
    )::TEXT,
    CASE
        WHEN COUNT(*) FILTER (
            WHERE estado = 'ERROR'
        ) = 0
            THEN 'OK'
        ELSE 'ERROR'
    END,
    NULL
FROM validacion_constructsys;


INSERT INTO validacion_constructsys
SELECT
    910,
    'RESUMEN',
    'Pruebas con ADVERTENCIA',
    '0 ideal',
    COUNT(*) FILTER (
        WHERE estado = 'ADVERTENCIA'
    )::TEXT,
    CASE
        WHEN COUNT(*) FILTER (
            WHERE estado = 'ADVERTENCIA'
        ) = 0
            THEN 'OK'
        ELSE 'ADVERTENCIA'
    END,
    NULL
FROM validacion_constructsys
WHERE grupo <> 'RESUMEN';


-- =====================================================================
-- 29. MOSTRAR RESULTADO COMPLETO
-- =====================================================================

SELECT
    grupo,
    prueba,
    esperado,
    obtenido,
    estado,
    detalle
FROM validacion_constructsys
ORDER BY
    orden,
    grupo,
    prueba;


-- =====================================================================
-- 30. RESUMEN SIMPLE
-- =====================================================================

SELECT
    COUNT(*) FILTER (
        WHERE estado = 'OK'
    ) AS correctas,

    COUNT(*) FILTER (
        WHERE estado = 'ADVERTENCIA'
    ) AS advertencias,

    COUNT(*) FILTER (
        WHERE estado = 'ERROR'
    ) AS errores

FROM validacion_constructsys
WHERE grupo <> 'RESUMEN';


-- =====================================================================
-- 31. CERTIFICACIÓN AUTOMÁTICA
--
-- Si existe algún ERROR, detiene el script.
-- Si todo está bien, muestra mensaje de éxito.
-- =====================================================================

DO $$
DECLARE

    cantidad_errores INTEGER;

    cantidad_advertencias INTEGER;

BEGIN

    SELECT
        COUNT(*)
    INTO cantidad_errores
    FROM validacion_constructsys
    WHERE estado = 'ERROR'
      AND grupo <> 'RESUMEN';


    SELECT
        COUNT(*)
    INTO cantidad_advertencias
    FROM validacion_constructsys
    WHERE estado = 'ADVERTENCIA'
      AND grupo <> 'RESUMEN';


    IF cantidad_errores > 0 THEN

        RAISE EXCEPTION
            'CONSTRUCTSYS v1.0.0 NO SUPERÓ LA VALIDACIÓN. Errores encontrados: %. Revise las filas con estado ERROR.',
            cantidad_errores;

    END IF;


    IF cantidad_advertencias > 0 THEN

        RAISE NOTICE
            'CONSTRUCTSYS v1.0.0 superó las validaciones estructurales con % advertencia(s).',
            cantidad_advertencias;

    ELSE

        RAISE NOTICE
            'CONSTRUCTSYS DATABASE v1.0.0 VALIDADA CORRECTAMENTE. 0 errores, 0 advertencias.';

    END IF;

END;
$$;


COMMIT;


-- =====================================================================
-- FIN
-- ConstructSys Database Validation
-- v1.0.0
-- =====================================================================