const Joi = require("joi");

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADOS_ASISTENCIA = [
    "presente",
    "atraso",
    "ausente",
    "permiso",
    "justificado"
];

const TIPOS_MARCACION = [
    "entrada",
    "salida"
];

const ORIGENES_REGISTRO = [
    "manual",
    "biometrico",
    "sistema"
];


/* =====================================================
   VALIDACIONES REUTILIZABLES
===================================================== */

const uuidSchema = Joi.string()
    .uuid()
    .messages({
        "string.empty":
            "El identificador no puede estar vacío.",
        "string.guid":
            "El identificador proporcionado no es válido."
    });


const fechaSchema = Joi.date()
    .iso()
    .messages({
        "date.base":
            "La fecha proporcionada no es válida.",
        "date.format":
            "La fecha debe tener un formato válido."
    });


const fechaHoraSchema = Joi.date()
    .iso()
    .messages({
        "date.base":
            "La fecha y hora proporcionadas no son válidas.",
        "date.format":
            "La fecha y hora deben tener formato ISO válido."
    });


/* =====================================================
   REGISTRAR ENTRADA
===================================================== */

/*
Ejemplo:

{
    "empleado_id": "uuid",
    "obra_id": "uuid",
    "fecha_hora": "2026-09-11T07:58:00",
    "observaciones": "Ingreso normal"
}

IMPORTANTE:
- asignacion_id NO viene obligatoriamente del frontend.
- El backend debe localizar la asignación activa.
- asistencia_id tampoco viene del frontend.
- El backend crea o localiza la asistencia del día.
*/

const registrarEntradaSchema = Joi.object({

    empleado_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "El empleado es obligatorio."
        }),

    obra_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "La obra es obligatoria."
        }),

    fecha_hora: fechaHoraSchema
        .required()
        .messages({
            "any.required":
                "La fecha y hora de entrada son obligatorias."
        }),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 500 caracteres."
        })

})
    .unknown(false);


/* =====================================================
   REGISTRAR SALIDA
===================================================== */

/*
La salida utiliza empleado + obra.

El backend debe:

1. encontrar la asignación;
2. localizar la asistencia correspondiente;
3. verificar la última marcación;
4. comprobar que exista una entrada abierta;
5. registrar la salida.
*/

const registrarSalidaSchema = Joi.object({

    empleado_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "El empleado es obligatorio."
        }),

    obra_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "La obra es obligatoria."
        }),

    fecha_hora: fechaHoraSchema
        .required()
        .messages({
            "any.required":
                "La fecha y hora de salida son obligatorias."
        }),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 500 caracteres."
        })

})
    .unknown(false);


/* =====================================================
   REGISTRAR NOVEDAD DE ASISTENCIA
===================================================== */

/*
Se utiliza para:

- ausente
- permiso
- justificado

También soporta presente/atraso porque la BD los permite,
aunque normalmente presente y atraso se determinarán
mediante las marcaciones.

Ejemplo:

{
    "empleado_id": "uuid",
    "obra_id": "uuid",
    "fecha": "2026-09-11",
    "estado": "permiso",
    "observaciones": "Permiso autorizado"
}
*/

const registrarNovedadSchema = Joi.object({

    empleado_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "El empleado es obligatorio."
        }),

    obra_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "La obra es obligatoria."
        }),

    fecha: fechaSchema
        .required()
        .messages({
            "any.required":
                "La fecha de asistencia es obligatoria."
        }),

    estado: Joi.string()
        .valid(...ESTADOS_ASISTENCIA)
        .required()
        .messages({
            "any.only":
                "El estado debe ser presente, atraso, ausente, permiso o justificado.",
            "string.empty":
                "El estado es obligatorio.",
            "any.required":
                "El estado es obligatorio."
        }),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 500 caracteres."
        })

})
    .unknown(false);


/* =====================================================
   CORREGIR MARCACIÓN
===================================================== */

/*
Una marcación NO debe editarse silenciosamente.

Por eso obligamos a proporcionar un motivo.

Ejemplo:

{
    "fecha_hora": "2026-09-11T17:30:00",
    "tipo": "salida",
    "motivo": "El empleado olvidó registrar la salida"
}
*/

const corregirMarcacionSchema = Joi.object({

    fecha_hora: fechaHoraSchema
        .optional(),

    tipo: Joi.string()
        .valid(...TIPOS_MARCACION)
        .optional()
        .messages({
            "any.only":
                "El tipo de marcación debe ser entrada o salida."
        }),

    motivo: Joi.string()
        .trim()
        .min(5)
        .max(500)
        .required()
        .messages({
            "string.empty":
                "El motivo de la corrección es obligatorio.",
            "string.min":
                "El motivo debe tener al menos 5 caracteres.",
            "string.max":
                "El motivo no puede superar los 500 caracteres.",
            "any.required":
                "Debe indicar el motivo de la corrección."
        })

})
    .or(
        "fecha_hora",
        "tipo"
    )
    .unknown(false)
    .messages({
        "object.missing":
            "Debe modificar la fecha/hora, el tipo de marcación o ambos."
    });


