const Joi = require("joi");

/* =====================================================
   CAMPOS COMUNES PARA INGRESOS Y EGRESOS
===================================================== */

const transaccionBaseSchema = {
    cuenta_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "La cuenta seleccionada no es válida",
            "any.required": "La cuenta financiera es obligatoria"
        }),

    monto: Joi.number()
        .precision(2)
        .greater(0)
        .required()
        .messages({
            "number.base": "El monto debe ser numérico",
            "number.greater": "El monto debe ser mayor que cero",
            "any.required": "El monto es obligatorio"
        }),

    descripcion: Joi.string()
        .trim()
        .max(300)
        .required()
        .messages({
            "string.empty": "La descripción es obligatoria",
            "string.max":
                "La descripción no puede superar los 300 caracteres",
            "any.required": "La descripción es obligatoria"
        }),

    fecha: Joi.date()
        .iso()
        .required()
        .messages({
            "date.base": "La fecha no es válida",
            "date.format": "La fecha debe tener formato ISO",
            "any.required": "La fecha es obligatoria"
        }),

    referencia_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional()
        .messages({
            "string.guid": "La referencia no es válida"
        }),

    obra_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional()
        .messages({
            "string.guid": "La obra seleccionada no es válida"
        }),

    control_diario_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional()
        .messages({
            "string.guid": "El control diario seleccionado no es válido"
        }),

    origen_modulo: Joi.string()
        .trim()
        .max(50)
        .default("manual")
        .messages({
            "string.max":
                "El módulo de origen no puede superar los 50 caracteres"
        }),

    origen_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional()
        .messages({
            "string.guid": "El identificador de origen no es válido"
        })
};

/* =====================================================
   ESQUEMA PARA INGRESOS
===================================================== */

const registrarIngresoSchema = Joi.object({
    ...transaccionBaseSchema
}).unknown(false);

/* =====================================================
   ESQUEMA PARA EGRESOS
===================================================== */

const registrarEgresoSchema = Joi.object({
    ...transaccionBaseSchema
}).unknown(false);

/* =====================================================
   ESQUEMA PARA TRANSFERENCIAS
===================================================== */

const registrarTransferenciaSchema = Joi.object({
    cuenta_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "La cuenta de origen no es válida",
            "any.required": "La cuenta de origen es obligatoria"
        }),

    cuenta_destino_id: Joi.string()
        .uuid()
        .required()
        .invalid(Joi.ref("cuenta_id"))
        .messages({
            "string.guid": "La cuenta de destino no es válida",
            "any.required": "La cuenta de destino es obligatoria",
            "any.invalid":
                "La cuenta de destino debe ser diferente de la cuenta de origen"
        }),

    monto: Joi.number()
        .precision(2)
        .greater(0)
        .required()
        .messages({
            "number.base": "El monto debe ser numérico",
            "number.greater": "El monto debe ser mayor que cero",
            "any.required": "El monto es obligatorio"
        }),

    descripcion: Joi.string()
        .trim()
        .max(300)
        .required()
        .messages({
            "string.empty": "La descripción es obligatoria",
            "string.max":
                "La descripción no puede superar los 300 caracteres",
            "any.required": "La descripción es obligatoria"
        }),

    fecha: Joi.date()
        .iso()
        .required()
        .messages({
            "date.base": "La fecha no es válida",
            "date.format": "La fecha debe tener formato ISO",
            "any.required": "La fecha es obligatoria"
        }),

    referencia_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional()
        .messages({
            "string.guid": "La referencia no es válida"
        }),

    origen_modulo: Joi.string()
        .trim()
        .max(50)
        .default("transferencia_manual")
        .messages({
            "string.max":
                "El módulo de origen no puede superar los 50 caracteres"
        }),

    origen_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional()
        .messages({
            "string.guid": "El identificador de origen no es válido"
        })
})
    .custom((value, helpers) => {
        if (value.cuenta_id === value.cuenta_destino_id) {
            return helpers.message({
                custom:
                    "La cuenta de origen y la cuenta de destino deben ser diferentes"
            });
        }

        return value;
    })
    .unknown(false);

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    registrarIngresoSchema,
    registrarEgresoSchema,
    registrarTransferenciaSchema
};