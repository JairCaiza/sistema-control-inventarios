const Joi = require("joi");

/* =====================================================
   CONSTANTES
===================================================== */

const TIPOS_PAGO = [
    "diario",
    "semanal",
    "quincenal",
    "mensual",
    "otro"
];

const ESTADOS_PAGO = [
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
    .guid({
        version: [
            "uuidv4",
            "uuidv5"
        ]
    });

const fechaSchema = Joi.date()
    .iso();

const montoSchema = Joi.number()
    .precision(2)
    .positive()
    .max(9999999999.99);

const textoOpcional = (max) =>
    Joi.string()
        .trim()
        .max(max)
        .allow(
            null,
            ""
        );

/* =====================================================
   VALIDAR PERÍODO
===================================================== */

const validarPeriodoPago = (
    value,
    helpers,
    {
        permitirAusenciaTotal = false
    } = {}
) => {
    const {
        tipo_pago,
        fecha_inicio_periodo,
        fecha_fin_periodo
    } = value;

    const tiposConPeriodoObligatorio = [
        "diario",
        "semanal",
        "quincenal",
        "mensual"
    ];

    const requierePeriodo =
        tiposConPeriodoObligatorio.includes(
            tipo_pago
        );

    /*
     * Para tipos normales:
     * ambas fechas son obligatorias.
     */
    if (
        requierePeriodo &&
        !permitirAusenciaTotal
    ) {
        if (
            !fecha_inicio_periodo ||
            !fecha_fin_periodo
        ) {
            return helpers.error(
                "any.custom",
                {
                    message:
                        "Debe indicar la fecha de inicio y la fecha de fin del período para este tipo de pago."
                }
            );
        }
    }

    /*
     * Si solo llegó una de las dos fechas,
     * siempre es inválido.
     */
    if (
        (
            fecha_inicio_periodo &&
            !fecha_fin_periodo
        ) ||
        (
            !fecha_inicio_periodo &&
            fecha_fin_periodo
        )
    ) {
        return helpers.error(
            "any.custom",
            {
                message:
                    "Debe indicar tanto la fecha de inicio como la fecha de fin del período."
            }
        );
    }

    /*
     * Si no hay ninguna fecha y se permite
     * ausencia total, dejamos continuar.
     */
    if (
        !fecha_inicio_periodo &&
        !fecha_fin_periodo
    ) {
        return value;
    }

    const inicio =
        new Date(
            fecha_inicio_periodo
        );

    const fin =
        new Date(
            fecha_fin_periodo
        );

    if (
        Number.isNaN(
            inicio.getTime()
        ) ||
        Number.isNaN(
            fin.getTime()
        )
    ) {
        return helpers.error(
            "any.custom",
            {
                message:
                    "Las fechas del período no son válidas."
            }
        );
    }

    if (
        fin < inicio
    ) {
        return helpers.error(
            "any.custom",
            {
                message:
                    "La fecha de fin del período no puede ser anterior a la fecha de inicio."
            }
        );
    }

    /*
     * Pago diario:
     * inicio y fin deben representar
     * exactamente el mismo día.
     */
    if (
        tipo_pago === "diario"
    ) {
        const inicioISO =
            inicio
                .toISOString()
                .split("T")[0];

        const finISO =
            fin
                .toISOString()
                .split("T")[0];

        if (
            inicioISO !==
            finISO
        ) {
            return helpers.error(
                "any.custom",
                {
                    message:
                        "Un pago diario debe corresponder a un solo día. La fecha de inicio y fin deben ser iguales."
                }
            );
        }
    }

    return value;
};

/* =====================================================
   CREAR PAGO
===================================================== */

const crearPagoEmpleadoSchema = Joi.object({
    empleado_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "El empleado es obligatorio.",

            "string.guid":
                "El empleado seleccionado no es válido."
        }),

    obra_id: uuidSchema
        .allow(null)
        .optional()
        .messages({
            "string.guid":
                "La obra seleccionada no es válida."
        }),

    asignacion_id: uuidSchema
        .allow(null)
        .optional()
        .messages({
            "string.guid":
                "La asignación seleccionada no es válida."
        }),

    tipo_pago: Joi.string()
        .valid(
            ...TIPOS_PAGO
        )
        .required()
        .messages({
            "any.required":
                "El tipo de pago es obligatorio.",

            "any.only":
                "El tipo de pago debe ser diario, semanal, quincenal, mensual u otro."
        }),

    periodo_descripcion:
        Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required()
            .messages({
                "any.required":
                    "La descripción del período es obligatoria.",

                "string.empty":
                    "La descripción del período no puede estar vacía.",

                "string.min":
                    "La descripción del período debe tener al menos 2 caracteres.",

                "string.max":
                    "La descripción del período no puede superar los 100 caracteres."
            }),

    fecha_inicio_periodo:
        fechaSchema
            .allow(null)
            .optional()
            .messages({
                "date.format":
                    "La fecha de inicio del período no es válida."
            }),

    fecha_fin_periodo:
        fechaSchema
            .allow(null)
            .optional()
            .messages({
                "date.format":
                    "La fecha de fin del período no es válida."
            }),

    monto: montoSchema
        .required()
        .messages({
            "any.required":
                "El monto del pago es obligatorio.",

            "number.base":
                "El monto debe ser numérico.",

            "number.positive":
                "El monto debe ser mayor a cero.",

            "number.max":
                "El monto supera el valor máximo permitido."
        }),

    referencia:
        textoOpcional(
            100
        ),

    observaciones:
        textoOpcional(
            1000
        )
})
    .custom(
        (
            value,
            helpers
        ) => {
            const {
                obra_id,
                asignacion_id
            } = value;

            /* =========================================
               VALIDAR PERÍODO
            ========================================= */

            const periodoValidado =
                validarPeriodoPago(
                    value,
                    helpers
                );

            if (
                periodoValidado &&
                periodoValidado.code
            ) {
                return periodoValidado;
            }

            /* =========================================
               ASIGNACIÓN REQUIERE OBRA
            ========================================= */

            if (
                asignacion_id &&
                !obra_id
            ) {
                return helpers.error(
                    "any.custom",
                    {
                        message:
                            "No puede registrar una asignación sin indicar la obra."
                    }
                );
            }

            return value;
        }
    )
    .messages({
        "any.custom":
            "{{#message}}"
    });

