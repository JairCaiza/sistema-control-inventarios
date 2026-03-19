const express = require("express");
const router = express.Router();

const rolesController = require("./roles.controller");
const protect = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

router.use(protect);
router.use(authorizeRoles("Administrador"));

router.post("/", rolesController.createRole);
router.get("/", rolesController.getRoles);
router.put("/:id", rolesController.updateRole);
router.patch("/:id/deactivate", rolesController.deactivateRole);

module.exports = router;