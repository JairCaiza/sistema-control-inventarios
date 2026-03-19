const Joi = require("joi");

const createUserSchema = Joi.object({
    nombre: Joi.string().min(3).max(100).required(),
    apellido: Joi.string().min(3).max(100).required(),
    correo: Joi.string().email().required(),
    contrasena: Joi.string().min(6).required(),
    rol_id: Joi.string().uuid().required()
});

const updateUserSchema = Joi.object({
    nombre: Joi.string().min(3).max(100).optional(),
    apellido: Joi.string().min(3).max(100).optional(),
    correo: Joi.string().email().optional(),
    activo: Joi.boolean().optional()
});

module.exports = {
    createUserSchema,
    updateUserSchema
};