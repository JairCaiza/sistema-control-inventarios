const express = require("express");

const router = express.Router();

const protect =
    require("../../middlewares/auth.middleware");

const authorizeRoles =
    require("../../middlewares/role.middleware");

const {
    crear,
    listar,
    usuariosDisponibles,
    obtenerPorId,
    miPerfil,
    miResumen,
    resumenCapital,
    vincularUsuario,
    desvincularUsuario,
    actualizar,
    cambiarEstado,
    eliminar
} = require("./socio.controller");


/* =====================================================
   PORTAL DEL SOCIO
===================================================== */

/**
 * Obtener información personal del socio autenticado.
 *
 * GET /api/socios/mi-perfil
 */
router.get(
    "/mi-perfil",
    protect,
    authorizeRoles("Socio"),
    miPerfil
);


/**
 * Obtener resumen financiero del socio autenticado.
 *
 * GET /api/socios/mi-resumen
 */
router.get(
    "/mi-resumen",
    protect,
    authorizeRoles("Socio"),
    miResumen
);


/* =====================================================
   RESUMEN ADMINISTRATIVO
===================================================== */

/**
 * Resumen global del capital social.
 *
 * GET /api/socios/resumen-capital
 */
router.get(
    "/resumen-capital",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    resumenCapital
);


/* =====================================================
   USUARIOS DISPONIBLES PARA REGISTRAR SOCIO
===================================================== */

/**
 * Lista usuarios activos con rol Socio
 * que todavía no están vinculados
 * a un registro de socios.
 *
 * GET /api/socios/usuarios-disponibles
 */
router.get(
    "/usuarios-disponibles",
    protect,
    authorizeRoles(
        "Administrador"
    ),
    usuariosDisponibles
);


/* =====================================================
   ADMINISTRACIÓN DE SOCIOS
===================================================== */

/**
 * Registrar socio.
 *
 * POST /api/socios
 */
router.post(
    "/",
    protect,
    authorizeRoles(
        "Administrador"
    ),
    crear
);


/**
 * Listar socios.
 *
 * GET /api/socios
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


/* =====================================================
   VINCULAR / DESVINCULAR USUARIO
===================================================== */

/**
 * Vincular una cuenta de usuario
 * con un socio existente.
 *
 * PATCH /api/socios/:id/usuario
 *
 * Body:
 *
 * {
 *     "usuario_id": "UUID"
 * }
 */
router.patch(
    "/:id/usuario",
    protect,
    authorizeRoles(
        "Administrador"
    ),
    vincularUsuario
);


/**
 * Desvincular la cuenta de usuario
 * del socio.
 *
 * DELETE /api/socios/:id/usuario
 */
router.delete(
    "/:id/usuario",
    protect,
    authorizeRoles(
        "Administrador"
    ),
    desvincularUsuario
);


/* =====================================================
   CAMBIAR ESTADO
===================================================== */

/**
 * Activar / desactivar socio.
 *
 * PATCH /api/socios/:id/estado
 */
router.patch(
    "/:id/estado",
    protect,
    authorizeRoles(
        "Administrador"
    ),
    cambiarEstado
);


/* =====================================================
   SOCIO POR ID
===================================================== */

/**
 * Obtener socio por ID.
 *
 * GET /api/socios/:id
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
 * Actualizar socio.
 *
 * PUT /api/socios/:id
 */
router.put(
    "/:id",
    protect,
    authorizeRoles(
        "Administrador"
    ),
    actualizar
);


/**
 * Eliminar socio.
 *
 * DELETE /api/socios/:id
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