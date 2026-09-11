const Joi = require("joi");

/* =====================================================
   CONSTANTES
===================================================== */

const TIPOS_GASTO = [
    "materiales",
    "transporte",
    "alimentacion",
    "combustible",
    "herramientas",
    "servicios",
    "mantenimiento",
    "administrativo",
    "otro"
];

const ESTADOS_GASTO = [
    "pendiente",
    "pagado",
    "anulado"
];

const METODOS_PAGO = [
    "efectivo",
    "transferencia",
    "deposito",
    "cheque"
];

/* =====================================================
   HELPERS
===================================================== */

const uuidSchema = Joi.string()
    .uuid({
        version: [
            "uuidv4",
            "uuidv5"
        ]
    });

const fechaSchema = Joi.date()
    .iso();

const montoSchema = Joi.number()
    .precision(2)
    .positive();

/* =====================================================
   CREAR GASTO
===================================================== */

const crearGastoObraSchema = Joi.object({

    obra_id: uuidSchema
        .required()
        .messages({
            "any.required": "La obra es obligatoria.",
            "string.empty": "La obra es obligatoria.",
            "string.guid": "El identificador de la obra no es válido."
        }),

    control_diario_id: uuidSchema
        .allow(null)
        .optional()
        .messages({
            "string.guid": "El identificador del control diario no es válido."
        }),

    tipo: Joi.string()
        .trim()
        .lowercase()
        .valid(...TIPOS_GASTO)
        .required()
        .messages({
            "any.required": "El tipo de gasto es obligatorio.",
            "string.empty": "El tipo de gasto es obligatorio.",
            "any.only": `El tipo de gasto debe ser uno de los siguientes: ${TIPOS_GASTO.join(", ")}.`
        }),

    descripcion: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required()
        .messages({
            "any.required": "La descripción del gasto es obligatoria.",
            "string.empty": "La descripción del gasto es obligatoria.",
            "string.min": "La descripción debe tener al menos 3 caracteres.",
            "string.max": "La descripción no puede superar los 500 caracteres."
        }),

    monto: montoSchema
        .required()
        .messages({
            "any.required": "El monto es obligatorio.",
            "number.base": "El monto debe ser un valor numérico.",
            "number.positive": "El monto debe ser mayor a cero."
        }),

    fecha: fechaSchema
        .required()
        .messages({
            "any.required": "La fecha del gasto es obligatoria.",
            "date.base": "La fecha del gasto no es válida.",
            "date.format": "La fecha debe tener un formato válido."
        }),

    referencia: Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "La referencia no puede superar los 100 caracteres."
        }),

    observaciones: Joi.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "Las observaciones no pueden superar los 1000 caracteres."
        })

})
    .options({
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

/* =====================================================
   ACTUALIZAR GASTO
   SOLO SE DEBE PERMITIR SI ESTÁ PENDIENTE
===================================================== */

const actualizarGastoObraSchema = Joi.object({

    obra_id: uuidSchema
        .optional()
        .messages({
            "string.guid": "El identificador de la obra no es válido."
        }),

    control_diario_id: uuidSchema
        .allow(null)
        .optional()
        .messages({
            "string.guid": "El identificador del control diario no es válido."
        }),

    tipo: Joi.string()
        .trim()
        .lowercase()
        .valid(...TIPOS_GASTO)
        .optional()
        .messages({
            "any.only": `El tipo de gasto debe ser uno de los siguientes: ${TIPOS_GASTO.join(", ")}.`
        }),

    descripcion: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .optional()
        .messages({
            "string.min": "La descripción debe tener al menos 3 caracteres.",
            "string.max": "La descripción no puede superar los 500 caracteres."
        }),

    monto: montoSchema
        .optional()
        .messages({
            "number.base": "El monto debe ser un valor numérico.",
            "number.positive": "El monto debe ser mayor a cero."
        }),

    fecha: fechaSchema
        .optional()
        .messages({
            "date.base": "La fecha del gasto no es válida.",
            "date.format": "La fecha debe tener un formato válido."
        }),

    referencia: Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "La referencia no puede superar los 100 caracteres."
        }),

    observaciones: Joi.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "Las observaciones no pueden superar los 1000 caracteres."
        })

})
    .min(1)
    .options({
        abortEarly: false,
        stripUnknown: true,
        convert: true
    })
    .messages({
        "object.min": "Debe enviar al menos un campo para actualizar."
    });

/* =====================================================
   CONFIRMAR GASTO
   AQUÍ ES CUANDO SE MUEVE EL DINERO
===================================================== */

