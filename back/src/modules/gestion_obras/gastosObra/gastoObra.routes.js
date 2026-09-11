const express = require("express");

const router = express.Router();

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
    reportePorObra,
    resumen
} = require("./gastoObra.controller");

/* =====================================================
   MIDDLEWARES
===================================================== */

/*
 * auth.middleware.js exporta directamente
 * la función protect:
 *
 * module.exports = protect;
 */
const protect =
    require("../../../middlewares/auth.middleware");

/*
 * role.middleware.js exporta directamente
 * authorizeRoles:
 *
 * module.exports = authorizeRoles;
 */
const authorizeRoles =
    require("../../../middlewares/role.middleware");


/* =====================================================
   PROTEGER TODAS LAS RUTAS
===================================================== */

router.use(protect);


/* =====================================================
   RESUMEN GENERAL DE GASTOS

   GET
   /api/gastos-obra/resumen

   IMPORTANTE:
   Debe ir antes de /:id
===================================================== */

router.get(
    "/resumen",

    authorizeRoles(
        "Administrador",
        "Contador"
    ),

    resumen
);


/* =====================================================
   REPORTE DE GASTOS POR OBRA

   GET
   /api/gastos-obra/reportes/obra/:obra_id

   Ejemplo:
   /api/gastos-obra/reportes/obra/UUID
===================================================== */

router.get(
    "/reportes/obra/:obra_id",

    authorizeRoles(
        "Administrador",
        "Contador"
    ),

    reportePorObra
);


/* =====================================================
   CREAR GASTO

   POST
   /api/gastos-obra

   El gasto se crea:
   estado = pendiente

   NO genera movimiento financiero todavía.
===================================================== */

router.post(
    "/",

    authorizeRoles(
        "Administrador"
    ),

    crear
);


/* =====================================================
   LISTAR GASTOS

   GET
   /api/gastos-obra

   Soporta filtros:
   obra_id
   control_diario_id
   cuenta_id
   estado
   tipo
   fecha_desde
   fecha_hasta
   buscar
   page
   limit
===================================================== */

router.get(
    "/",

    authorizeRoles(
        "Administrador",
        "Contador"
    ),

    listar
);


/* =====================================================
   CONFIRMAR GASTO

   PATCH
   /api/gastos-obra/:id/confirmar

   Al confirmar:
   - valida cuenta
   - valida saldo
   - crea transacción egreso
   - descuenta saldo
   - gasto pasa a pagado
===================================================== */

router.patch(
    "/:id/confirmar",

    authorizeRoles(
        "Administrador"
    ),

    confirmar
);


/* =====================================================
   ANULAR GASTO

   PATCH
   /api/gastos-obra/:id/anular

   Si está pendiente:
   - simplemente se anula

   Si está pagado:
   - genera ingreso de reversión
   - devuelve dinero a la cuenta
   - conserva transacción original
===================================================== */

router.patch(
    "/:id/anular",

    authorizeRoles(
        "Administrador"
    ),

    anular
);


/* =====================================================
   OBTENER GASTO POR ID

   GET
   /api/gastos-obra/:id

   IMPORTANTE:
   Esta ruta debe ir DESPUÉS de:
   /resumen
   /reportes/obra/:obra_id
===================================================== */

router.get(
    "/:id",

    authorizeRoles(
        "Administrador",
        "Contador"
    ),

    obtenerPorId
);


/* =====================================================
   ACTUALIZAR GASTO

   PUT
   /api/gastos-obra/:id

   Solo se podrá editar si está pendiente.
===================================================== */

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