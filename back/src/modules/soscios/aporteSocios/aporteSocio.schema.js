const Joi = require("joi");

/* =====================================================
   CREAR APORTE O RETIRO
===================================================== */

const crearAporteSocioSchema = Joi.object({
    socio_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "any.required":
                "El socio es obligatorio.",

            "string.guid":
                "El identificador del socio no es válido."
        }),

    cuenta_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "any.required":
                "La cuenta financiera es obligatoria.",

            "string.guid":
                "El identificador de la cuenta no es válido."
        }),

    tipo: Joi.string()
        .valid("aporte", "retiro")
        .required()
        .messages({
            "any.only":
                "El tipo debe ser aporte o retiro.",

            "any.required":
                "El tipo de movimiento es obligatorio."
        }),

    monto: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
            "number.base":
                "El monto debe ser numérico.",

            "number.positive":
                "El monto debe ser mayor que cero.",

            "any.required":
                "El monto es obligatorio."
        }),

    fecha: Joi.date()
        .iso()
        .required()
        .messages({
            "date.base":
                "La fecha no es válida.",

            "date.format":
                "La fecha debe tener un formato válido.",

            "any.required":
                "La fecha es obligatoria."
        }),

    metodo_pago: Joi.string()
        .trim()
        .max(30)
        .allow("", null)
        .messages({
            "string.max":
                "El método de pago no puede superar los 30 caracteres."
        }),

    referencia: Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .messages({
            "string.max":
                "La referencia no puede superar los 100 caracteres."
        }),

    estado: Joi.string()
        .valid(
            "pendiente",
            "confirmado"
        )
        .default("confirmado")
        .messages({
            "any.only":
                "El estado debe ser pendiente o confirmado."
        }),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 500 caracteres."
        })
});

/* =====================================================
   ACTUALIZAR APORTE O RETIRO
===================================================== */

const actualizarAporteSocioSchema = Joi.object({
    socio_id: Joi.string()
        .uuid()
        .messages({
            "string.guid":
                "El identificador del socio no es válido."
        }),

    cuenta_id: Joi.string()
        .uuid()
        .messages({
            "string.guid":
                "El identificador de la cuenta no es válido."
        }),

    tipo: Joi.string()
        .valid(
            "aporte",
            "retiro"
        )
        .messages({
            "any.only":
                "El tipo debe ser aporte o retiro."
        }),

    monto: Joi.number()
        .positive()
        .precision(2)
        .messages({
            "number.base":
                "El monto debe ser numérico.",

            "number.positive":
                "El monto debe ser mayor que cero."
        }),

    fecha: Joi.date()
        .iso()
        .messages({
            "date.base":
                "La fecha no es válida.",

            "date.format":
                "La fecha debe tener un formato válido."
        }),

    metodo_pago: Joi.string()
        .trim()
        .max(30)
        .allow("", null)
        .messages({
            "string.max":
                "El método de pago no puede superar los 30 caracteres."
        }),

    referencia: Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .messages({
            "string.max":
                "La referencia no puede superar los 100 caracteres."
        }),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 500 caracteres."
        })
}).min(1)
    .messages({
        "object.min":
            "Debes enviar al menos un campo para actualizar."
    });

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

const cambiarEstadoAporteSchema = Joi.object({
    estado: Joi.string()
        .valid(
            "pendiente",
            "confirmado",
            "anulado"
        )
        .required()
        .messages({
            "any.only":
                "El estado debe ser pendiente, confirmado o anulado.",

            "any.required":
                "El estado es obligatorio."
        })
});

module.exports = {
    crearAporteSocioSchema,
    actualizarAporteSocioSchema,
    cambiarEstadoAporteSchema
};