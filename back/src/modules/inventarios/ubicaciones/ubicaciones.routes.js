const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");
const authorizeRoles = require("../../../middlewares/role.middleware");

const {
    crear,
    listar,
    actualizar,
    eliminar
} = require("./ubicaciones.controller");


router.post(
    "/",
    protect,
    authorizeRoles("Administrador"),
    crear
);

router.get(
    "/",
    protect,
    listar
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