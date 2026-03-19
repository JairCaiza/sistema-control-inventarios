const Joi = require("joi");

const crearCategoriaSchema = Joi.object({
    nombre: Joi.string().min(3).max(100).required(),
    tipo: Joi.string()
        .valid("equipo", "herramienta", "encofrado")
        .required(),
});
const actualizarCategoriaSchema = Joi.object({
    nombre: Joi.string().min(3).max(100).required(),
    tipo: Joi.string()
        .valid("equipo", "herramienta", "encofrado")
        .required(),
});
module.exports = {
    crearCategoriaSchema, actualizarCategoriaSchema
};