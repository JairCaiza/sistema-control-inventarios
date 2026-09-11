/* =====================================================
   SCHEMAS
===================================================== */

const {
    crearPagoEmpleadoSchema,
    actualizarPagoEmpleadoSchema,
    confirmarPagoEmpleadoSchema,
    anularPagoEmpleadoSchema,
    pagoEmpleadoIdSchema,
    listarPagosEmpleadoSchema,
    reporteEmpleadoSchema,
    reporteObraSchema
} = require("./pagoEmpleado.schema");

/* =====================================================
   SERVICES
===================================================== */

const {
    crearPagoEmpleado,
    listarPagosEmpleado,
    obtenerPagoEmpleadoPorId,
    actualizarPagoEmpleado,
    confirmarPagoEmpleado,
    anularPagoEmpleado,
    reportePagosPorEmpleado,
    reportePagosPorObra,
    obtenerResumenPagos,
    obtenerAsignacionesActivasPago,
    reporteGeneralPersonal
} = require("./pagoEmpleado.service");

/* =====================================================
   CONFIGURACIÓN DE VALIDACIÓN
===================================================== */

const OPCIONES_JOI = {
    abortEarly: false,
    stripUnknown: true,
    convert: true
};

/* =====================================================
   HELPER - FORMATEAR ERRORES JOI
===================================================== */

const formatearErroresJoi = (error) => {
    if (
        !error ||
        !Array.isArray(error.details)
    ) {
        return [];
    }

    return error.details.map(
        (detalle) => ({
            campo:
                detalle.path.length > 0
                    ? detalle.path.join(".")
                    : null,

            mensaje:
                detalle.message
        })
    );
};

/* =====================================================
   HELPER - RESPUESTA DE VALIDACIÓN
===================================================== */

const responderErrorValidacion = (
    res,
    error,
    mensaje =
        "Los datos enviados no son válidos."
) => {
    return res.status(400).json({
        success: false,
        message: mensaje,
        errors:
            formatearErroresJoi(
                error
            )
    });
};

/* =====================================================
   HELPER - MANEJO CENTRAL DE ERRORES
===================================================== */

const manejarError = (
    res,
    error,
    mensajeInterno =
        "Ocurrió un error interno en el servidor."
) => {

    /* =============================================
       ERROR DE NEGOCIO
    ============================================= */

    if (
        error &&
        Number.isInteger(
            error.statusCode
        )
    ) {
        return res
            .status(
                error.statusCode
            )
            .json({
                success: false,
                message:
                    error.message
            });
    }

    /* =============================================
       POSTGRESQL - FOREIGN KEY
    ============================================= */

    if (
        error?.code ===
        "23503"
    ) {
        return res
            .status(409)
            .json({
                success: false,

                message:
                    "No se pudo realizar la operación porque existe una relación inválida con otro registro."
            });
    }

    /* =============================================
       POSTGRESQL - UNIQUE
    ============================================= */

    if (
        error?.code ===
        "23505"
    ) {
        return res
            .status(409)
            .json({
                success: false,

                message:
                    "No se pudo realizar la operación porque existe un registro duplicado."
            });
    }

    /* =============================================
       POSTGRESQL - CHECK
    ============================================= */

    if (
        error?.code ===
        "23514"
    ) {
        return res
            .status(400)
            .json({
                success: false,

                message:
                    "Los datos enviados incumplen una regla de negocio de la base de datos."
            });
    }

    /* =============================================
       POSTGRESQL - NOT NULL
    ============================================= */

    if (
        error?.code ===
        "23502"
    ) {
        return res
            .status(400)
            .json({
                success: false,

                message:
                    "Falta información obligatoria para completar la operación."
            });
    }

    /* =============================================
       LOG INTERNO
    ============================================= */

    console.error(
        "ERROR PAGO EMPLEADO:",
        error
    );

    return res
        .status(500)
        .json({
            success: false,
            message:
                mensajeInterno
        });
};

