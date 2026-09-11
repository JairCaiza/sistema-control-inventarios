const express = require("express");

const {
    registrarEntradaSchema,
    registrarSalidaSchema,
    registrarNovedadSchema,
    corregirMarcacionSchema,
    actualizarAsistenciaSchema,
    registrarMarcacionIntegracionSchema,
    filtrosAsistenciaSchema,
    reporteSemanalSchema,
    reportePeriodoSchema,
    idParamSchema
} = require("./asistencia.schema");

const {
    entrada,
    salida,
    novedad,
    marcacionIntegracion,
    listar,
    obtenerPorId,
    actualizar,
    corregirMarcacion,
    reporteSemanal,
    reportePeriodo
} = require("./asistencia.controller");

const protect =
    require("../../../middlewares/auth.middleware");

const authorizeRoles =
    require("../../../middlewares/role.middleware");


const router = express.Router();


/* =====================================================
   MIDDLEWARE DE VALIDACIÓN
===================================================== */

/*
 * Se mantiene dentro de este archivo para que
 * el módulo de asistencia no dependa de un
 * validador externo que quizá no exista.
 *
 * Joi devuelve los valores normalizados y
 * esos valores reemplazan req.body,
 * req.query o req.params.
 */

const validarBody = (schema) => {
    return (
        req,
        res,
        next
    ) => {
        const {
            error,
            value
        } = schema.validate(
            req.body,
            {
                abortEarly: false,
                stripUnknown: false
            }
        );

        if (error) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message:
                        "Los datos enviados no son válidos.",
                    codigo:
                        "VALIDACION_BODY",
                    errores:
                        error.details.map(
                            (detalle) => ({
                                campo:
                                    detalle.path.join(
                                        "."
                                    ),
                                mensaje:
                                    detalle.message
                            })
                        )
                });
        }

        req.body = value;

        return next();
    };
};


const validarQuery = (schema) => {
    return (
        req,
        res,
        next
    ) => {
        const {
            error,
            value
        } = schema.validate(
            req.query,
            {
                abortEarly: false,
                stripUnknown: false
            }
        );

        if (error) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message:
                        "Los filtros enviados no son válidos.",
                    codigo:
                        "VALIDACION_QUERY",
                    errores:
                        error.details.map(
                            (detalle) => ({
                                campo:
                                    detalle.path.join(
                                        "."
                                    ),
                                mensaje:
                                    detalle.message
                            })
                        )
                });
        }

        req.query = value;

        return next();
    };
};


const validarParams = (schema) => {
    return (
        req,
        res,
        next
    ) => {
        const {
            error,
            value
        } = schema.validate(
            req.params,
            {
                abortEarly: false,
                stripUnknown: false
            }
        );

        if (error) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message:
                        "El identificador proporcionado no es válido.",
                    codigo:
                        "VALIDACION_PARAMETROS",
                    errores:
                        error.details.map(
                            (detalle) => ({
                                campo:
                                    detalle.path.join(
                                        "."
                                    ),
                                mensaje:
                                    detalle.message
                            })
                        )
                });
        }

        req.params = value;

        return next();
    };
};


/* =====================================================
   PROTECCIÓN GENERAL DEL MÓDULO
===================================================== */

/*
 * Todas las rutas requieren autenticación.
 *
 * No dejamos ninguna ruta de asistencia
 * accesible públicamente.
 */

router.use(protect);


/* =====================================================
   REGISTRAR ENTRADA
===================================================== */

/*
POST /api/asistencias/entrada

Administrador
Operador
*/

router.post(
    "/entrada",

    authorizeRoles(
        "Administrador",
        "Operador"
    ),

    validarBody(
        registrarEntradaSchema
    ),

    entrada
);


/* =====================================================
   REGISTRAR SALIDA
===================================================== */

/*
POST /api/asistencias/salida
*/

router.post(
    "/salida",

    authorizeRoles(
        "Administrador",
        "Operador"
    ),

    validarBody(
        registrarSalidaSchema
    ),

    salida
);


/* =====================================================
   REGISTRAR NOVEDAD
===================================================== */

