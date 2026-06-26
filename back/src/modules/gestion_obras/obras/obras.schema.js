const Joi = require("joi");

/* =========================
   CREATE OBRA
========================= */


const createObraSchema = Joi.object({

    codigo: Joi.string()
        .max(30)
        .required(),

    nombre: Joi.string()
        .max(150)
        .required(),

    cliente_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional(),

    ubicacion: Joi.string()
        .allow("")
        .optional(),

    fecha_inicio: Joi.date()
        .optional(),

    fecha_fin: Joi.date()
        .optional(),

    presupuesto: Joi.number()
        .min(0)
        .optional(),

    estado: Joi.string()
        .valid(
            "planificada",
            "en_proceso",
            "pausada",
            "finalizada",
            "cancelada"
        )
        .optional(),

    descripcion: Joi.string()
        .allow("")
        .optional()
});
/* =========================
   UPDATE OBRA
========================= */
const updateObraSchema = Joi.object({
    codigo: Joi.string().max(30).optional(),

    nombre: Joi.string().max(150).optional(),

    cliente: Joi.string().max(150).allow("").optional(),

    ubicacion: Joi.string().allow("").optional(),

    fecha_inicio: Joi.date().optional(),

    fecha_fin: Joi.date().optional(),

    presupuesto: Joi.number().min(0).optional(),

    estado: Joi.string()
        .valid("activa", "pausada", "finalizada")
        .optional(),

    descripcion: Joi.string().allow("").optional()
});

module.exports = {
    createObraSchema,
    updateObraSchema
};