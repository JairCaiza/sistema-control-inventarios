const Joi = require("joi");

/* =====================================================
   CREAR CONTRATO
===================================================== */
const crearContratoSchema = Joi.object({
    numero_contrato: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            "string.empty": "El número del contrato es obligatorio",
            "string.max":
                "El número del contrato no puede superar los 50 caracteres",
            "any.required": "El número del contrato es obligatorio"
        }),

    cliente_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "El identificador del cliente no es válido",
            "any.required": "El cliente es obligatorio"
        }),

    fecha_inicio: Joi.date()
        .iso()
        .required()
        .messages({
            "date.base": "La fecha de inicio no es válida",
            "date.format":
                "La fecha de inicio debe utilizar formato ISO",
            "any.required": "La fecha de inicio es obligatoria"
        }),

    fecha_fin: Joi.date()
        .iso()
        .greater(Joi.ref("fecha_inicio"))
        .required()
        .messages({
            "date.base": "La fecha de finalización no es válida",
            "date.format":
                "La fecha de finalización debe utilizar formato ISO",
            "date.greater":
                "La fecha de finalización debe ser posterior a la fecha de inicio",
            "any.required":
                "La fecha de finalización es obligatoria"
        }),

    estado: Joi.string()
        .valid("activo", "finalizado", "cancelado")
        .default("activo")
        .messages({
            "any.only":
                "El estado debe ser activo, finalizado o cancelado"
        }),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
        .optional()
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 500 caracteres"
        })
});

/* =====================================================
   AGREGAR ACTIVO AL CONTRATO
===================================================== */
const agregarActivoSchema = Joi.object({
    activo_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "El identificador del activo no es válido",
            "any.required": "El activo es obligatorio"
        }),

    cantidad: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "La cantidad debe ser un número",
            "number.integer":
                "La cantidad debe ser un número entero",
            "number.positive":
                "La cantidad debe ser mayor que cero",
            "any.required": "La cantidad es obligatoria"
        }),

    precio_diario: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
            "number.base":
                "El precio diario debe ser un número",
            "number.positive":
                "El precio diario debe ser mayor que cero",
            "number.precision":
                "El precio diario puede tener máximo dos decimales",
            "any.required":
                "El precio diario es obligatorio"
        })
});

module.exports = {
    crearContratoSchema,
    agregarActivoSchema
};