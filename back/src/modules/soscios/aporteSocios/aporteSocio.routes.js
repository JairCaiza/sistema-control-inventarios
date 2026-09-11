const express = require("express");

const router = express.Router();

const protect =
    require("../../../middlewares/auth.middleware");

const authorizeRoles =
    require("../../../middlewares/role.middleware");

const {
    crear,
    listar,
    misAportes,
    obtenerPorId,
    actualizar,
    cambiarEstado,
    eliminar,
    obtenerResumen
} = require("./aporteSocio.controller");

/* =====================================================
   RUTAS PERSONALES DEL SOCIO
===================================================== */

/**
 * Obtener únicamente los aportes y retiros
 * del socio autenticado.
 *
 * GET /api/aportes-socios/mis-aportes
 *
 * No recibe socio_id.
 * El backend obtiene el socio mediante req.user.id.
 *
 * IMPORTANTE:
 * Esta ruta debe estar antes de "/:id",
 * para evitar que Express interprete
 * "mis-aportes" como un UUID.
 */
router.get(
    "/mis-aportes",
    protect,
    authorizeRoles("Socio"),
    misAportes
);

/* =====================================================
   RUTAS ADMINISTRATIVAS DE APORTES DE SOCIOS
===================================================== */

/**
 * Obtener resumen de aportes, retiros y capital neto.
 *
 * GET /api/aportes-socios/resumen
 *
 * Filtros opcionales:
 * ?socio_id=
 * ?fecha_desde=
 * ?fecha_hasta=
 *
 * Administrador y Contador pueden consultar
 * información financiera global.
 */
router.get(
    "/resumen",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    obtenerResumen
);

/**
 * Registrar un nuevo aporte o retiro.
 *
 * POST /api/aportes-socios
 */
router.post(
    "/",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    crear
);

/**
 * Listar aportes y retiros.
 *
 * GET /api/aportes-socios
 *
 * Filtros opcionales:
 * ?buscar=
 * ?socio_id=
 * ?cuenta_id=
 * ?tipo=
 * ?estado=
 * ?fecha_desde=
 * ?fecha_hasta=
 */
router.get(
    "/",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    listar
);

/**
 * Obtener un aporte o retiro por ID.
 *
 * GET /api/aportes-socios/:id
 */
router.get(
    "/:id",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    obtenerPorId
);

/**
 * Actualizar un aporte o retiro pendiente.
 *
 * PUT /api/aportes-socios/:id
 */
router.put(
    "/:id",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    actualizar
);

/**
 * Confirmar o anular un aporte o retiro.
 *
 * PATCH /api/aportes-socios/:id/estado
 *
 * Body:
 *
 * {
 *   "estado": "confirmado"
 * }
 *
 * o:
 *
 * {
 *   "estado": "anulado"
 * }
 */
router.patch(
    "/:id/estado",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    cambiarEstado
);

/**
 * Eliminar un aporte o retiro pendiente.
 *
 * DELETE /api/aportes-socios/:id
 *
 * Los movimientos confirmados no deben eliminarse;
 * deben cambiarse al estado "anulado".
 */
router.delete(
    "/:id",
    protect,
    authorizeRoles(
        "Administrador"
    ),
    eliminar
);

module.exports = router;