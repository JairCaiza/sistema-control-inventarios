const {
    crearGastoObra,
    listarGastosObra,
    obtenerGastoObraPorId,
    actualizarGastoObra,
    confirmarGastoObra,
    anularGastoObra,
    reporteGastosPorObra,
    obtenerResumenGastos
} = require("./gastoObra.service");

const {
    crearGastoObraSchema,
    actualizarGastoObraSchema,
    confirmarGastoObraSchema,
    anularGastoObraSchema,
    gastoObraIdSchema,
    listarGastosObraSchema,
    reporteGastosObraSchema,
    resumenGastosObraSchema
} = require("./gastoObra.schema");

/* =====================================================
   OPCIONES JOI
===================================================== */

const OPCIONES_JOI = {
    abortEarly: false,
    stripUnknown: true,
    convert: true
};

/* =====================================================
   FORMATEAR ERRORES JOI
===================================================== */

const formatearErroresJoi = (
    error
) => {
    if (
        !error ||
        !Array.isArray(error.details)
    ) {
        return [];
    }

    return error.details.map(
        (detalle) => ({
            campo:
                detalle.path.join("."),
            mensaje:
                detalle.message
        })
    );
};

/* =====================================================
   MANEJAR ERROR GENERAL
===================================================== */

const manejarError = (
    res,
    error,
    mensajeFallback
) => {
    console.error(
        "ERROR GASTO OBRA:",
        error
    );

    /* =================================================
       ERROR PERSONALIZADO DEL SERVICE
    ================================================= */

    if (
        error.statusCode
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

    /* =================================================
       FOREIGN KEY
    ================================================= */

    if (
        error.code === "23503"
    ) {
        return res
            .status(409)
            .json({
                success: false,
                message:
                    "No se pudo completar la operación porque existe una relación inválida con otro registro."
            });
    }

    /* =================================================
       UNIQUE
    ================================================= */

    if (
        error.code === "23505"
    ) {
        return res
            .status(409)
            .json({
                success: false,
                message:
                    "Ya existe un registro con los mismos datos únicos."
            });
    }

    /* =================================================
       CHECK CONSTRAINT
    ================================================= */

    if (
        error.code === "23514"
    ) {
        return res
            .status(400)
            .json({
                success: false,
                message:
                    "Los datos enviados no cumplen las reglas de validación de la base de datos."
            });
    }

    /* =================================================
       NOT NULL
    ================================================= */

    if (
        error.code === "23502"
    ) {
        return res
            .status(400)
            .json({
                success: false,
                message:
                    "Falta información obligatoria para completar la operación."
            });
    }

    /* =================================================
       UUID INVÁLIDO
    ================================================= */

    if (
        error.code === "22P02"
    ) {
        return res
            .status(400)
            .json({
                success: false,
                message:
                    "Uno de los identificadores enviados no tiene un formato UUID válido."
            });
    }

    /* =================================================
       ERROR GENERAL
    ================================================= */

    return res
        .status(500)
        .json({
            success: false,
            message:
                mensajeFallback ||
                "Ocurrió un error interno en el servidor."
        });
};

/* =====================================================
   CREAR GASTO
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
            crearGastoObraSchema.validate(
                req.body,
                OPCIONES_JOI
            );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Existen errores de validación.",
                    errors:
                        formatearErroresJoi(
                            error
                        )
                });
        }

        const gasto =
            await crearGastoObra(
                value
            );

        return res
            .status(201)
            .json({
                success: true,
                message:
                    "Gasto de obra registrado correctamente.",
                data:
                    gasto
            });

    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo registrar el gasto de obra."
        );
    }
};

/* =====================================================
   LISTAR GASTOS
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
            listarGastosObraSchema.validate(
                req.query,
                OPCIONES_JOI
            );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Los filtros enviados no son válidos.",
                    errors:
                        formatearErroresJoi(
                            error
                        )
                });
        }

        const resultado =
            await listarGastosObra(
                value
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Gastos de obra obtenidos correctamente.",
                data:
                    resultado.data,
                pagination:
                    resultado.pagination
            });

    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudieron obtener los gastos de obra."
        );
    }
};

/* =====================================================
   OBTENER GASTO POR ID
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
            gastoObraIdSchema.validate(
                req.params,
                OPCIONES_JOI
            );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "El identificador del gasto no es válido.",
                    errors:
                        formatearErroresJoi(
                            error
                        )
                });
        }

        const gasto =
            await obtenerGastoObraPorId(
                value.id
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Gasto de obra obtenido correctamente.",
                data:
                    gasto
            });

    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo obtener el gasto de obra."
        );
    }
};

/* =====================================================
   ACTUALIZAR GASTO
===================================================== */

const actualizar = async (
    req,
    res
) => {
    try {
        /* =================================================
           VALIDAR ID
        ================================================= */

        const {
            error:
            errorId,
            value:
            params
        } =
            gastoObraIdSchema.validate(
                req.params,
                OPCIONES_JOI
            );

        if (errorId) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "El identificador del gasto no es válido.",
                    errors:
                        formatearErroresJoi(
                            errorId
                        )
                });
        }

        /* =================================================
           VALIDAR BODY
        ================================================= */

        const {
            error:
            errorBody,
            value:
            body
        } =
            actualizarGastoObraSchema.validate(
                req.body,
                OPCIONES_JOI
            );

        if (errorBody) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Existen errores de validación.",
                    errors:
                        formatearErroresJoi(
                            errorBody
                        )
                });
        }

        const gasto =
            await actualizarGastoObra(
                params.id,
                body
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Gasto de obra actualizado correctamente.",
                data:
                    gasto
            });

    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo actualizar el gasto de obra."
        );
    }
};

