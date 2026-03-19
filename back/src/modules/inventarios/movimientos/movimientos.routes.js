const express = require("express");
const router = express.Router();

const protect = require("../../../middlewares/auth.middleware");

const { crear } = require("./movimientos.controller");

router.post("/", protect, crear);

module.exports = router;