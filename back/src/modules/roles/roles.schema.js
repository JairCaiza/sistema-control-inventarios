const Joi = require("joi");

const createRoleSchema = Joi.object({
    nombre: Joi.string().min(3).max(50).required(),
    descripcion: Joi.string().allow("").optional()
});

const updateRoleSchema = Joi.object({
    nombre: Joi.string().min(3).max(50).optional(),
    descripcion: Joi.string().allow("").optional(),
    activo: Joi.boolean().optional()
});

module.exports = {
    createRoleSchema,
    updateRoleSchema
};