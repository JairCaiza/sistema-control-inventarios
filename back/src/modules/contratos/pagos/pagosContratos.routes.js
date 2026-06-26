const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");

const pagosContratosController = require("./pagosContratos.controller");

router.post("/:id/pagos", protect, pagosContratosController.registrar);

router.get("/:id/pagos", protect, pagosContratosController.listarPorContrato);

router.get("/:id/pagos/resumen", protect, pagosContratosController.resumen);

module.exports = router;