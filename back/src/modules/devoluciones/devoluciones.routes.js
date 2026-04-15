const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");

const { registrar } = require("./devoluciones.controller");

router.post("/", protect, registrar);

module.exports = router;