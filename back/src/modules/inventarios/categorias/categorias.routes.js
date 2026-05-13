const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");
const authorizeRoles = require("../../../middlewares/role.middleware");

const {
    crearCategorias,
    obtenerCategorias,
    actualizar,
    eliminar,
    toggleCategoriaStatusController, // 🔥 NUEVO
} = require("./categorias.controller");

/* =========================
   RUTAS
========================= */

// ✅ Crear
router.post(
    "/",
    protect,
    authorizeRoles("Administrador"),
    crearCategorias
);

// ✅ Listar
router.get(
    "/",
    protect,
    obtenerCategorias
);

// ✅ Actualizar
router.put(
    "/:id",
    protect,
    authorizeRoles("Administrador"),
    actualizar
);

// 🔥 Activar / Desactivar (IMPORTANTE)
router.put(
    "/:id/status",
    protect,
    authorizeRoles("Administrador"),
    toggleCategoriaStatusController
);

// ✅ Eliminar (soft delete validado)
router.delete(
    "/:id",
    protect,
    authorizeRoles("Administrador"),
    eliminar
);

module.exports = router;