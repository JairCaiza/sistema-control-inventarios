const express =
   require("express");

const router =
   express.Router();

const obrasController =
   require("./obras.controller");

const protect =
   require("../../../middlewares/auth.middleware");

const authorizeRoles =
   require("../../../middlewares/role.middleware");

/* =====================================================
   PROTEGER TODAS LAS RUTAS
===================================================== */

router.use(
   protect
);

/* =====================================================
   PERMISOS DEL MÓDULO
===================================================== */

router.use(
   authorizeRoles(
      "Administrador"
   )
);

/* =====================================================
   ASIGNAR EMPLEADO
   IMPORTANTE:
   RUTAS ESPECÍFICAS ANTES DE /:id
===================================================== */

router.post(
   "/asignar-empleado",
   obrasController
      .asignarEmpleadoObra
);

/* =====================================================
   EMPLEADOS DE UNA OBRA
===================================================== */

router.get(
   "/ver_empleados/:obraId",
   obrasController
      .getEmpleadosObra
);

/* =====================================================
   CONTROLES DIARIOS
===================================================== */

/*
 * Registrar un nuevo control diario.
 *
 * POST
 * /api/obras/controles-diarios
 */
router.post(
   "/controles-diarios",
   obrasController
      .registrarActividadObra
);

/*
 * Listar TODOS los controles diarios
 * de TODAS las obras.
 *
 * Esta ruta será utilizada por:
 * Gestión Obras -> Control Diario
 *
 * GET
 * /api/obras/controles-diarios
 */
router.get(
   "/controles-diarios",
   obrasController
      .listarTodosControles
);

/*
 * Listar controles diarios
 * de UNA obra específica.
 *
 * Esta ruta será utilizada por:
 * Gestión Obras -> Obras -> Ver obra
 *
 * GET
 * /api/obras/controles-diarios/:obra_id
 */
router.get(
   "/controles-diarios/:obra_id",
   obrasController
      .listarControlesPorObra
);

/* =====================================================
   DESASIGNAR EMPLEADO
===================================================== */

router.patch(
   "/:id/desasignar",
   obrasController
      .desasignarEmpleadoObra
);

/* =====================================================
   CRUD OBRAS
===================================================== */

/* =====================================================
   CREAR OBRA
===================================================== */

router.post(
   "/",
   obrasController
      .createObra
);

/* =====================================================
   LISTAR OBRAS
===================================================== */

router.get(
   "/",
   obrasController
      .getObras
);

/* =====================================================
   OBTENER OBRA POR ID
===================================================== */

router.get(
   "/:id",
   obrasController
      .getObraById
);

/* =====================================================
   ACTUALIZAR OBRA
===================================================== */

router.put(
   "/:id",
   obrasController
      .updateObra
);

/* =====================================================
   ELIMINAR OBRA
===================================================== */

router.delete(
   "/:id",
   obrasController
      .deleteObra
);

/* =====================================================
   EXPORT
===================================================== */

module.exports =
   router;