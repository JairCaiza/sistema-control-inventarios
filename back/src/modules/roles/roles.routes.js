const express = require("express");
const router = express.Router();

const rolesController = require("./roles.controller");
const protect = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

/* =========================
   MIDDLEWARES
========================= */
router.use(protect);
router.use(authorizeRoles("Administrador"));

/* =========================
   RUTAS
========================= */
router.post("/", rolesController.createRole);
router.get("/", rolesController.getRoles);
router.put("/:id", rolesController.updateRole);

/* 🔥 NUEVO: activar/desactivar */
router.put("/:id/status", rolesController.toggleRoleStatus);

/* 🔥 NUEVO: eliminar con validación */
router.delete("/:id", rolesController.deleteRole);

module.exports = router;