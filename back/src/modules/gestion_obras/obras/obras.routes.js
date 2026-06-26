const express = require("express");

const router = express.Router();

const obrasController = require("./obras.controller");

const protect = require("../../../middlewares/auth.middleware");

const authorizeRoles = require("../../../middlewares/role.middleware");

/* =========================
   MIDDLEWARES
========================= */
router.use(protect);

router.use(authorizeRoles("Administrador"));

/* =========================
   RUTAS
========================= */

// crear obra
router.post("/", obrasController.createObra);

// listar obras
router.get("/", obrasController.getObras);
// obtener una obra
router.get("/:id", obrasController.getObraById);
// actualizar obra
router.put("/:id", obrasController.updateObra);

// eliminar obra
router.delete("/:id", obrasController.deleteObra);


/* =========================
   ASIGNAR EMPLEADO
========================= */
router.post(
   "/asignar-empleado",
   obrasController.asignarEmpleadoObra
);

/* =========================
   EMPLEADOS DE UNA OBRA
========================= */
router.get(
   "/ver_empleados/:obraId",
   obrasController.getEmpleadosObra
);

/* =========================
   DESASIGNAR EMPLEADO
========================= */
router.patch(
   "/:id/desasignar",
   obrasController.desasignarEmpleadoObra
);

/* =========================
   rutas para registrar actividades diarias de la obra
========================= */

router.post(
   "/controles-diarios",
   obrasController.registrarActividadObra
);
router.get(
   "/controles-diarios/:obra_id",
   obrasController.listarControlesPorObra
);

module.exports = router;