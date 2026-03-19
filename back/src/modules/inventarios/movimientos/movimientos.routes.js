const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");

const { crear } = require("./movimientos.controller");
const { historial } = require("./movimientos.controller");

router.post("/", protect, crear);
router.get("/activo/:activo_id", protect, historial);
module.exports = router;