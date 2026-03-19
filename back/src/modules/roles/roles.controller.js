const rolesService = require("./roles.service");
const { createRoleSchema, updateRoleSchema } = require("./roles.schema");

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

const deactivateRole = async (req, res) => {
    try {
        const role = await rolesService.deactivateRole(req.params.id);

        res.json({
            success: true,
            data: role
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRole,
    getRoles,
    updateRole,
    deactivateRole
};