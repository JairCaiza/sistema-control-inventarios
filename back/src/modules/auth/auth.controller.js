const { loginSchema } = require("./auth.schema");
const authService = require("./auth.service");

const login = async (req, res, next) => {
    try {
        const { error } = loginSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }

        const result = await authService.login(req.body);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
};