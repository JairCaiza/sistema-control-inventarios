const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");

const {
    crear,
    listar,
    reporteInventario, exportarInventarioPDF,
    exportarInventarioExcel
} = require("./activos.controller");

router.post("/", protect, crear);

router.get("/", protect, listar);
router.get("/reporte", protect, reporteInventario);
router.get("/reporte/pdf", protect, exportarInventarioPDF);
router.get("/reporte/excel", protect, exportarInventarioExcel);

module.exports = router;