/* =====================================================
   ACTUALIZAR PAGO PENDIENTE
===================================================== */

const actualizarPagoEmpleadoSchema = Joi.object({
    empleado_id: uuidSchema
        .optional()
        .messages({
            "string.guid":
                "El empleado seleccionado no es válido."
        }),

    obra_id: uuidSchema
        .allow(null)
        .optional()
        .messages({
            "string.guid":
                "La obra seleccionada no es válida."
        }),

    asignacion_id: uuidSchema
        .allow(null)
        .optional()
        .messages({
            "string.guid":
                "La asignación seleccionada no es válida."
        }),

    tipo_pago: Joi.string()
        .valid(
            ...TIPOS_PAGO
        )
        .optional()
        .messages({
            "any.only":
                "El tipo de pago debe ser diario, semanal, quincenal, mensual u otro."
        }),

    periodo_descripcion:
        Joi.string()
            .trim()
            .min(2)
            .max(100)
            .optional()
            .messages({
                "string.empty":
                    "La descripción del período no puede estar vacía.",

                "string.min":
                    "La descripción del período debe tener al menos 2 caracteres.",

                "string.max":
                    "La descripción del período no puede superar los 100 caracteres."
            }),

    fecha_inicio_periodo:
        fechaSchema
            .allow(null)
            .optional()
            .messages({
                "date.format":
                    "La fecha de inicio del período no es válida."
            }),

    fecha_fin_periodo:
        fechaSchema
            .allow(null)
            .optional()
            .messages({
                "date.format":
                    "La fecha de fin del período no es válida."
            }),

    monto: montoSchema
        .optional()
        .messages({
            "number.base":
                "El monto debe ser numérico.",

            "number.positive":
                "El monto debe ser mayor a cero.",

            "number.max":
                "El monto supera el valor máximo permitido."
        }),

    referencia:
        textoOpcional(
            100
        ),

    observaciones:
        textoOpcional(
            1000
        )
})
    .min(1)
    .custom(
        (
            value,
            helpers
        ) => {
            const {
                fecha_inicio_periodo,
                fecha_fin_periodo,
                obra_id,
                asignacion_id
            } = value;

            /*
             * En actualización no siempre vienen
             * todos los campos porque es PATCH/PUT
             * parcial desde la lógica actual.
             *
             * Por eso solo validamos aquí las fechas
             * si están presentes en el payload.
             *
             * La validación definitiva del período
             * completo también se realiza en service.js
             * después de combinar datos viejos + nuevos.
             */
            if (
                (
                    fecha_inicio_periodo &&
                    !fecha_fin_periodo
                ) ||
                (
                    !fecha_inicio_periodo &&
                    fecha_fin_periodo
                )
            ) {
                /*
                 * No rechazamos cuando simplemente una
                 * fecha no vino en el payload.
                 *
                 * Solo rechazamos cuando explícitamente
                 * se intenta mandar una fecha y la otra
                 * como null.
                 */
                const tieneInicio =
                    Object.prototype
                        .hasOwnProperty.call(
                            value,
                            "fecha_inicio_periodo"
                        );

                const tieneFin =
                    Object.prototype
                        .hasOwnProperty.call(
                            value,
                            "fecha_fin_periodo"
                        );

                if (
                    tieneInicio &&
                    tieneFin
                ) {
                    return helpers.error(
                        "any.custom",
                        {
                            message:
                                "Debe indicar tanto la fecha de inicio como la fecha de fin del período."
                        }
                    );
                }
            }

            if (
                fecha_inicio_periodo &&
                fecha_fin_periodo
            ) {
                const inicio =
                    new Date(
                        fecha_inicio_periodo
                    );

                const fin =
                    new Date(
                        fecha_fin_periodo
                    );

                if (
                    fin < inicio
                ) {
                    return helpers.error(
                        "any.custom",
                        {
                            message:
                                "La fecha de fin del período no puede ser anterior a la fecha de inicio."
                        }
                    );
                }

                if (
                    value.tipo_pago ===
                    "diario"
                ) {
                    const inicioISO =
                        inicio
                            .toISOString()
                            .split("T")[0];

                    const finISO =
                        fin
                            .toISOString()
                            .split("T")[0];

                    if (
                        inicioISO !==
                        finISO
                    ) {
                        return helpers.error(
                            "any.custom",
                            {
                                message:
                                    "Un pago diario debe corresponder a un solo día."
                            }
                        );
                    }
                }
            }

            /*
             * Si explícitamente se elimina la obra,
             * no puede quedar una asignación.
             */
            if (
                asignacion_id &&
                obra_id === null
            ) {
                return helpers.error(
                    "any.custom",
                    {
                        message:
                            "No puede mantener una asignación si la obra fue eliminada del pago."
                    }
                );
            }

            return value;
        }
    )
    .messages({
        "object.min":
            "Debe enviar al menos un campo para actualizar.",

        "any.custom":
            "{{#message}}"
    });

