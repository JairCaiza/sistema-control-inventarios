const express = require("express");
const router = express.Router();

const usersController = require("./users.controller");
const protect = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

/* =========================
   FIX OPTIONS (CORRECTO)
========================= */
router.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

/* =========================
   AUTH SAFE
========================= */
router.use((req, res, next) => {
    if (req.method === "OPTIONS") return next();
    protect(req, res, next);
});

router.use((req, res, next) => {
    if (req.method === "OPTIONS") return next();
    authorizeRoles("Administrador")(req, res, next);
});

/* =========================
   RUTAS
========================= */
router.post("/", usersController.createUser);
router.get("/", usersController.getUsers);
router.put("/:id", usersController.updateUser);
router.put("/:id/status", usersController.toggleUserStatus);

module.exports = router;