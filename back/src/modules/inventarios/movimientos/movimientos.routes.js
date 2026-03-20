const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");

const { crear, historial, listar, kardex } = require("./movimientos.controller");

router.get("/kardex/:activo_id", protect, kardex);
router.get("/activo/:activo_id", protect, historial);

router.get("/", protect, listar);
router.post("/", protect, crear);

module.exports = router;