/* =====================================================
   ACTUALIZAR NOVEDAD / ASISTENCIA
===================================================== */

/*
Permite corregir el estado u observaciones
de una asistencia.

Se exige motivo para mantener trazabilidad.

El backend posteriormente registrará el cambio
en registros_auditoria.
*/

const actualizarAsistenciaSchema = Joi.object({

    estado: Joi.string()
        .valid(...ESTADOS_ASISTENCIA)
        .optional()
        .messages({
            "any.only":
                "El estado debe ser presente, atraso, ausente, permiso o justificado."
        }),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
        .optional()
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 500 caracteres."
        }),

    motivo: Joi.string()
        .trim()
        .min(5)
        .max(500)
        .required()
        .messages({
            "string.empty":
                "El motivo de la modificación es obligatorio.",
            "string.min":
                "El motivo debe tener al menos 5 caracteres.",
            "string.max":
                "El motivo no puede superar los 500 caracteres.",
            "any.required":
                "Debe indicar el motivo de la modificación."
        })

})
    .or(
        "estado",
        "observaciones"
    )
    .unknown(false)
    .messages({
        "object.missing":
            "Debe modificar el estado, las observaciones o ambos."
    });


/* =====================================================
   REGISTRAR MARCACIÓN DE INTEGRACIÓN
   BIOMÉTRICA / SISTEMA
===================================================== */

/*
Este esquema queda preparado desde ahora.

NO será utilizado todavía por el frontend administrativo.

En el futuro un adaptador biométrico podrá enviar:

{
    "empleado_id": "uuid",
    "obra_id": "uuid",
    "fecha_hora": "2026-09-11T07:58:31",
    "tipo": "entrada",
    "origen_registro": "biometrico",
    "dispositivo_id": "BIO-OBRA-01",
    "referencia_externa": "DEVICE-123456"
}

La huella NO se almacena aquí.
*/

const registrarMarcacionIntegracionSchema = Joi.object({

    empleado_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "El empleado es obligatorio."
        }),

    obra_id: uuidSchema
        .required()
        .messages({
            "any.required":
                "La obra es obligatoria."
        }),

    fecha_hora: fechaHoraSchema
        .required()
        .messages({
            "any.required":
                "La fecha y hora de la marcación son obligatorias."
        }),

    tipo: Joi.string()
        .valid(...TIPOS_MARCACION)
        .required()
        .messages({
            "any.only":
                "El tipo de marcación debe ser entrada o salida.",
            "any.required":
                "El tipo de marcación es obligatorio."
        }),

    origen_registro: Joi.string()
        .valid(
            "biometrico",
            "sistema"
        )
        .required()
        .messages({
            "any.only":
                "El origen de integración debe ser biometrico o sistema.",
            "any.required":
                "El origen del registro es obligatorio."
        }),

    dispositivo_id: Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .messages({
            "string.max":
                "El identificador del dispositivo no puede superar los 100 caracteres."
        }),

    referencia_externa: Joi.string()
        .trim()
        .max(150)
        .allow("", null)
        .messages({
            "string.max":
                "La referencia externa no puede superar los 150 caracteres."
        }),

    observaciones: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
        .messages({
            "string.max":
                "Las observaciones no pueden superar los 500 caracteres."
        })

})
    .unknown(false);


/* =====================================================
   FILTROS LISTADO DE ASISTENCIAS
===================================================== */

/*
Ejemplos:

GET /api/asistencias?obra_id=...
GET /api/asistencias?empleado_id=...
GET /api/asistencias?fecha=2026-09-11
GET /api/asistencias?estado=presente

También pueden combinarse.
*/

const filtrosAsistenciaSchema = Joi.object({

    empleado_id: uuidSchema
        .optional(),

    obra_id: uuidSchema
        .optional(),

    asignacion_id: uuidSchema
        .optional(),

    fecha: fechaSchema
        .optional(),

    fecha_desde: fechaSchema
        .optional(),

    fecha_hasta: fechaSchema
        .optional(),

    estado: Joi.string()
        .valid(...ESTADOS_ASISTENCIA)
        .optional()
        .messages({
            "any.only":
                "El estado de asistencia no es válido."
        }),

    buscar: Joi.string()
        .trim()
        .max(150)
        .allow("")
        .optional()
        .messages({
            "string.max":
                "La búsqueda no puede superar los 150 caracteres."
        })

})
    .custom((value, helpers) => {

        if (
            value.fecha_desde &&
            value.fecha_hasta
        ) {
            const desde =
                new Date(value.fecha_desde);

            const hasta =
                new Date(value.fecha_hasta);

            if (desde > hasta) {
                return helpers.message({
                    custom:
                        "La fecha desde no puede ser posterior a la fecha hasta."
                });
            }
        }

        return value;
    })
    .unknown(false);


