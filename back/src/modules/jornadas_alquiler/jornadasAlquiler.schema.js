const Joi = require("joi");

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADOS_JORNADA = [
    "trabajado",
    "no_laborable",
    "suspendido",
    "cancelado",
];

/* =====================================================
   REGISTRAR JORNADA
===================================================== */

const registrarJornadaSchema = Joi.object({
    detalle_contrato_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.base":
                "El detalle del contrato debe ser válido",
            "string.guid":
                "El detalle del contrato seleccionado no es válido",
            "string.empty":
                "El detalle del contrato es obligatorio",
            "any.required":
                "El detalle del contrato es obligatorio",
        }),

    fecha: Joi.date()
        .iso()
        .required()
        .messages({
            "date.base":
                "La fecha de la jornada debe ser válida",
            "date.format":
                "La fecha de la jornada debe tener un formato válido",
            "any.required":
                "La fecha de la jornada es obligatoria",
        }),

    estado: Joi.string()
        .valid(...ESTADOS_JORNADA)
        .required()
        .messages({
            "string.empty":
                "El estado de la jornada es obligatorio",
            "any.only":
                "El estado debe ser trabajado, no_laborable, suspendido o cancelado",
            "any.required":
                "El estado de la jornada es obligatorio",
        }),

    cantidad_efectiva: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
            "number.base":
                "La cantidad efectiva debe ser un número",
            "number.integer":
                "La cantidad efectiva debe ser un número entero",
            "number.min":
                "La cantidad efectiva no puede ser negativa",
            "any.required":
                "La cantidad efectiva es obligatoria",
        }),

    cobrable: Joi.boolean()
        .optional()
        .messages({
            "boolean.base":
                "El campo cobrable debe ser verdadero o falso",
        }),

    motivo: Joi.string()
        .trim()
        .max(150)
        .allow("", null)
        .optional()
        .messages({
            "string.base":
                "El motivo debe ser texto",
            "string.max":
                "El motivo no puede superar los 150 caracteres",
        }),

    observaciones: Joi.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional()
        .messages({
            "string.base":
                "Las observaciones deben ser texto",
            "string.max":
                "Las observaciones no pueden superar los 1000 caracteres",
        }),
});

/* =====================================================
   ACTUALIZAR JORNADA
===================================================== */

const actualizarJornadaSchema = Joi.object({
    fecha: Joi.date()
        .iso()
        .optional()
        .messages({
            "date.base":
                "La fecha de la jornada debe ser válida",
            "date.format":
                "La fecha de la jornada debe tener un formato válido",
        }),

    estado: Joi.string()
        .valid(...ESTADOS_JORNADA)
        .optional()
        .messages({
            "any.only":
                "El estado debe ser trabajado, no_laborable, suspendido o cancelado",
        }),

    cantidad_efectiva: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
            "number.base":
                "La cantidad efectiva debe ser un número",
            "number.integer":
                "La cantidad efectiva debe ser un número entero",
            "number.min":
                "La cantidad efectiva no puede ser negativa",
        }),

    cobrable: Joi.boolean()
        .optional()
        .messages({
            "boolean.base":
                "El campo cobrable debe ser verdadero o falso",
        }),

    motivo: Joi.string()
        .trim()
        .max(150)
        .allow("", null)
        .optional()
        .messages({
            "string.base":
                "El motivo debe ser texto",
            "string.max":
                "El motivo no puede superar los 150 caracteres",
        }),

    observaciones: Joi.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional()
        .messages({
            "string.base":
                "Las observaciones deben ser texto",
            "string.max":
                "Las observaciones no pueden superar los 1000 caracteres",
        }),
})
    .min(1)
    .messages({
        "object.min":
            "Debe enviar al menos un campo para actualizar la jornada",
    });

/* =====================================================
   ID DE JORNADA
===================================================== */

const jornadaIdSchema = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid":
                "El identificador de la jornada no es válido",
            "string.empty":
                "El identificador de la jornada es obligatorio",
            "any.required":
                "El identificador de la jornada es obligatorio",
        }),
});

/* =====================================================
   ID DE CONTRATO
===================================================== */

const contratoIdSchema = Joi.object({
    contratoId: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid":
                "El identificador del contrato no es válido",
            "string.empty":
                "El identificador del contrato es obligatorio",
            "any.required":
                "El identificador del contrato es obligatorio",
        }),
});

/* =====================================================
   ID DE DETALLE DEL CONTRATO
===================================================== */

const detalleContratoIdSchema = Joi.object({
    detalleContratoId: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid":
                "El identificador del detalle del contrato no es válido",
            "string.empty":
                "El identificador del detalle del contrato es obligatorio",
            "any.required":
                "El identificador del detalle del contrato es obligatorio",
        }),
});

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    ESTADOS_JORNADA,
    registrarJornadaSchema,
    actualizarJornadaSchema,
    jornadaIdSchema,
    contratoIdSchema,
    detalleContratoIdSchema,
};