const express =
   require("express");

const router =
   express.Router();

const empleadosController =
   require("./empleados.controller");

const protect =
   require(
      "../../../middlewares/auth.middleware"
   );

const authorizeRoles =
   require(
      "../../../middlewares/role.middleware"
   );

/* =====================================================
   AUTENTICACIÓN
===================================================== */

router.use(
   protect
);

/*
 * Conservamos el mismo permiso que ya tenías
 * para no alterar la seguridad actual del módulo.
 */
router.use(
   authorizeRoles(
      "Administrador"
   )
);

/* =====================================================
   CREAR EMPLEADO
===================================================== */

router.post(
   "/",
   empleadosController.createEmpleado
);

/* =====================================================
   LISTAR EMPLEADOS
===================================================== */

router.get(
   "/",
   empleadosController.getEmpleados
);

/* =====================================================
   CONSULTAS DEL DETALLE DEL EMPLEADO
===================================================== */

/*
 * Estas rutas alimentarán las pestañas:
 *
 * Información
 * Obras
 * Pagos
 * Actividad
 */

router.get(
   "/:id/resumen",
   empleadosController.getEmpleadoResumen
);

router.get(
   "/:id/obras",
   empleadosController.getEmpleadoObras
);

router.get(
   "/:id/pagos",
   empleadosController.getEmpleadoPagos
);

router.get(
   "/:id/actividad",
   empleadosController.getEmpleadoActividad
);

/* =====================================================
   OBTENER EMPLEADO
===================================================== */

router.get(
   "/:id",
   empleadosController.getEmpleadoById
);

/* =====================================================
   ACTUALIZAR EMPLEADO
===================================================== */

router.put(
   "/:id",
   empleadosController.updateEmpleado
);

/* =====================================================
   ACTIVAR / DESACTIVAR
===================================================== */

router.put(
   "/:id/status",
   empleadosController.toggleEmpleadoStatus
);

/* =====================================================
   ELIMINAR EMPLEADO
===================================================== */

router.delete(
   "/:id",
   empleadosController.deleteEmpleado
);

module.exports =
   router;