/* =====================================================
   CREAR PAGO PENDIENTE
===================================================== */

const crear = async (
    req,
    res
) => {
    try {

        const {
            error,
            value
        } =
            crearPagoEmpleadoSchema
                .validate(
                    req.body,
                    OPCIONES_JOI
                );

        if (error) {
            return responderErrorValidacion(
                res,
                error,
                "No se pudo registrar el pago porque existen datos inválidos."
            );
        }

        const pago =
            await crearPagoEmpleado(
                value
            );

        return res
            .status(201)
            .json({
                success: true,

                message:
                    "Pago de empleado registrado correctamente como pendiente.",

                data:
                    pago
            });

    } catch (error) {

        return manejarError(
            res,
            error,
            "No se pudo registrar el pago del empleado."
        );
    }
};

/* =====================================================
   LISTAR PAGOS
===================================================== */

const listar = async (
    req,
    res
) => {
    try {

        const {
            error,
            value
        } =
            listarPagosEmpleadoSchema
                .validate(
                    req.query,
                    OPCIONES_JOI
                );

        if (error) {
            return responderErrorValidacion(
                res,
                error,
                "Los filtros enviados no son válidos."
            );
        }

        const resultado =
            await listarPagosEmpleado(
                value
            );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Pagos de empleados obtenidos correctamente.",

                total:
                    resultado
                        .pagination
                        .total,

                data:
                    resultado.data,

                pagination:
                    resultado
                        .pagination
            });

    } catch (error) {

        return manejarError(
            res,
            error,
            "No se pudieron obtener los pagos de empleados."
        );
    }
};

/* =====================================================
   OBTENER PAGO POR ID
===================================================== */

const obtenerPorId = async (
    req,
    res
) => {
    try {

        const {
            error,
            value
        } =
            pagoEmpleadoIdSchema
                .validate(
                    req.params,
                    OPCIONES_JOI
                );

        if (error) {
            return responderErrorValidacion(
                res,
                error,
                "El identificador del pago no es válido."
            );
        }

        const pago =
            await obtenerPagoEmpleadoPorId(
                value.id
            );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Pago de empleado obtenido correctamente.",

                data:
                    pago
            });

    } catch (error) {

        return manejarError(
            res,
            error,
            "No se pudo obtener el pago del empleado."
        );
    }
};

/* =====================================================
   ACTUALIZAR PAGO PENDIENTE
===================================================== */

const actualizar = async (
    req,
    res
) => {
    try {

        const validacionId =
            pagoEmpleadoIdSchema
                .validate(
                    req.params,
                    OPCIONES_JOI
                );

        if (
            validacionId.error
        ) {
            return responderErrorValidacion(
                res,
                validacionId.error,
                "El identificador del pago no es válido."
            );
        }

        const validacionBody =
            actualizarPagoEmpleadoSchema
                .validate(
                    req.body,
                    OPCIONES_JOI
                );

        if (
            validacionBody.error
        ) {
            return responderErrorValidacion(
                res,
                validacionBody.error,
                "No se pudo actualizar el pago porque existen datos inválidos."
            );
        }

        const pago =
            await actualizarPagoEmpleado(
                validacionId.value.id,
                validacionBody.value
            );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Pago pendiente actualizado correctamente.",

                data:
                    pago
            });

    } catch (error) {

        return manejarError(
            res,
            error,
            "No se pudo actualizar el pago del empleado."
        );
    }
};

/* =====================================================
   CONFIRMAR PAGO
===================================================== */