/* =====================================================
   FILTROS REPORTE SEMANAL
===================================================== */

/*
El backend puede obtener el periodo completo
a partir de fecha_inicio.

Pero permitimos fecha_inicio + fecha_fin para
mantener el reporte explícito y reutilizable.
*/

const reporteSemanalSchema = Joi.object({

    empleado_id: uuidSchema
        .optional(),

    obra_id: uuidSchema
        .optional(),

    fecha_inicio: fechaSchema
        .required()
        .messages({
            "any.required":
                "La fecha inicial del reporte es obligatoria."
        }),

    fecha_fin: fechaSchema
        .required()
        .messages({
            "any.required":
                "La fecha final del reporte es obligatoria."
        })

})
    .custom((value, helpers) => {

        const inicio =
            new Date(value.fecha_inicio);

        const fin =
            new Date(value.fecha_fin);

        if (inicio > fin) {
            return helpers.message({
                custom:
                    "La fecha inicial no puede ser posterior a la fecha final."
            });
        }

        const diferenciaMs =
            fin.getTime() -
            inicio.getTime();

        const diferenciaDias =
            Math.floor(
                diferenciaMs /
                (1000 * 60 * 60 * 24)
            );

        if (diferenciaDias > 6) {
            return helpers.message({
                custom:
                    "El reporte semanal no puede abarcar más de 7 días."
            });
        }

        return value;
    })
    .unknown(false);


/* =====================================================
   FILTROS REPORTE POR PERIODO
===================================================== */

/*
Será útil para:

- reporte mensual;
- reporte personalizado;
- futura integración con Reporte Personal.
*/

const reportePeriodoSchema = Joi.object({

    empleado_id: uuidSchema
        .optional(),

    obra_id: uuidSchema
        .optional(),

    fecha_desde: fechaSchema
        .required()
        .messages({
            "any.required":
                "La fecha inicial es obligatoria."
        }),

    fecha_hasta: fechaSchema
        .required()
        .messages({
            "any.required":
                "La fecha final es obligatoria."
        }),

    estado: Joi.string()
        .valid(...ESTADOS_ASISTENCIA)
        .optional()
        .messages({
            "any.only":
                "El estado de asistencia no es válido."
        })

})
    .custom((value, helpers) => {

        const desde =
            new Date(value.fecha_desde);

        const hasta =
            new Date(value.fecha_hasta);

        if (desde > hasta) {
            return helpers.message({
                custom:
                    "La fecha inicial no puede ser posterior a la fecha final."
            });
        }

        return value;
    })
    .unknown(false);


/* =====================================================
   VALIDAR ID EN PARÁMETROS
===================================================== */

/*
Para rutas como:

GET   /api/asistencias/:id
PUT   /api/asistencias/:id
PATCH /api/asistencias/marcaciones/:id
*/

const idParamSchema = Joi.object({

    id: uuidSchema
        .required()
        .messages({
            "any.required":
                "El identificador es obligatorio."
        })

})
    .unknown(false);


/* =====================================================
   VALIDAR EMPLEADO EN PARÁMETROS
===================================================== */

const empleadoParamSchema = Joi.object({

    empleadoId: uuidSchema
        .required()
        .messages({
            "any.required":
                "El identificador del empleado es obligatorio."
        })

})
    .unknown(false);


/* =====================================================
   VALIDAR OBRA EN PARÁMETROS
===================================================== */

const obraParamSchema = Joi.object({

    obraId: uuidSchema
        .required()
        .messages({
            "any.required":
                "El identificador de la obra es obligatorio."
        })

})
    .unknown(false);


/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {

    /* Constantes */
    ESTADOS_ASISTENCIA,
    TIPOS_MARCACION,
    ORIGENES_REGISTRO,

    /* Marcaciones manuales */
    registrarEntradaSchema,
    registrarSalidaSchema,

    /* Novedades */
    registrarNovedadSchema,

    /* Correcciones */
    corregirMarcacionSchema,
    actualizarAsistenciaSchema,

    /* Integración futura */
    registrarMarcacionIntegracionSchema,

    /* Consultas y reportes */
    filtrosAsistenciaSchema,
    reporteSemanalSchema,
    reportePeriodoSchema,

    /* Parámetros */
    idParamSchema,
    empleadoParamSchema,
    obraParamSchema
};