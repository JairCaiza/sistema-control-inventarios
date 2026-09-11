const Joi = require("joi");

/* =====================================================
   CREAR CUENTA FINANCIERA
===================================================== */
const crearCuentaSchema = Joi.object({
    nombre: Joi.string()
        .trim()
        .max(100)
        .required()
        .messages({
            "string.empty": "El nombre de la cuenta es obligatorio",
            "string.max":
                "El nombre no puede superar los 100 caracteres",
            "any.required": "El nombre de la cuenta es obligatorio"
        }),

    tipo: Joi.string()
        .valid("caja", "banco", "efectivo")
        .required()
        .messages({
            "any.only":
                "El tipo de cuenta debe ser caja, banco o efectivo",
            "any.required": "El tipo de cuenta es obligatorio"
        }),

    saldo_inicial: Joi.number()
        .precision(2)
        .min(0)
        .default(0)
        .messages({
            "number.base": "El saldo inicial debe ser numérico",
            "number.min":
                "El saldo inicial no puede ser negativo"
        }),

    observaciones: Joi.string()
        .trim()
        .max(300)
        .allow("", null)
        .optional()
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 300 caracteres"
        })
}).unknown(false);

/* =====================================================
   ACTUALIZAR CUENTA FINANCIERA
===================================================== */
const actualizarCuentaSchema = Joi.object({
    nombre: Joi.string()
        .trim()
        .max(100)
        .required(),

    tipo: Joi.string()
        .valid("caja", "banco", "efectivo")
        .required(),

    observaciones: Joi.string()
        .trim()
        .max(300)
        .allow("", null)
        .optional(),

    activo: Joi.boolean()
        .required()
}).unknown(false);

/* =====================================================
   CAMBIAR ESTADO
===================================================== */
const cambiarEstadoSchema = Joi.object({
    activo: Joi.boolean()
        .required()
        .messages({
            "boolean.base":
                "El estado activo debe ser verdadero o falso",
            "any.required": "El estado es obligatorio"
        })
}).unknown(false);

module.exports = {
    crearCuentaSchema,
    actualizarCuentaSchema,
    cambiarEstadoSchema
};