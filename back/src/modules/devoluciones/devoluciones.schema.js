const Joi = require("joi");

const registrarDevolucionSchema = Joi.object({
    contrato_id: Joi.string().uuid().required(),

    fecha_devolucion: Joi.date().required(),

});

module.exports = {
    registrarDevolucionSchema
};