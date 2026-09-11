const Joi = require("joi");

/* =====================================================
   CREAR SOCIO
===================================================== */

const crearSocioSchema = Joi.object({
    usuario_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.empty":
                "Debe seleccionar un usuario.",
            "string.guid":
                "El usuario seleccionado no es válido.",
            "any.required":
                "Debe seleccionar un usuario con rol Socio."
        }),

    identificacion: Joi.string()
        .trim()
        .min(5)
        .max(20)
        .required()
        .messages({
            "string.empty":
                "La identificación es obligatoria.",
            "string.min":
                "La identificación debe tener al menos 5 caracteres.",
            "string.max":
                "La identificación no puede superar los 20 caracteres.",
            "any.required":
                "La identificación es obligatoria."
        }),

    contacto: Joi.string()
        .trim()
        .max(30)
        .allow("", null)
        .messages({
            "string.max":
                "El contacto no puede superar los 30 caracteres."
        }),

    fecha_ingreso: Joi.date()
        .iso()
        .allow(null)
        .messages({
            "date.base":
                "La fecha de ingreso no es válida.",
            "date.format":
                "La fecha debe tener el formato YYYY-MM-DD."
        }),

    activo: Joi.boolean()
        .default(true)
        .messages({
            "boolean.base":
                "El campo activo debe ser verdadero o falso."
        })
}).unknown(false);


/* =====================================================
   ACTUALIZAR SOCIO
===================================================== */

const actualizarSocioSchema = Joi.object({
    nombre: Joi.string()
        .trim()
        .min(3)
        .max(150),

    identificacion: Joi.string()
        .trim()
        .min(5)
        .max(20),

    contacto: Joi.string()
        .trim()
        .max(30)
        .allow("", null),

    fecha_ingreso: Joi.date()
        .iso()
        .allow(null),

    activo: Joi.boolean()
})
    .min(1)
    .unknown(false)
    .messages({
        "object.min":
            "Debe enviar al menos un campo para actualizar."
    });


/* =====================================================
   CAMBIAR ESTADO
===================================================== */

const cambiarEstadoSocioSchema = Joi.object({
    activo: Joi.boolean()
        .required()
        .messages({
            "boolean.base":
                "El campo activo debe ser verdadero o falso.",
            "any.required":
                "El campo activo es obligatorio."
        })
}).unknown(false);


/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crearSocioSchema,
    actualizarSocioSchema,
    cambiarEstadoSocioSchema
};