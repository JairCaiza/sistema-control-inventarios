const Joi = require("joi");

const crearMovimientoSchema = Joi.object({
    activo_id: Joi.string().uuid().required(),

    tipo_movimiento: Joi.string()
        .valid("entrada", "salida", "ajuste")
        .required(),

    cantidad: Joi.number().integer().min(1).required(),

    motivo: Joi.string().allow("", null),

    referencia: Joi.string().max(100).allow("", null)
});

module.exports = {
    crearMovimientoSchema
};