const usersService = require("./users.service");
const { createUserSchema, updateUserSchema } = require("./users.schema");

/* =========================
   CREATE USER
========================= */
const createUser = async (req, res) => {
    try {
        const { error } = createUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const user = await usersService.createUser(req.body);

        res.status(201).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =========================
   GET USERS
========================= */
const getUsers = async (req, res) => {
    try {
        const users = await usersService.getUsers();

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =========================
   UPDATE USER
========================= */
const updateUser = async (req, res) => {
    try {
        const { error } = updateUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const user = await usersService.updateUser(req.params.id, req.body);

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =========================
   TOGGLE STATUS (PUT)
========================= */
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        if (typeof activo !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "El campo 'activo' debe ser booleano"
            });
        }

        const userUpdated = await usersService.toggleUserStatus(id, activo);

        return res.json({
            success: true,
            data: userUpdated
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createUser,
    getUsers,
    updateUser,
    toggleUserStatus
};