/* =====================================================
   CONFIRMAR GASTO
===================================================== */

const confirmar = async (
    req,
    res
) => {
    try {
        /* =================================================
           VALIDAR ID
        ================================================= */

        const {
            error:
            errorId,
            value:
            params
        } =
            gastoObraIdSchema.validate(
                req.params,
                OPCIONES_JOI
            );

        if (errorId) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "El identificador del gasto no es válido.",
                    errors:
                        formatearErroresJoi(
                            errorId
                        )
                });
        }

        /* =================================================
           VALIDAR BODY
        ================================================= */

        const {
            error:
            errorBody,
            value:
            body
        } =
            confirmarGastoObraSchema.validate(
                req.body,
                OPCIONES_JOI
            );

        if (errorBody) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Existen errores de validación para confirmar el gasto.",
                    errors:
                        formatearErroresJoi(
                            errorBody
                        )
                });
        }

        const resultado =
            await confirmarGastoObra(
                params.id,
                body
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Gasto confirmado y registrado financieramente correctamente.",
                data:
                    resultado
            });

    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo confirmar el gasto de obra."
        );
    }
};

/* =====================================================
   ANULAR GASTO
===================================================== */

const anular = async (
    req,
    res
) => {
    try {
        /* =================================================
           VALIDAR ID
        ================================================= */

        const {
            error:
            errorId,
            value:
            params
        } =
            gastoObraIdSchema.validate(
                req.params,
                OPCIONES_JOI
            );

        if (errorId) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "El identificador del gasto no es válido.",
                    errors:
                        formatearErroresJoi(
                            errorId
                        )
                });
        }

        /* =================================================
           VALIDAR BODY
        ================================================= */

        const {
            error:
            errorBody,
            value:
            body
        } =
            anularGastoObraSchema.validate(
                req.body,
                OPCIONES_JOI
            );

        if (errorBody) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Existen errores de validación para anular el gasto.",
                    errors:
                        formatearErroresJoi(
                            errorBody
                        )
                });
        }

        const resultado =
            await anularGastoObra(
                params.id,
                body.motivo
            );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    resultado.reversion
                        ? "Gasto anulado y movimiento financiero revertido correctamente."
                        : "Gasto pendiente anulado correctamente.",

                data:
                    resultado
            });

    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo anular el gasto de obra."
        );
    }
};

/* =====================================================
   REPORTE POR OBRA
===================================================== */

const reportePorObra = async (
    req,
    res
) => {
    try {
        /*
         * El schema espera:
         *
         * obra_id
         * fecha_desde
         * fecha_hasta
         */

        const datosValidar = {
            obra_id:
                req.params.obra_id,

            fecha_desde:
                req.query.fecha_desde,

            fecha_hasta:
                req.query.fecha_hasta
        };

        const {
            error,
            value
        } =
            reporteGastosObraSchema.validate(
                datosValidar,
                OPCIONES_JOI
            );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Los parámetros del reporte no son válidos.",
                    errors:
                        formatearErroresJoi(
                            error
                        )
                });
        }

        const reporte =
            await reporteGastosPorObra(
                value.obra_id,
                {
                    fecha_desde:
                        value.fecha_desde,

                    fecha_hasta:
                        value.fecha_hasta
                }
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Reporte de gastos por obra generado correctamente.",
                data:
                    reporte
            });

    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo generar el reporte de gastos de la obra."
        );
    }
};

/* =====================================================
   RESUMEN GENERAL
===================================================== */

const resumen = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            resumenGastosObraSchema.validate(
                req.query,
                OPCIONES_JOI
            );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Los filtros del resumen no son válidos.",
                    errors:
                        formatearErroresJoi(
                            error
                        )
                });
        }

        const resultado =
            await obtenerResumenGastos(
                value
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Resumen de gastos obtenido correctamente.",
                data:
                    resultado
            });

    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo obtener el resumen de gastos de obra."
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

    reportePorObra,

    resumen
};