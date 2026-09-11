const Joi = require("joi");

/* =====================================================
   GENERAR DISTRIBUCIÓN DE UTILIDADES
===================================================== */

const generarUtilidadSchema = Joi.object({
    periodo: Joi.string()
        .trim()
        .required()
        .messages({
            "any.required":
                "El período es obligatorio.",
            "string.empty":
                "El período es obligatorio."
        }),

    monto_distribuir: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
            "number.positive":
                "El monto a distribuir debe ser mayor que cero.",
            "any.required":
                "El monto a distribuir es obligatorio."
        }),

    observaciones: Joi.string()
        .trim()
        .max(300)
        .allow("", null)
}).unknown(false);

/* =====================================================
   PAGAR UTILIDAD
===================================================== */

const pagarUtilidadSchema = Joi.object({

    cuenta_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "any.required":
                "La cuenta financiera es obligatoria."
        }),

    fecha_pago: Joi.date()
        .iso()
        .required()
        .messages({
            "any.required":
                "La fecha de pago es obligatoria."
        }),

    metodo_pago: Joi.string()
        .valid(
            "efectivo",
            "transferencia",
            "deposito",
            "cheque"
        )
        .required()
        .messages({
            "any.required":
                "El método de pago es obligatorio."
        }),

    referencia: Joi.string()
        .trim()
        .max(100)
        .allow("", null),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)

}).unknown(false);

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

const cambiarEstadoUtilidadSchema =
    Joi.object({

        estado: Joi.string()
            .valid(
                "pendiente",
                "pagado",
                "anulado"
            )
            .required()
            .messages({
                "any.required":
                    "El estado es obligatorio."
            })

    }).unknown(false);

module.exports = {

    generarUtilidadSchema,

    pagarUtilidadSchema,

    cambiarEstadoUtilidadSchema

};