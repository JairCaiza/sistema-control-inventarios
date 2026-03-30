const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");

const { crear, listar, agregarActivo, obtener } = require("./contratos.controller");

router.post("/", protect, crear);
router.get("/", protect, listar);
router.post("/:id/activos", protect, agregarActivo);
router.get("/:id", protect, obtener);

module.exports = router;