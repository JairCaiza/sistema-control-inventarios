const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");

const { registrar, listar, obtenerPorId } = require("./devoluciones.controller");

router.post("/", protect, registrar);
router.get("/", protect, listar);
router.get("/:id", protect, obtenerPorId);

module.exports = router;