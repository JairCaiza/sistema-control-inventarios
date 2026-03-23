const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");

const { crear, listar, agregarActivo } = require("./contratos.controller");

router.post("/", protect, crear);
router.get("/", protect, listar);
router.post("/:id/activos", protect, agregarActivo);

module.exports = router;