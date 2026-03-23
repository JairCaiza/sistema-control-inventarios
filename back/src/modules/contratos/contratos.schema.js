const Joi = require("joi");

const crearContratoSchema = Joi.object({

    numero_contrato: Joi.string().max(50).required(),

    cliente_id: Joi.string().uuid().required(),

    fecha_inicio: Joi.date().required(),

    fecha_fin: Joi.date().required(),

    estado: Joi.string()
        .valid("activo", "finalizado", "cancelado")
        .required(),

    observaciones: Joi.string().allow("", null)
});
const agregarActivoSchema = Joi.object({

    activo_id: Joi.string()
        .uuid()
        .required(),

    cantidad: Joi.number()
        .integer()
        .min(1)
        .required(),

    precio_diario: Joi.number()
        .min(0)
        .required()

});

module.exports = {
    crearContratoSchema, agregarActivoSchema
};