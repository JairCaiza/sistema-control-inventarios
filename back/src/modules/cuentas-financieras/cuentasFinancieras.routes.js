const express = require("express");

const router = express.Router();

const protect =
    require("../../middlewares/auth.middleware");

const {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    cambiarEstado,
    eliminar,
    resumen
} = require("./cuentasFinancieras.controller");

/*
  Esta ruta debe ir antes de /:id para que Express
  no interprete "resumen" como un identificador.
*/
router.get("/resumen", protect, resumen);

router.post("/", protect, crear);

router.get("/", protect, listar);

router.get("/:id", protect, obtenerPorId);

router.put("/:id", protect, actualizar);

router.patch(
    "/:id/estado",
    protect,
    cambiarEstado
);

router.delete("/:id", protect, eliminar);

module.exports = router;