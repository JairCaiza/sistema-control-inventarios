const express =
    require("express");

const router =
    express.Router();

const protect =
    require("../../../middlewares/auth.middleware");

const authorizeRoles =
    require("../../../middlewares/role.middleware");

const {
    resumenGeneral,
    reportePorObra,
    gastosPorObra,
    personalPorObra,
    controlesPorObra,
    finanzasPorObra,
    evolucionCostos,
    presupuestoPorObra
} = require("./reporteObra.controller");

/* =====================================================
   PROTEGER TODAS LAS RUTAS
===================================================== */

router.use(
    protect
);

/* =====================================================
   RESUMEN GENERAL
===================================================== */

/**
 * GET /api/reportes-obras/resumen
 *
 * Query opcional:
 * - estado
 * - fecha_desde
 * - fecha_hasta
 * - buscar
 * - page
 * - limit
 */
router.get(
    "/resumen",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    resumenGeneral
);

/* =====================================================
   REPORTE COMPLETO DE UNA OBRA
===================================================== */

/**
 * GET /api/reportes-obras/obra/:obra_id
 *
 * Query opcional:
 * - fecha_desde
 * - fecha_hasta
 * - incluir_gastos
 * - incluir_personal
 * - incluir_controles
 * - incluir_finanzas
 */
router.get(
    "/obra/:obra_id",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    reportePorObra
);

/* =====================================================
   GASTOS DE UNA OBRA
===================================================== */

/**
 * GET /api/reportes-obras/obra/:obra_id/gastos
 *
 * Query opcional:
 * - estado
 * - tipo
 * - fecha_desde
 * - fecha_hasta
 * - buscar
 * - page
 * - limit
 */
router.get(
    "/obra/:obra_id/gastos",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    gastosPorObra
);

/* =====================================================
   PERSONAL DE UNA OBRA
===================================================== */

/**
 * GET /api/reportes-obras/obra/:obra_id/personal
 *
 * Query opcional:
 * - activo
 * - fecha_desde
 * - fecha_hasta
 * - buscar
 * - page
 * - limit
 */
router.get(
    "/obra/:obra_id/personal",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    personalPorObra
);

/* =====================================================
   CONTROLES DIARIOS
===================================================== */

/**
 * GET /api/reportes-obras/obra/:obra_id/controles
 *
 * Query opcional:
 * - fecha_desde
 * - fecha_hasta
 * - buscar
 * - page
 * - limit
 */
router.get(
    "/obra/:obra_id/controles",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    controlesPorObra
);

/* =====================================================
   FINANZAS DE UNA OBRA
===================================================== */

/**
 * GET /api/reportes-obras/obra/:obra_id/finanzas
 *
 * Query opcional:
 * - tipo
 * - origen_modulo
 * - fecha_desde
 * - fecha_hasta
 * - buscar
 * - page
 * - limit
 */
router.get(
    "/obra/:obra_id/finanzas",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    finanzasPorObra
);

/* =====================================================
   EVOLUCIÓN DE COSTOS
===================================================== */

/**
 * GET /api/reportes-obras/obra/:obra_id/evolucion-costos
 *
 * Query opcional:
 * - fecha_desde
 * - fecha_hasta
 * - agrupar_por = dia | semana | mes
 */
router.get(
    "/obra/:obra_id/evolucion-costos",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    evolucionCostos
);

/* =====================================================
   PRESUPUESTO VS EJECUTADO
===================================================== */

/**
 * GET /api/reportes-obras/obra/:obra_id/presupuesto
 *
 * Query opcional:
 * - fecha_desde
 * - fecha_hasta
 * - incluir_pendientes
 */
router.get(
    "/obra/:obra_id/presupuesto",
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    presupuestoPorObra
);

/* =====================================================
   EXPORT
===================================================== */

module.exports =
    router;