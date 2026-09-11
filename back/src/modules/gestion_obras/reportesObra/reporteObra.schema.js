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

const ESTADOS_GASTO = [
    "pendiente",
    "pagado",
    "anulado"
];

const TIPOS_TRANSACCION = [
    "ingreso",
    "egreso",
    "transferencia"
];

const AGRUPACIONES = [
    "dia",
    "semana",
    "mes"
];

/* =====================================================
   CONFIGURACIÓN JOI
===================================================== */

const OPCIONES_COMUNES = {
    abortEarly: false,
    stripUnknown: true,
    convert: true
};

/* =====================================================
   HELPERS
===================================================== */

const uuidSchema = Joi.string()
    .uuid({
        version: [
            "uuidv4"
        ]
    });

const fechaSchema = Joi.date()
    .iso()
    .messages({
        "date.base":
            "La fecha debe ser válida",
        "date.format":
            "La fecha debe tener formato ISO YYYY-MM-DD"
    });

const validarRangoFechas = (
    value,
    helpers
) => {
    if (
        value.fecha_desde &&
        value.fecha_hasta
    ) {
        const desde =
            new Date(
                value.fecha_desde
            );

        const hasta =
            new Date(
                value.fecha_hasta
            );

        if (
            hasta < desde
        ) {
            return helpers.error(
                "any.invalid",
                {
                    message:
                        "La fecha hasta no puede ser menor que la fecha desde"
                }
            );
        }
    }

    return value;
};

/* =====================================================
   PARAM :obra_id
===================================================== */

const obraIdSchema =
    Joi.object({
        obra_id:
            uuidSchema
                .required()
                .messages({
                    "any.required":
                        "El ID de la obra es obligatorio",
                    "string.guid":
                        "El ID de la obra debe ser un UUID válido"
                })
    });

/* =====================================================
   RESUMEN GENERAL
===================================================== */

const resumenGeneralSchema =
    Joi.object({
        estado:
            Joi.string()
                .valid(
                    ...ESTADOS_OBRA
                )
                .optional()
                .messages({
                    "any.only":
                        `El estado debe ser uno de: ${ESTADOS_OBRA.join(", ")}`
                }),

        fecha_desde:
            fechaSchema
                .optional(),

        fecha_hasta:
            fechaSchema
                .optional(),

        buscar:
            Joi.string()
                .trim()
                .min(1)
                .max(150)
                .optional()
                .messages({
                    "string.min":
                        "El término de búsqueda debe tener al menos 1 carácter",
                    "string.max":
                        "El término de búsqueda no puede superar los 150 caracteres"
                }),

        page:
            Joi.number()
                .integer()
                .min(1)
                .default(1)
                .messages({
                    "number.base":
                        "La página debe ser un número",
                    "number.integer":
                        "La página debe ser un número entero",
                    "number.min":
                        "La página debe ser mayor o igual a 1"
                }),

        limit:
            Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(10)
                .messages({
                    "number.base":
                        "El límite debe ser un número",
                    "number.integer":
                        "El límite debe ser un número entero",
                    "number.min":
                        "El límite debe ser mayor o igual a 1",
                    "number.max":
                        "El límite máximo permitido es 100"
                })
    })
        .custom(
            validarRangoFechas
        );

/* =====================================================
   REPORTE INDIVIDUAL DE OBRA
===================================================== */

const reporteObraSchema =
    Joi.object({
        fecha_desde:
            fechaSchema
                .optional(),

        fecha_hasta:
            fechaSchema
                .optional(),

        incluir_gastos:
            Joi.boolean()
                .truthy("true")
                .falsy("false")
                .default(true),

        incluir_personal:
            Joi.boolean()
                .truthy("true")
                .falsy("false")
                .default(true),

        incluir_controles:
            Joi.boolean()
                .truthy("true")
                .falsy("false")
                .default(true),

        incluir_finanzas:
            Joi.boolean()
                .truthy("true")
                .falsy("false")
                .default(true)
    })
        .custom(
            validarRangoFechas
        );

/* =====================================================
   GASTOS POR OBRA
===================================================== */

