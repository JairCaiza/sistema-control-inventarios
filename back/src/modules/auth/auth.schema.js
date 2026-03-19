const Joi = require("joi");

const loginSchema = Joi.object({
    correo: Joi.string().email().required(),
    contrasena: Joi.string().min(6).required(),
});

module.exports = {
    loginSchema,
};