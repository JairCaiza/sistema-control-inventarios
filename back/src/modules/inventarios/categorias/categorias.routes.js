const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");
const authorizeRoles = require("../../../middlewares/role.middleware");

const { crearCategorias, obtenerCategorias, actualizar,eliminar } = require("./categorias.controller");

// Crear categoría
router.post(
    "/",
    protect,
    authorizeRoles("Administrador"),
    crearCategorias
);
router.get(
    "/",
    protect,
    obtenerCategorias
);
router.put(
    "/:id",
    protect,
    authorizeRoles("Administrador"),
    actualizar
);
router.delete(
    "/:id",
    protect,
    authorizeRoles("Administrador"),
    eliminar
);
module.exports = router;