const gastosObraSchema =
    Joi.object({
        estado:
            Joi.string()
                .valid(
                    ...ESTADOS_GASTO
                )
                .optional()
                .messages({
                    "any.only":
                        `El estado del gasto debe ser uno de: ${ESTADOS_GASTO.join(", ")}`
                }),

        tipo:
            Joi.string()
                .trim()
                .max(50)
                .optional()
                .messages({
                    "string.max":
                        "El tipo de gasto no puede superar los 50 caracteres"
                }),

        fecha_desde:
            fechaSchema
                .optional(),

        fecha_hasta:
            fechaSchema
                .optional(),

        buscar:
            Joi.string()
                .trim()
                .min(1)
                .max(150)
                .optional(),

        page:
            Joi.number()
                .integer()
                .min(1)
                .default(1),

        limit:
            Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(20)
    })
        .custom(
            validarRangoFechas
        );

/* =====================================================
   PERSONAL POR OBRA
===================================================== */

const personalObraSchema =
    Joi.object({
        activo:
            Joi.boolean()
                .truthy("true")
                .falsy("false")
                .optional(),

        fecha_desde:
            fechaSchema
                .optional(),

        fecha_hasta:
            fechaSchema
                .optional(),

        buscar:
            Joi.string()
                .trim()
                .min(1)
                .max(150)
                .optional(),

        page:
            Joi.number()
                .integer()
                .min(1)
                .default(1),

        limit:
            Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(20)
    })
        .custom(
            validarRangoFechas
        );

/* =====================================================
   CONTROLES DIARIOS POR OBRA
===================================================== */

const controlesObraSchema =
    Joi.object({
        fecha_desde:
            fechaSchema
                .optional(),

        fecha_hasta:
            fechaSchema
                .optional(),

        buscar:
            Joi.string()
                .trim()
                .min(1)
                .max(150)
                .optional(),

        page:
            Joi.number()
                .integer()
                .min(1)
                .default(1),

        limit:
            Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(20)
    })
        .custom(
            validarRangoFechas
        );

/* =====================================================
   FINANZAS POR OBRA
===================================================== */

const finanzasObraSchema =
    Joi.object({
        tipo:
            Joi.string()
                .valid(
                    ...TIPOS_TRANSACCION
                )
                .optional()
                .messages({
                    "any.only":
                        `El tipo de transacción debe ser uno de: ${TIPOS_TRANSACCION.join(", ")}`
                }),

        origen_modulo:
            Joi.string()
                .trim()
                .max(50)
                .optional()
                .messages({
                    "string.max":
                        "El origen del módulo no puede superar los 50 caracteres"
                }),

        fecha_desde:
            fechaSchema
                .optional(),

        fecha_hasta:
            fechaSchema
                .optional(),

        buscar:
            Joi.string()
                .trim()
                .min(1)
                .max(150)
                .optional(),

        page:
            Joi.number()
                .integer()
                .min(1)
                .default(1),

        limit:
            Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(20)
    })
        .custom(
            validarRangoFechas
        );

/* =====================================================
   EVOLUCIÓN DE COSTOS
===================================================== */

const evolucionCostosSchema =
    Joi.object({
        fecha_desde:
            fechaSchema
                .optional(),

        fecha_hasta:
            fechaSchema
                .optional(),

        agrupar_por:
            Joi.string()
                .valid(
                    ...AGRUPACIONES
                )
                .default("mes")
                .messages({
                    "any.only":
                        `La agrupación debe ser una de: ${AGRUPACIONES.join(", ")}`
                })
    })
        .custom(
            validarRangoFechas
        );

/* =====================================================
   PRESUPUESTO VS EJECUTADO
===================================================== */

const presupuestoObraSchema =
    Joi.object({
        fecha_desde:
            fechaSchema
                .optional(),

        fecha_hasta:
            fechaSchema
                .optional(),

        incluir_pendientes:
            Joi.boolean()
                .truthy("true")
                .falsy("false")
                .default(true)
    })
        .custom(
            validarRangoFechas
        );

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    OPCIONES_COMUNES,

    ESTADOS_OBRA,
    ESTADOS_GASTO,
    TIPOS_TRANSACCION,
    AGRUPACIONES,

    obraIdSchema,

    resumenGeneralSchema,

    reporteObraSchema,

    gastosObraSchema,

    personalObraSchema,

    controlesObraSchema,

    finanzasObraSchema,

    evolucionCostosSchema,

    presupuestoObraSchema
};