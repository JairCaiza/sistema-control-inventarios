const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");

const {
    crear,
    listar,
    obtener,
    actualizar,
    eliminar
} = require("./clientes.controller");

router.post("/", protect, crear);
router.get("/", protect, listar);
router.get("/:id", protect, obtener);
router.put("/:id", protect, actualizar);
router.delete("/:id", protect, eliminar);

module.exports = router;