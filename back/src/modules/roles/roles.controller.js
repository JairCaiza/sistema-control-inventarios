const rolesService = require("./roles.service");
const { createRoleSchema, updateRoleSchema } = require("./roles.schema");

/* =========================
   CREAR ROL
========================= */
const createRole = async (req, res) => {
    try {
        const { error } = createRoleSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const role = await rolesService.createRole(req.body);

        res.status(201).json({
            success: true,
            data: role
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   LISTAR ROLES
========================= */
const getRoles = async (req, res) => {
    try {
        const roles = await rolesService.getRoles();

        res.json({
            success: true,
            data: roles
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   ACTUALIZAR ROL
========================= */
const updateRole = async (req, res) => {
    try {
        const { error } = updateRoleSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const role = await rolesService.updateRole(req.params.id, req.body);

        res.json({
            success: true,
            data: role
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   ACTIVAR / DESACTIVAR ROL
========================= */
const toggleRoleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body || {};

        if (typeof activo !== "boolean") {
            return res.status(400).json({
                message: "Campo 'activo' es requerido y debe ser boolean",
            });
        }

        const role = await rolesService.toggleRoleStatus(id, activo);

        return res.json({
            success: true,
            data: role,
        });

    } catch (error) {
        console.error("ERROR TOGGLE:", error); // 🔥 IMPORTANTE
        return res.status(500).json({
            message: error.message,
        });
    }
};
/* =========================
   ELIMINAR ROL (VALIDADO)
========================= */
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await rolesService.deleteRole(id);

        res.json({
            success: true,
            message: "Rol eliminado correctamente",
            data: role
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

module.exports = {
    createRole,
    getRoles,
    updateRole,
    toggleRoleStatus,
    deleteRole
};