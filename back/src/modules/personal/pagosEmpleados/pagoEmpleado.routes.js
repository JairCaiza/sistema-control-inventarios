const express = require("express");

const router = express.Router();

/* =====================================================
   MIDDLEWARES
===================================================== */

const protect = require(
    "../../../middlewares/auth.middleware"
);

const authorizeRoles = require(
    "../../../middlewares/role.middleware"
);

/* =====================================================
   CONTROLLER
===================================================== */

const {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    confirmar,
    anular,
    reportePorEmpleado,
    reportePorObra,
    reportePersonal,
    resumen,
    obtenerAsignaciones
} = require(
    "./pagoEmpleado.controller"
);

/* =====================================================
   SEGURIDAD GLOBAL DEL MÓDULO
===================================================== */

/*
 * Todo el módulo requiere autenticación.
 */
router.use(protect);

/* =====================================================
   RESUMEN GENERAL DE PAGOS
===================================================== */

/*
 * GET /api/pagos-empleados/resumen
 *
 * Devuelve:
 *
 * - total pagado
 * - total pendiente
 * - pagos confirmados
 * - pagos pendientes
 * - pagos anulados
 * - empleados con pagos
 * - pagos vinculados a obra
 *
 * IMPORTANTE:
 * Esta ruta debe ir antes de /:id.
 */
router.get(
    "/resumen",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    resumen
);

/* =====================================================
   REPORTE GENERAL DE PERSONAL
===================================================== */

/*
 * GET
 * /api/pagos-empleados/reportes/personal
 *
 * Devuelve un consolidado general de personal:
 *
 * - datos del empleado
 * - estado
 * - tipo de pago
 * - salario base
 * - obra actual
 * - total de asignaciones
 * - obras activas
 * - total pagado
 * - total pendiente
 * - cantidad de pagos realizados
 * - cantidad de pagos pendientes
 * - pagos anulados
 *
 * Este endpoint será utilizado por:
 *
 * ReportePersonalPage.tsx
 *
 * IMPORTANTE:
 * Debe estar antes de rutas dinámicas como:
 *
 * /:id
 * /reportes/empleado/:empleado_id
 * /reportes/obra/:obra_id
 */
router.get(
    "/reportes/personal",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    reportePersonal
);

/* =====================================================
   REPORTE POR EMPLEADO
===================================================== */

/*
 * GET
 * /api/pagos-empleados/reportes/empleado/:empleado_id
 *
 * Query opcional:
 *
 * ?fecha_desde=2026-09-01
 * &fecha_hasta=2026-09-30
 * &estado=pagado
 */
router.get(
    "/reportes/empleado/:empleado_id",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    reportePorEmpleado
);

/* =====================================================
   REPORTE POR OBRA
===================================================== */

/*
 * GET
 * /api/pagos-empleados/reportes/obra/:obra_id
 *
 * Query opcional:
 *
 * ?fecha_desde=2026-09-01
 * &fecha_hasta=2026-09-30
 * &estado=pagado
 */
router.get(
    "/reportes/obra/:obra_id",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    reportePorObra
);

/* =====================================================
   ASIGNACIONES ACTIVAS PARA REGISTRAR PAGO
===================================================== */

/*
 * GET
 * /api/pagos-empleados/asignaciones
 *
 * Query:
 *
 * ?empleado_id=UUID
 * &obra_id=UUID
 *
 * Retorna únicamente las asignaciones activas
 * del empleado en la obra seleccionada.
 *
 * IMPORTANTE:
 * También debe ir antes de /:id.
 */
router.get(
    "/asignaciones",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    obtenerAsignaciones
);

/* =====================================================
   CREAR PAGO
===================================================== */

/*
 * POST /api/pagos-empleados
 *
 * Crea un pago en estado:
 *
 * pendiente
 *
 * NO mueve dinero.
 */
router.post(
    "/",
    authorizeRoles(
        "Administrador"
    ),
    crear
);

/* =====================================================
   LISTAR PAGOS
===================================================== */

/*
 * GET /api/pagos-empleados
 *
 * Filtros disponibles:
 *
 * empleado_id
 * obra_id
 * cuenta_id
 * estado
 * tipo_pago
 * fecha_desde
 * fecha_hasta
 * buscar
 * page
 * limit
 */
router.get(
    "/",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    listar
);

/* =====================================================
   CONFIRMAR PAGO
===================================================== */

/*
 * PATCH
 * /api/pagos-empleados/:id/confirmar
 *
 * Flujo:
 *
 * pendiente
 *      ↓
 * validar empleado
 *      ↓
 * validar obra/asignación
 *      ↓
 * validar cuenta
 *      ↓
 * validar saldo
 *      ↓
 * crear transacción egreso
 *      ↓
 * descontar saldo
 *      ↓
 * guardar transaccion_id
 *      ↓
 * pagado
 */
router.patch(
    "/:id/confirmar",
    authorizeRoles(
        "Administrador"
    ),
    confirmar
);

/* =====================================================
   ANULAR PAGO
===================================================== */

/*
 * PATCH
 * /api/pagos-empleados/:id/anular
 *
 * Si está pendiente:
 *
 *   → se marca como anulado
 *   → no afecta ninguna cuenta
 *
 * Si está pagado:
 *
 *   → valida la transacción original
 *   → crea una reversión financiera
 *   → devuelve el dinero a la cuenta
 *   → conserva el historial
 *   → marca el pago como anulado
 */
router.patch(
    "/:id/anular",
    authorizeRoles(
        "Administrador"
    ),
    anular
);

/* =====================================================
   OBTENER PAGO POR ID
===================================================== */

/*
 * GET /api/pagos-empleados/:id
 *
 * IMPORTANTE:
 *
 * Esta ruta debe permanecer después de:
 *
 * /resumen
 * /reportes/personal
 * /reportes/empleado/...
 * /reportes/obra/...
 * /asignaciones
 * /:id/confirmar
 * /:id/anular
 *
 * para evitar que Express interprete palabras como
 * "resumen", "reportes" o "asignaciones" como un ID.
 */
router.get(
    "/:id",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    obtenerPorId
);

/* =====================================================
   ACTUALIZAR PAGO
===================================================== */

/*
 * PUT /api/pagos-empleados/:id
 *
 * Solo puede modificar pagos:
 *
 * estado = pendiente
 */
router.put(
    "/:id",
    authorizeRoles(
        "Administrador"
    ),
    actualizar
);

/* =====================================================
   EXPORT
===================================================== */

module.exports = router;