-- =====================================================================
-- CONSTRUCTSYS
-- 02_seed_base_v1.0.0.sql
--
-- Datos base requeridos
-- Versión: 1.0.0
--
-- Ejecutar DESPUÉS de:
-- 01_init_schema_v1.0.0.sql
-- =====================================================================

BEGIN;


-- =====================================================================
-- 01. ROLES DEL SISTEMA
-- =====================================================================

INSERT INTO roles (
    nombre,
    descripcion,
    activo
)
VALUES
(
    'Administrador',
    'Acceso completo a todos los módulos y configuraciones del sistema',
    TRUE
),
(
    'Operador',
    'Acceso a operaciones de inventario, alquileres, clientes y procesos operativos',
    TRUE
),
(
    'Contador',
    'Acceso a módulos financieros, cuentas, ingresos, egresos, pagos y reportes financieros',
    TRUE
),
(
    'Supervisor',
    'Acceso a supervisión de obras, personal, controles diarios y reportes operativos',
    TRUE
),
(
    'Socio',
    'Acceso al portal personal de socios, aportes y distribución de utilidades',
    TRUE
)
ON CONFLICT (nombre)
DO UPDATE
SET
    descripcion = EXCLUDED.descripcion,
    activo = TRUE;


-- =====================================================================
-- 02. VERIFICAR ROLES INSERTADOS
-- =====================================================================

DO $$
DECLARE
    cantidad_roles INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO cantidad_roles
    FROM roles
    WHERE nombre IN (
        'Administrador',
        'Operador',
        'Contador',
        'Supervisor',
        'Socio'
    )
    AND activo = TRUE;

    IF cantidad_roles <> 5 THEN

        RAISE EXCEPTION
            'Error en seed ConstructSys: se esperaban 5 roles activos y existen %',
            cantidad_roles;

    END IF;

END;
$$;


COMMIT;


-- =====================================================================
-- RESULTADO ESPERADO
-- =====================================================================

SELECT
    nombre,
    descripcion,
    activo
FROM roles
ORDER BY
    CASE nombre
        WHEN 'Administrador' THEN 1
        WHEN 'Operador' THEN 2
        WHEN 'Contador' THEN 3
        WHEN 'Supervisor' THEN 4
        WHEN 'Socio' THEN 5
        ELSE 99
    END,
    nombre;


-- =====================================================================
-- FIN
-- ConstructSys Seed
-- v1.0.0
-- =====================================================================