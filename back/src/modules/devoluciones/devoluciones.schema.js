const Joi = require("joi");

const registrarDevolucionSchema = Joi.object({
    contrato_id: Joi.string().uuid().required(),

    fecha_devolucion: Joi.date().required(),

    metodo_pago: Joi.string() // 🔥 AGREGAR
        .valid("efectivo", "transferencia", "tarjeta")
        .required()
});

module.exports = {
    registrarDevolucionSchema
};