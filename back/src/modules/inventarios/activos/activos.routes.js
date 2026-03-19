const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");

const {
    crear,
    listar
} = require("./activos.controller");

router.post("/", protect, crear);

router.get("/", protect, listar);

module.exports = router;