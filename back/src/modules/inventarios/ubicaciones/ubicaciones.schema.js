const Joi = require("joi");

const crearUbicacionSchema = Joi.object({
    nombre: Joi.string().min(3).max(100).required(),
    descripcion: Joi.string().allow("", null)
});

const actualizarUbicacionSchema = Joi.object({
    nombre: Joi.string().min(3).max(100).required(),
    descripcion: Joi.string().allow("", null)
});

module.exports = {
    crearUbicacionSchema,
    actualizarUbicacionSchema
};