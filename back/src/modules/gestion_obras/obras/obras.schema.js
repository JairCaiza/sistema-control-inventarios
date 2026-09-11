const Joi = require("joi");

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADOS_OBRA = [
    "planificada",
    "en_proceso",
    "pausada",
    "finalizada",
    "cancelada"
];

/* =====================================================
   HELPERS
===================================================== */

const textoOpcional = Joi.string()
    .trim()
    .allow("", null);

const fechaOpcional = Joi.date()
    .iso()
    .allow(null, "");

const uuidOpcional = Joi.string()
    .uuid()
    .allow(null, "");

/* =====================================================
   CREATE OBRA
===================================================== */

const createObraSchema = Joi.object({
    codigo: Joi.string()
        .trim()
        .max(30)
        .required()
        .messages({
            "string.empty":
                "El código de la obra es obligatorio",
            "string.max":
                "El código no puede superar los 30 caracteres",
            "any.required":
                "El código de la obra es obligatorio"
        }),

    nombre: Joi.string()
        .trim()
        .min(3)
        .max(150)
        .required()
        .messages({
            "string.empty":
                "El nombre de la obra es obligatorio",
            "string.min":
                "El nombre debe tener al menos 3 caracteres",
            "string.max":
                "El nombre no puede superar los 150 caracteres",
            "any.required":
                "El nombre de la obra es obligatorio"
        }),

    cliente_id: uuidOpcional
        .optional()
        .messages({
            "string.guid":
                "El cliente seleccionado no es válido"
        }),

    ubicacion: textoOpcional
        .max(250)
        .optional(),

    fecha_inicio: fechaOpcional
        .optional(),

    fecha_fin: fechaOpcional
        .optional(),

    presupuesto: Joi.number()
        .precision(2)
        .min(0)
        .default(0)
        .messages({
            "number.base":
                "El presupuesto debe ser numérico",
            "number.min":
                "El presupuesto no puede ser negativo"
        }),

    estado: Joi.string()
        .valid(...ESTADOS_OBRA)
        .default("planificada")
        .messages({
            "any.only":
                `El estado debe ser uno de: ${ESTADOS_OBRA.join(", ")}`
        }),

    descripcion: textoOpcional
        .max(2000)
        .optional()
})
    .custom((value, helpers) => {
        if (
            value.fecha_inicio &&
            value.fecha_fin &&
            new Date(value.fecha_fin) <
            new Date(value.fecha_inicio)
        ) {
            return helpers.message({
                custom:
                    "La fecha de finalización no puede ser anterior a la fecha de inicio"
            });
        }

        return value;
    });

/* =====================================================
   UPDATE OBRA
===================================================== */

const updateObraSchema = Joi.object({
    codigo: Joi.string()
        .trim()
        .max(30)
        .optional(),

    nombre: Joi.string()
        .trim()
        .min(3)
        .max(150)
        .optional(),

    cliente_id: uuidOpcional
        .optional(),

    ubicacion: textoOpcional
        .max(250)
        .optional(),

    fecha_inicio: fechaOpcional
        .optional(),

    fecha_fin: fechaOpcional
        .optional(),

    presupuesto: Joi.number()
        .precision(2)
        .min(0)
        .optional(),

    estado: Joi.string()
        .valid(...ESTADOS_OBRA)
        .optional(),

    descripcion: textoOpcional
        .max(2000)
        .optional()
})
    .min(1)
    .custom((value, helpers) => {
        if (
            value.fecha_inicio &&
            value.fecha_fin &&
            new Date(value.fecha_fin) <
            new Date(value.fecha_inicio)
        ) {
            return helpers.message({
                custom:
                    "La fecha de finalización no puede ser anterior a la fecha de inicio"
            });
        }

        return value;
    });

/* =====================================================
   ID
===================================================== */

const obraIdSchema = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
});

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    ESTADOS_OBRA,
    createObraSchema,
    updateObraSchema,
    obraIdSchema
};