/*
POST /api/asistencias/novedad

Ejemplos:
- ausente
- permiso
- justificado
- atraso
*/

router.post(
    "/novedad",

    authorizeRoles(
        "Administrador",
        "Operador"
    ),

    validarBody(
        registrarNovedadSchema
    ),

    novedad
);


/* =====================================================
   INTEGRACIÓN BIOMÉTRICA / SISTEMA
===================================================== */

/*
POST /api/asistencias/integracion

IMPORTANTE:

Esta ruta queda preparada para el futuro.

Por ahora solamente el Administrador puede
utilizarla con un JWT válido.

Cuando tengan el dispositivo biométrico real,
podremos implementar autenticación técnica
específica mediante:

- API Key
- token del dispositivo
- firma HMAC
- servicio interno
- IP autorizada

No se deja pública.
*/

router.post(
    "/integracion",

    authorizeRoles(
        "Administrador"
    ),

    validarBody(
        registrarMarcacionIntegracionSchema
    ),

    marcacionIntegracion
);


/* =====================================================
   REPORTE SEMANAL
===================================================== */

/*
GET /api/asistencias/reportes/semanal

Ejemplo:

?empleado_id=UUID
&obra_id=UUID
&fecha_inicio=2026-09-07
&fecha_fin=2026-09-13
*/

router.get(
    "/reportes/semanal",

    authorizeRoles(
        "Administrador",
        "Operador"
    ),

    validarQuery(
        reporteSemanalSchema
    ),

    reporteSemanal
);


/* =====================================================
   REPORTE POR PERÍODO
===================================================== */

/*
GET /api/asistencias/reportes/periodo

Ejemplo:

?fecha_desde=2026-09-01
&fecha_hasta=2026-09-30
*/

router.get(
    "/reportes/periodo",

    authorizeRoles(
        "Administrador",
        "Operador"
    ),

    validarQuery(
        reportePeriodoSchema
    ),

    reportePeriodo
);


/* =====================================================
   CORREGIR MARCACIÓN
===================================================== */

/*
PATCH /api/asistencias/marcaciones/:id

Ejemplo:

{
    "fecha_hora": "2026-09-11T17:30:00",
    "motivo": "El empleado olvidó registrar correctamente la salida"
}

Solo Administrador.

Una corrección queda registrada en
registros_auditoria.
*/

router.patch(
    "/marcaciones/:id",

    authorizeRoles(
        "Administrador"
    ),

    validarParams(
        idParamSchema
    ),

    validarBody(
        corregirMarcacionSchema
    ),

    corregirMarcacion
);


/* =====================================================
   LISTAR ASISTENCIAS
===================================================== */

/*
GET /api/asistencias

Ejemplos:

/api/asistencias

/api/asistencias?fecha=2026-09-11

/api/asistencias?obra_id=UUID

/api/asistencias?empleado_id=UUID

/api/asistencias?estado=presente

/api/asistencias
    ?fecha_desde=2026-09-01
    &fecha_hasta=2026-09-30
*/

router.get(
    "/",

    authorizeRoles(
        "Administrador",
        "Operador"
    ),

    validarQuery(
        filtrosAsistenciaSchema
    ),

    listar
);


/* =====================================================
   OBTENER ASISTENCIA POR ID
===================================================== */

/*
GET /api/asistencias/:id
*/

router.get(
    "/:id",

    authorizeRoles(
        "Administrador",
        "Operador"
    ),

    validarParams(
        idParamSchema
    ),

    obtenerPorId
);


/* =====================================================
   CORREGIR ASISTENCIA
===================================================== */

/*
PATCH /api/asistencias/:id

Permite modificar:

- estado
- observaciones

Ejemplo:

{
    "estado": "justificado",
    "observaciones": "Certificado presentado",
    "motivo": "Se recibió justificativo posteriormente"
}

Solo Administrador porque altera
información histórica de asistencia.
*/

router.patch(
    "/:id",

    authorizeRoles(
        "Administrador"
    ),

    validarParams(
        idParamSchema
    ),

    validarBody(
        actualizarAsistenciaSchema
    ),

    actualizar
);


/* =====================================================
   EXPORTAR ROUTER
===================================================== */

module.exports = router;