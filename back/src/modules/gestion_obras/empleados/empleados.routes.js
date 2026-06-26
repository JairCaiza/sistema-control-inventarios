const express = require("express");
const router = express.Router();

const empleadosController = require("./empleados.controller");

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

/* CREAR EMPLEADO */
router.post("/", empleadosController.createEmpleado);

/* LISTAR EMPLEADOS */
router.get("/", empleadosController.getEmpleados);

/* OBTENER EMPLEADO POR ID */
router.get("/:id", empleadosController.getEmpleadoById);

/* ACTUALIZAR EMPLEADO */
router.put("/:id", empleadosController.updateEmpleado);

/* ACTIVAR / DESACTIVAR */
router.put("/:id/status", empleadosController.toggleEmpleadoStatus);

/* ELIMINAR EMPLEADO */
router.delete("/:id", empleadosController.deleteEmpleado);

module.exports = router;