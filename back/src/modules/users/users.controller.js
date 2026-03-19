const usersService = require("./users.service");
const { createUserSchema, updateUserSchema } = require("./users.schema");

const createUser = async (req, res) => {
    try {
        const { error } = createUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const user = await usersService.createUser(req.body);

        res.status(201).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await usersService.getUsers();

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { error } = updateUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const user = await usersService.updateUser(req.params.id, req.body);

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deactivateUser = async (req, res) => {
    try {
        const user = await usersService.deactivateUser(req.params.id);

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUser,
    getUsers,
    updateUser,
    deactivateUser
};