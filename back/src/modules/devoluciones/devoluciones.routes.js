const express = require("express");

const router = express.Router();

/* =====================================================
   MIDDLEWARES
===================================================== */

const protect = require(
    "../../middlewares/auth.middleware"
);

const authorizeRoles = require(
    "../../middlewares/role.middleware"
);

/* =====================================================
   CONTROLLER
===================================================== */

const {
    registrar,
    listar,
    obtenerPorId,
    resumen
} = require(
    "./devoluciones.controller"
);

/* =====================================================
   SEGURIDAD GLOBAL DEL MÓDULO
===================================================== */

/*
 * Todas las rutas de devoluciones
 * requieren autenticación.
 */
router.use(protect);

/* =====================================================
   RESUMEN GENERAL
===================================================== */

/*
 * GET /api/devoluciones/resumen
 *
 * Devuelve:
 *
 * - total de devoluciones
 * - devoluciones sin retraso
 * - devoluciones con retraso
 * - penalidades generadas
 * - penalidades cobradas
 * - penalidades pendientes
 * - total generado
 *
 * IMPORTANTE:
 * Debe ir antes de /:id.
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
   REGISTRAR DEVOLUCIÓN
===================================================== */

/*
 * POST /api/devoluciones
 *
 * Registra una devolución completa.
 *
 * Flujo:
 *
 * validar contrato
 *      ↓
 * validar devolución previa
 *      ↓
 * calcular retraso
 *      ↓
 * calcular penalidad
 *      ↓
 * registrar devolución
 *      ↓
 * finalizar contrato
 *      ↓
 * devolver stock
 *      ↓
 * generar movimientos de entrada
 */
router.post(
    "/",
    authorizeRoles(
        "Administrador"
    ),
    registrar
);

/* =====================================================
   LISTAR DEVOLUCIONES
===================================================== */

/*
 * GET /api/devoluciones
 *
 * Devuelve el historial completo
 * de devoluciones con información de:
 *
 * - contrato
 * - cliente
 * - fecha devolución
 * - días de retraso
 * - valor del contrato
 * - penalidad
 * - total generado
 * - total cobrado
 * - penalidad pagada
 * - penalidad pendiente
 * - estado de penalidad
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
   OBTENER DEVOLUCIÓN POR ID
===================================================== */

/*
 * GET /api/devoluciones/:id
 *
 * Devuelve el detalle financiero
 * y operativo de una devolución.
 *
 * IMPORTANTE:
 * Esta ruta debe permanecer después
 * de /resumen.
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
   EXPORT
===================================================== */

module.exports = router;