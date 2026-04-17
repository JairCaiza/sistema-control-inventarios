const Joi = require("joi");

const crearNotaSchema = Joi.object({
    cliente_id: Joi.string().uuid().allow(null),

    metodo_pago: Joi.string()
        .valid("efectivo", "transferencia", "tarjeta")
        .required(),

    detalles: Joi.array().items(
        Joi.object({
            descripcion: Joi.string().required(),
            cantidad: Joi.number().integer().min(1).required(),
            precio_unitario: Joi.number().min(0).required()
        })
    ).min(1).required()
});

module.exports = {
    crearNotaSchema
};