const confirmar = async (
    req,
    res
) => {
    try {

        const validacionId =
            pagoEmpleadoIdSchema
                .validate(
                    req.params,
                    OPCIONES_JOI
                );

        if (
            validacionId.error
        ) {
            return responderErrorValidacion(
                res,
                validacionId.error,
                "El identificador del pago no es válido."
            );
        }

        const validacionBody =
            confirmarPagoEmpleadoSchema
                .validate(
                    req.body,
                    OPCIONES_JOI
                );

        if (
            validacionBody.error
        ) {
            return responderErrorValidacion(
                res,
                validacionBody.error,
                "No se pudo confirmar el pago porque existen datos inválidos."
            );
        }

        const resultado =
            await confirmarPagoEmpleado(
                validacionId.value.id,
                validacionBody.value
            );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Pago confirmado correctamente. Se registró el egreso financiero y se actualizó el saldo de la cuenta.",

                data: {
                    pago:
                        resultado.pago,

                    transaccion:
                        resultado
                            .transaccion,

                    cuenta:
                        resultado.cuenta
                }
            });

    } catch (error) {

        return manejarError(
            res,
            error,
            "No se pudo confirmar el pago del empleado."
        );
    }
};

/* =====================================================
   ANULAR PAGO
===================================================== */

const anular = async (
    req,
    res
) => {
    try {

        const validacionId =
            pagoEmpleadoIdSchema
                .validate(
                    req.params,
                    OPCIONES_JOI
                );

        if (
            validacionId.error
        ) {
            return responderErrorValidacion(
                res,
                validacionId.error,
                "El identificador del pago no es válido."
            );
        }

        const validacionBody =
            anularPagoEmpleadoSchema
                .validate(
                    req.body,
                    OPCIONES_JOI
                );

        if (
            validacionBody.error
        ) {
            return responderErrorValidacion(
                res,
                validacionBody.error,
                "No se pudo anular el pago porque el motivo no es válido."
            );
        }

        const resultado =
            await anularPagoEmpleado(
                validacionId.value.id,
                validacionBody.value.motivo
            );

        /* =============================================
           PAGO PENDIENTE
        ============================================= */

        if (
            !resultado.reversion
        ) {
            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        "Pago pendiente anulado correctamente.",

                    data: {
                        pago:
                            resultado.pago,

                        reversion:
                            null
                    }
                });
        }

        /* =============================================
           PAGO PAGADO
           CON REVERSIÓN FINANCIERA
        ============================================= */

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Pago anulado correctamente. La operación financiera fue revertida y el saldo regresó a la cuenta.",

                data: {
                    pago:
                        resultado.pago,

                    reversion:
                        resultado
                            .reversion,

                    cuenta:
                        resultado.cuenta
                }
            });

    } catch (error) {

        return manejarError(
            res,
            error,
            "No se pudo anular el pago del empleado."
        );
    }
};

/* =====================================================
   REPORTE POR EMPLEADO
===================================================== */

const reportePorEmpleado =
    async (
        req,
        res
    ) => {
        try {

            const datosValidacion = {
                empleado_id:
                    req.params
                        .empleado_id,

                fecha_desde:
                    req.query
                        .fecha_desde,

                fecha_hasta:
                    req.query
                        .fecha_hasta,

                estado:
                    req.query.estado
            };

            Object.keys(
                datosValidacion
            ).forEach(
                (key) => {

                    if (
                        datosValidacion[
                        key
                        ] === undefined
                    ) {
                        delete datosValidacion[
                            key
                        ];
                    }
                }
            );

            const {
                error,
                value
            } =
                reporteEmpleadoSchema
                    .validate(
                        datosValidacion,
                        OPCIONES_JOI
                    );

            if (error) {
                return responderErrorValidacion(
                    res,
                    error,
                    "Los parámetros del reporte por empleado no son válidos."
                );
            }

            const reporte =
                await reportePagosPorEmpleado(
                    value
                );

            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        "Reporte de pagos del empleado obtenido correctamente.",

                    data:
                        reporte
                });

        } catch (error) {

            return manejarError(
                res,
                error,
                "No se pudo generar el reporte de pagos del empleado."
            );
        }
    };

/* =====================================================
   REPORTE POR OBRA
===================================================== */