const confirmarGastoObraSchema = Joi.object({

    cuenta_id: uuidSchema
        .required()
        .messages({
            "any.required": "La cuenta financiera es obligatoria.",
            "string.empty": "La cuenta financiera es obligatoria.",
            "string.guid": "El identificador de la cuenta financiera no es válido."
        }),

    fecha_pago: fechaSchema
        .required()
        .messages({
            "any.required": "La fecha de pago es obligatoria.",
            "date.base": "La fecha de pago no es válida.",
            "date.format": "La fecha de pago debe tener un formato válido."
        }),

    metodo_pago: Joi.string()
        .trim()
        .lowercase()
        .valid(...METODOS_PAGO)
        .required()
        .messages({
            "any.required": "El método de pago es obligatorio.",
            "string.empty": "El método de pago es obligatorio.",
            "any.only": `El método de pago debe ser uno de los siguientes: ${METODOS_PAGO.join(", ")}.`
        }),

    referencia: Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "La referencia no puede superar los 100 caracteres."
        }),

    observaciones: Joi.string()
        .trim()
        .max(1000)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "Las observaciones no pueden superar los 1000 caracteres."
        })

})
    .options({
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

/* =====================================================
   ANULAR GASTO
===================================================== */

const anularGastoObraSchema = Joi.object({

    motivo: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required()
        .messages({
            "any.required": "El motivo de anulación es obligatorio.",
            "string.empty": "El motivo de anulación es obligatorio.",
            "string.min": "El motivo debe tener al menos 3 caracteres.",
            "string.max": "El motivo no puede superar los 500 caracteres."
        })

})
    .options({
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

/* =====================================================
   VALIDAR ID
===================================================== */

const gastoObraIdSchema = Joi.object({

    id: uuidSchema
        .required()
        .messages({
            "any.required": "El identificador del gasto es obligatorio.",
            "string.empty": "El identificador del gasto es obligatorio.",
            "string.guid": "El identificador del gasto no es válido."
        })

})
    .options({
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

/* =====================================================
   LISTAR / FILTRAR GASTOS
===================================================== */

const listarGastosObraSchema = Joi.object({

    obra_id: uuidSchema
        .optional()
        .messages({
            "string.guid": "El identificador de la obra no es válido."
        }),

    control_diario_id: uuidSchema
        .optional()
        .messages({
            "string.guid": "El identificador del control diario no es válido."
        }),

    cuenta_id: uuidSchema
        .optional()
        .messages({
            "string.guid": "El identificador de la cuenta financiera no es válido."
        }),

    estado: Joi.string()
        .trim()
        .lowercase()
        .valid(...ESTADOS_GASTO)
        .optional()
        .messages({
            "any.only": `El estado debe ser uno de los siguientes: ${ESTADOS_GASTO.join(", ")}.`
        }),

    tipo: Joi.string()
        .trim()
        .lowercase()
        .valid(...TIPOS_GASTO)
        .optional()
        .messages({
            "any.only": `El tipo debe ser uno de los siguientes: ${TIPOS_GASTO.join(", ")}.`
        }),

    fecha_desde: fechaSchema
        .optional()
        .messages({
            "date.base": "La fecha inicial no es válida.",
            "date.format": "La fecha inicial debe tener un formato válido."
        }),

    fecha_hasta: fechaSchema
        .optional()
        .messages({
            "date.base": "La fecha final no es válida.",
            "date.format": "La fecha final debe tener un formato válido."
        }),

    buscar: Joi.string()
        .trim()
        .max(150)
        .allow("")
        .optional()
        .messages({
            "string.max": "El término de búsqueda no puede superar los 150 caracteres."
        }),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            "number.base": "La página debe ser un número.",
            "number.integer": "La página debe ser un número entero.",
            "number.min": "La página debe ser mayor o igual a 1."
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            "number.base": "El límite debe ser un número.",
            "number.integer": "El límite debe ser un número entero.",
            "number.min": "El límite debe ser mayor o igual a 1.",
            "number.max": "El límite máximo permitido es 100."
        })

})
    .custom((value, helpers) => {

        if (
            value.fecha_desde &&
            value.fecha_hasta
        ) {
            const desde = new Date(
                value.fecha_desde
            );

            const hasta = new Date(
                value.fecha_hasta
            );

            if (hasta < desde) {
                return helpers.message({
                    custom:
                        "La fecha final no puede ser menor que la fecha inicial."
                });
            }
        }

        return value;
    })
    .options({
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

/* =====================================================
   REPORTE POR OBRA
===================================================== */

const reporteGastosObraSchema = Joi.object({

    obra_id: uuidSchema
        .required()
        .messages({
            "any.required": "La obra es obligatoria.",
            "string.empty": "La obra es obligatoria.",
            "string.guid": "El identificador de la obra no es válido."
        }),

    fecha_desde: fechaSchema
        .optional()
        .messages({
            "date.base": "La fecha inicial no es válida.",
            "date.format": "La fecha inicial debe tener un formato válido."
        }),

    fecha_hasta: fechaSchema
        .optional()
        .messages({
            "date.base": "La fecha final no es válida.",
            "date.format": "La fecha final debe tener un formato válido."
        })

})
    .custom((value, helpers) => {

        if (
            value.fecha_desde &&
            value.fecha_hasta
        ) {
            const desde = new Date(
                value.fecha_desde
            );

            const hasta = new Date(
                value.fecha_hasta
            );

            if (hasta < desde) {
                return helpers.message({
                    custom:
                        "La fecha final no puede ser menor que la fecha inicial."
                });
            }
        }

        return value;
    })
    .options({
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

/* =====================================================
   RESUMEN POR OBRA
===================================================== */

const resumenGastosObraSchema = Joi.object({

    obra_id: uuidSchema
        .optional()
        .messages({
            "string.guid": "El identificador de la obra no es válido."
        }),

    fecha_desde: fechaSchema
        .optional()
        .messages({
            "date.base": "La fecha inicial no es válida."
        }),

    fecha_hasta: fechaSchema
        .optional()
        .messages({
            "date.base": "La fecha final no es válida."
        })

})
    .custom((value, helpers) => {

        if (
            value.fecha_desde &&
            value.fecha_hasta
        ) {
            const desde = new Date(
                value.fecha_desde
            );

            const hasta = new Date(
                value.fecha_hasta
            );

            if (hasta < desde) {
                return helpers.message({
                    custom:
                        "La fecha final no puede ser menor que la fecha inicial."
                });
            }
        }

        return value;
    })
    .options({
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {

    TIPOS_GASTO,

    ESTADOS_GASTO,

    METODOS_PAGO,

    crearGastoObraSchema,

    actualizarGastoObraSchema,

    confirmarGastoObraSchema,

    anularGastoObraSchema,

    gastoObraIdSchema,

    listarGastosObraSchema,

    reporteGastosObraSchema,

    resumenGastosObraSchema
};