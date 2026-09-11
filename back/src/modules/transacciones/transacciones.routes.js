const express = require("express");

const router = express.Router();

const protect =
    require("../../middlewares/auth.middleware");

const {
    registrarIngreso,
    listarIngresos,
    registrarEgreso,
    listarEgresos,
    registrarTransferencia,
    listarTransferencias
} = require("./transacciones.controller");

/* =====================================================
   RUTAS DE INGRESOS
===================================================== */

router.post(
    "/ingresos",
    protect,
    registrarIngreso
);

router.get(
    "/ingresos",
    protect,
    listarIngresos
);

/* =====================================================
   RUTAS DE EGRESOS
===================================================== */

router.post(
    "/egresos",
    protect,
    registrarEgreso
);

router.get(
    "/egresos",
    protect,
    listarEgresos
);

/* =====================================================
   RUTAS DE TRANSFERENCIAS
===================================================== */

router.post(
    "/transferencias",
    protect,
    registrarTransferencia
);

router.get(
    "/transferencias",
    protect,
    listarTransferencias
);

module.exports = router;