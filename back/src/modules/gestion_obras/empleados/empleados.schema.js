const Joi = require("joi");

const createEmpleadoSchema = Joi.object({
    nombres: Joi.string()
        .min(2)
        .max(100)
        .required(),

    apellidos: Joi.string()
        .min(2)
        .max(100)
        .required(),

    cedula: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            "string.pattern.base": "La cédula debe tener 10 dígitos"
        }),

    telefono: Joi.string()
        .pattern(/^[0-9]{7,15}$/)
        .allow("")
        .optional()
        .messages({
            "string.pattern.base": "El teléfono debe contener solo números"
        }),

    correo: Joi.string()
        .email()
        .allow("")
        .optional(),

    direccion: Joi.string()
        .allow("")
        .optional(),

    fecha_nacimiento: Joi.date()
        .optional(),

    cargo: Joi.string()
        .max(100)
        .allow("")
        .optional(),

    tipo_pago: Joi.string()
        .valid("diario", "semanal", "mensual")
        .required(),

    salario_base: Joi.number()
        .min(0)
        .optional(),

    fecha_ingreso: Joi.date()
        .optional(),

    activo: Joi.boolean()
        .optional(),

    observaciones: Joi.string()
        .allow("")
        .optional()
});

const updateEmpleadoSchema = Joi.object({
    nombres: Joi.string()
        .min(2)
        .max(100)
        .optional(),

    apellidos: Joi.string()
        .min(2)
        .max(100)
        .optional(),

    cedula: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .optional()
        .messages({
            "string.pattern.base": "La cédula debe tener 10 dígitos"
        }),

    telefono: Joi.string()
        .pattern(/^[0-9]{7,15}$/)
        .allow("")
        .optional()
        .messages({
            "string.pattern.base": "El teléfono debe contener solo números"
        }),

    correo: Joi.string()
        .email()
        .allow("")
        .optional(),

    direccion: Joi.string()
        .allow("")
        .optional(),

    fecha_nacimiento: Joi.date()
        .optional(),

    cargo: Joi.string()
        .max(100)
        .allow("")
        .optional(),

    tipo_pago: Joi.string()
        .valid("diario", "semanal", "mensual")
        .optional(),

    salario_base: Joi.number()
        .min(0)
        .optional(),

    fecha_ingreso: Joi.date()
        .optional(),

    activo: Joi.boolean()
        .optional(),

    observaciones: Joi.string()
        .allow("")
        .optional()
});

module.exports = {
    createEmpleadoSchema,
    updateEmpleadoSchema
};