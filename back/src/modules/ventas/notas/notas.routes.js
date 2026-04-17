const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");

const {
    crear,
    listar,
    obtenerPorId,
    generarPDF
} = require("./notas.controller");

router.post("/", protect, crear);
router.get("/", protect, listar);
router.get("/:id", protect, obtenerPorId);
router.get("/:id/pdf", protect, generarPDF);

module.exports = router;