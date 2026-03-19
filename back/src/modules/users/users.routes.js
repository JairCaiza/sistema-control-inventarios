const express = require("express");
const router = express.Router();

const usersController = require("./users.controller");
const protect = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

router.use(protect);
router.use(authorizeRoles("Administrador"));

router.post("/", usersController.createUser);
router.get("/", usersController.getUsers);
router.put("/:id", usersController.updateUser);
router.patch("/:id/deactivate", usersController.deactivateUser);

module.exports = router;