const reportePorObra =
    async (
        req,
        res
    ) => {
        try {

            const datosValidacion = {
                obra_id:
                    req.params
                        .obra_id,

                fecha_desde:
                    req.query
                        .fecha_desde,

                fecha_hasta:
                    req.query
                        .fecha_hasta,

                estado:
                    req.query.estado
            };

            Object.keys(
                datosValidacion
            ).forEach(
                (key) => {

                    if (
                        datosValidacion[
                        key
                        ] === undefined
                    ) {
                        delete datosValidacion[
                            key
                        ];
                    }
                }
            );

            const {
                error,
                value
            } =
                reporteObraSchema
                    .validate(
                        datosValidacion,
                        OPCIONES_JOI
                    );

            if (error) {
                return responderErrorValidacion(
                    res,
                    error,
                    "Los parámetros del reporte por obra no son válidos."
                );
            }

            const reporte =
                await reportePagosPorObra(
                    value
                );

            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        "Reporte de pagos de la obra obtenido correctamente.",

                    data:
                        reporte
                });

        } catch (error) {

            return manejarError(
                res,
                error,
                "No se pudo generar el reporte de pagos de la obra."
            );
        }
    };

/* =====================================================
   REPORTE GENERAL DE PERSONAL
===================================================== */

const reportePersonal =
    async (
        req,
        res
    ) => {
        try {

            /*
             * Este reporte no recibe filtros
             * obligatorios desde el backend.
             *
             * Devuelve:
             *
             * - resumen general
             * - empleados
             * - obra actual
             * - asignaciones
             * - pagos realizados
             * - pagos pendientes
             */

            const resultado =
                await reporteGeneralPersonal();

            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        "Reporte general de personal obtenido correctamente.",

                    data:
                        resultado
                });

        } catch (error) {

            return manejarError(
                res,
                error,
                "No se pudo generar el reporte general de personal."
            );
        }
    };

/* =====================================================
   RESUMEN GENERAL DE PAGOS
===================================================== */

const resumen = async (
    req,
    res
) => {
    try {

        const resultado =
            await obtenerResumenPagos();

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Resumen general de pagos obtenido correctamente.",

                data:
                    resultado
            });

    } catch (error) {

        return manejarError(
            res,
            error,
            "No se pudo obtener el resumen general de pagos."
        );
    }
};

/* =====================================================
   OBTENER ASIGNACIONES ACTIVAS PARA PAGO
===================================================== */

const obtenerAsignaciones =
    async (
        req,
        res
    ) => {
        try {

            const {
                empleado_id,
                obra_id
            } = req.query;

            /* =========================================
               EMPLEADO OBLIGATORIO
            ========================================= */

            if (!empleado_id) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Debe enviar el identificador del empleado."
                    });
            }

            /* =========================================
               OBRA OBLIGATORIA
            ========================================= */

            if (!obra_id) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Debe enviar el identificador de la obra."
                    });
            }

            /* =========================================
               VALIDAR UUID
            ========================================= */

            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            if (
                !uuidRegex.test(
                    empleado_id
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "El identificador del empleado no es válido."
                    });
            }

            if (
                !uuidRegex.test(
                    obra_id
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "El identificador de la obra no es válido."
                    });
            }

            /* =========================================
               CONSULTAR
            ========================================= */

            const asignaciones =
                await obtenerAsignacionesActivasPago(
                    empleado_id,
                    obra_id
                );

            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        asignaciones.length > 0
                            ? "Asignaciones activas obtenidas correctamente."
                            : "El empleado no tiene asignaciones activas en la obra seleccionada.",

                    total:
                        asignaciones.length,

                    data:
                        asignaciones
                });

        } catch (error) {

            return manejarError(
                res,
                error,
                "No se pudieron obtener las asignaciones activas del empleado."
            );
        }
    };

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    confirmar,
    anular,
    reportePorEmpleado,
    reportePorObra,
    reportePersonal,
    resumen,
    obtenerAsignaciones
};