/* =====================================================
   CONFIRMAR PAGO
===================================================== */

const confirmarPagoEmpleadoSchema = Joi.object({
    cuenta_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "La cuenta financiera es obligatoria para confirmar el pago.",

            "string.guid":
                "La cuenta financiera seleccionada no es válida."
        }),

    fecha_pago: fechaSchema
        .required()
        .messages({
            "any.required":
                "La fecha de pago es obligatoria.",

            "date.format":
                "La fecha de pago no es válida."
        }),

    metodo_pago: Joi.string()
        .valid(
            ...METODOS_PAGO
        )
        .required()
        .messages({
            "any.required":
                "El método de pago es obligatorio.",

            "any.only":
                "El método de pago debe ser efectivo, transferencia, depósito o cheque."
        }),

    referencia:
        textoOpcional(
            100
        ),

    observaciones:
        textoOpcional(
            1000
        )
});

/* =====================================================
   ANULAR PAGO
===================================================== */

const anularPagoEmpleadoSchema = Joi.object({
    motivo: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required()
        .messages({
            "any.required":
                "El motivo de anulación es obligatorio.",

            "string.empty":
                "El motivo de anulación no puede estar vacío.",

            "string.min":
                "El motivo de anulación debe tener al menos 3 caracteres.",

            "string.max":
                "El motivo de anulación no puede superar los 500 caracteres."
        })
});

/* =====================================================
   ID PARAM
===================================================== */

