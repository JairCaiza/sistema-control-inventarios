const Joi = require("joi");

const crearActivoSchema = Joi.object({
    nombre: Joi.string().min(3).max(150).required(),
    descripcion: Joi.string().allow("", null),
    categoria_id: Joi.string().uuid().required(),
    ubicacion_id: Joi.string().uuid().required(),
    estado: Joi.string()
        .valid("disponible", "alquilado", "mantenimiento", "danado", "perdido")
        .required(),
    tipo_control: Joi.string().valid("unidad", "cantidad").required(),
    cantidad_total: Joi.number().integer().min(0).required(),
    valor_reposicion: Joi.number().min(0).optional()
});

module.exports = {
    crearActivoSchema
};