const pagoEmpleadoIdSchema = Joi.object({
    id: uuidSchema
        .required()
        .messages({
            "any.required":
                "El identificador del pago es obligatorio.",

            "string.guid":
                "El identificador del pago no es válido."
        })
});

/* =====================================================
   FILTROS DE LISTADO
===================================================== */

const listarPagosEmpleadoSchema = Joi.object({
    empleado_id: uuidSchema
        .optional()
        .messages({
            "string.guid":
                "El identificador del empleado no es válido."
        }),

    obra_id: uuidSchema
        .optional()
        .messages({
            "string.guid":
                "El identificador de la obra no es válido."
        }),

    cuenta_id: uuidSchema
        .optional()
        .messages({
            "string.guid":
                "El identificador de la cuenta no es válido."
        }),

    estado: Joi.string()
        .valid(
            ...ESTADOS_PAGO
        )
        .optional()
        .messages({
            "any.only":
                "El estado debe ser pendiente, pagado o anulado."
        }),

    tipo_pago: Joi.string()
        .valid(
            ...TIPOS_PAGO
        )
        .optional()
        .messages({
            "any.only":
                "El tipo de pago no es válido."
        }),

    fecha_desde: fechaSchema
        .optional()
        .messages({
            "date.format":
                "La fecha inicial del filtro no es válida."
        }),

    fecha_hasta: fechaSchema
        .optional()
        .messages({
            "date.format":
                "La fecha final del filtro no es válida."
        }),

    buscar: Joi.string()
        .trim()
        .max(150)
        .allow("")
        .optional(),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
})
    .custom(
        (
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
                        "any.custom",
                        {
                            message:
                                "La fecha hasta no puede ser anterior a la fecha desde."
                        }
                    );
                }
            }

            return value;
        }
    )
    .messages({
        "any.custom":
            "{{#message}}"
    });

/* =====================================================
   REPORTE POR EMPLEADO
===================================================== */

const reporteEmpleadoSchema = Joi.object({
    empleado_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "El empleado es obligatorio.",

            "string.guid":
                "El identificador del empleado no es válido."
        }),

    fecha_desde: fechaSchema
        .optional(),

    fecha_hasta: fechaSchema
        .optional(),

    estado: Joi.string()
        .valid(
            ...ESTADOS_PAGO
        )
        .optional()
})
    .custom(
        (
            value,
            helpers
        ) => {
            if (
                value.fecha_desde &&
                value.fecha_hasta &&
                new Date(
                    value.fecha_hasta
                ) <
                new Date(
                    value.fecha_desde
                )
            ) {
                return helpers.error(
                    "any.custom",
                    {
                        message:
                            "La fecha hasta no puede ser anterior a la fecha desde."
                    }
                );
            }

            return value;
        }
    )
    .messages({
        "any.custom":
            "{{#message}}"
    });

/* =====================================================
   REPORTE POR OBRA
===================================================== */

const reporteObraSchema = Joi.object({
    obra_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "La obra es obligatoria.",

            "string.guid":
                "El identificador de la obra no es válido."
        }),

    fecha_desde: fechaSchema
        .optional(),

    fecha_hasta: fechaSchema
        .optional(),

    estado: Joi.string()
        .valid(
            ...ESTADOS_PAGO
        )
        .optional()
})
    .custom(
        (
            value,
            helpers
        ) => {
            if (
                value.fecha_desde &&
                value.fecha_hasta &&
                new Date(
                    value.fecha_hasta
                ) <
                new Date(
                    value.fecha_desde
                )
            ) {
                return helpers.error(
                    "any.custom",
                    {
                        message:
                            "La fecha hasta no puede ser anterior a la fecha desde."
                    }
                );
            }

            return value;
        }
    )
    .messages({
        "any.custom":
            "{{#message}}"
    });

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    TIPOS_PAGO,
    ESTADOS_PAGO,
    METODOS_PAGO,

    crearPagoEmpleadoSchema,
    actualizarPagoEmpleadoSchema,
    confirmarPagoEmpleadoSchema,
    anularPagoEmpleadoSchema,
    pagoEmpleadoIdSchema,
    listarPagosEmpleadoSchema,
    reporteEmpleadoSchema,
    reporteObraSchema
};